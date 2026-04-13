/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { AppModule } from "../src/app.module";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanNeo4jTestDb, cleanPostgresTestDb } from "./helpers/cleanup";

describe("Admin Create Flows (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: ReturnType<typeof createTestDatabaseConnections>;

  beforeAll(async () => {
    dbConnections = createTestDatabaseConnections();
    postgresPool = dbConnections.postgresPool;
    neo4jDriver = dbConnections.neo4jDriver;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await cleanPostgresTestDb(postgresPool);
    await dbConnections.close();
    await app.close();
  });

  beforeEach(async () => {
    await cleanPostgresTestDb(postgresPool);
    await cleanNeo4jTestDb(neo4jDriver);

    // Seed a minimal organization in Neo4j for admin team creation.
    const session = neo4jDriver.session();
    try {
      await session.run(
        `CREATE (o:Organization {orgId: $orgId, name: $name})`,
        { orgId: "ORG-ADMIN-001", name: "Admin Test Org" },
      );
    } finally {
      await session.close();
    }
  });

  const register = async (dto: any) => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send(dto)
      .expect(201);
    return res.body;
  };

  it("allows admin to list organizations", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const res = await request(app.getHttpServer())
      .get("/reference/organizations")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("organizations");
    expect(Array.isArray(res.body.organizations)).toBe(true);
    expect(res.body.organizations.length).toBe(1);
    expect(res.body.organizations[0]).toEqual({
      organizationId: "ORG-ADMIN-001",
      organizationName: "Admin Test Org",
    });
  });

  it("allows admin to create parent, team, and player (existing parent)", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const coach = await register({
      email: "coach@test.com",
      password: "CoachPassword123!",
      firstName: "Coach",
      lastName: "One",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    const parentRes = await request(app.getHttpServer())
      .post("/parents/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Pat",
        lastName: "Parent",
        email: "parent@test.com",
        phone: "555-0101",
        password: "ParentPassword123!",
        pseudonymId: "parent-admin-001",
      })
      .expect(201);

    expect(parentRes.body).toHaveProperty("pseudonymId", "parent-admin-001");
    expect(parentRes.body).toHaveProperty("isActive", true);

    const teamRes = await request(app.getHttpServer())
      .post("/teams/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        teamId: "TEAM-ADMIN-001",
        name: "Admin Team",
        sport: "Rugby",
        organizationId: "ORG-ADMIN-001",
        coachPseudonymId: coach.user.pseudonymId,
        ageGroup: "U23",
        gender: "Male",
      })
      .expect(201);

    expect(teamRes.body).toHaveProperty("teamId", "TEAM-ADMIN-001");
    expect(teamRes.body).toHaveProperty("sport", "Rugby");

    const playerRes = await request(app.getHttpServer())
      .post("/players/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Alex",
        lastName: "Athlete",
        email: "player@test.com",
        password: "PlayerPassword123!",
        dateOfBirth: "2000-01-01",
        coachPseudonymId: coach.user.pseudonymId,
        teamId: "TEAM-ADMIN-001",
        parentPseudonymId: "parent-admin-001",
        pseudonymId: "player-admin-001",
      })
      .expect(201);

    expect(playerRes.body).toHaveProperty(
      "message",
      "Player created successfully",
    );
    expect(playerRes.body.player).toHaveProperty(
      "pseudonymId",
      "player-admin-001",
    );
    expect(playerRes.body.player).toHaveProperty(
      "parentPseudonymId",
      "parent-admin-001",
    );
    expect(playerRes.body.player).toHaveProperty("teamId", "TEAM-ADMIN-001");
  });

  it("allows admin to create player with inline parent", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const coach = await register({
      email: "coach@test.com",
      password: "CoachPassword123!",
      firstName: "Coach",
      lastName: "Inline",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    await request(app.getHttpServer())
      .post("/teams/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        teamId: "TEAM-ADMIN-002",
        name: "Admin Team 2",
        sport: "Hurling",
        organizationId: "ORG-ADMIN-001",
        coachPseudonymId: coach.user.pseudonymId,
      })
      .expect(201);

    const playerRes = await request(app.getHttpServer())
      .post("/players/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Casey",
        lastName: "Child",
        email: "child@test.com",
        password: "PlayerPassword123!",
        dateOfBirth: "2005-05-05",
        coachPseudonymId: coach.user.pseudonymId,
        teamId: "TEAM-ADMIN-002",
        parent: {
          firstName: "Ingrid",
          lastName: "Inline",
          email: "inline.parent@test.com",
          password: "ParentPassword123!",
          phone: "555-0202",
          pseudonymId: "parent-inline-001",
        },
        pseudonymId: "player-inline-001",
      })
      .expect(201);

    expect(playerRes.body).toHaveProperty(
      "message",
      "Player created successfully",
    );
    expect(playerRes.body.player).toHaveProperty(
      "pseudonymId",
      "player-inline-001",
    );
    expect(playerRes.body.player).toHaveProperty(
      "parentPseudonymId",
      "parent-inline-001",
    );
  });

  it("rejects player create when coach does not manage selected team", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const coachA = await register({
      email: "coach.a@test.com",
      password: "CoachPassword123!",
      firstName: "Coach",
      lastName: "A",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    const coachB = await register({
      email: "coach.b@test.com",
      password: "CoachPassword123!",
      firstName: "Coach",
      lastName: "B",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    await request(app.getHttpServer())
      .post("/parents/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Pat",
        lastName: "Parent",
        email: "parent@test.com",
        password: "ParentPassword123!",
        pseudonymId: "parent-admin-002",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/teams/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        teamId: "TEAM-ADMIN-003",
        name: "Admin Team 3",
        sport: "Soccer",
        organizationId: "ORG-ADMIN-001",
        coachPseudonymId: coachA.user.pseudonymId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/players/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Alex",
        lastName: "Athlete",
        email: "player@test.com",
        password: "PlayerPassword123!",
        dateOfBirth: "2000-01-01",
        coachPseudonymId: coachB.user.pseudonymId,
        teamId: "TEAM-ADMIN-003",
        parentPseudonymId: "parent-admin-002",
      })
      .expect(400);
  });

  it("rejects player create when parent identity has no user account", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const coach = await register({
      email: "coach@test.com",
      password: "CoachPassword123!",
      firstName: "Coach",
      lastName: "NoAccount",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    // Create parent, then delete its user account to simulate an identity without an account.
    await request(app.getHttpServer())
      .post("/parents/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Pat",
        lastName: "Parent",
        email: "parent@test.com",
        password: "ParentPassword123!",
        pseudonymId: "parent-noacct-001",
      })
      .expect(201);

    await postgresPool.query(
      "DELETE FROM user_accounts WHERE pseudonym_id = $1 AND identity_type = 'parent'",
      ["parent-noacct-001"],
    );

    await request(app.getHttpServer())
      .post("/teams/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        teamId: "TEAM-ADMIN-004",
        name: "Admin Team 4",
        sport: "Basketball",
        organizationId: "ORG-ADMIN-001",
        coachPseudonymId: coach.user.pseudonymId,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/players/admin")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "Alex",
        lastName: "Athlete",
        email: "player@test.com",
        password: "PlayerPassword123!",
        dateOfBirth: "2000-01-01",
        coachPseudonymId: coach.user.pseudonymId,
        teamId: "TEAM-ADMIN-004",
        parentPseudonymId: "parent-noacct-001",
      })
      .expect(400);
  });
});

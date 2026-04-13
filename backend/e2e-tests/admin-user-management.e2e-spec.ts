/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { AppModule } from "../src/app.module";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanNeo4jTestDb, cleanPostgresTestDb } from "./helpers/cleanup";

describe("Admin User Management (E2E)", () => {
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
  });

  const register = async (dto: any) => {
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send(dto)
      .expect(201);
    return res.body;
  };

  const login = async (email: string, password: string) => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password });
    return res;
  };

  it("allows admin to GET/PATCH coach profile", async () => {
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
      lastName: "Original",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    const coachPseudonymId = coach.user.pseudonymId;

    const getRes = await request(app.getHttpServer())
      .get(`/coaches/admin/${coachPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(getRes.body).toHaveProperty("pseudonymId", coachPseudonymId);
    expect(getRes.body).toHaveProperty("email", "coach@test.com");
    expect(getRes.body).toHaveProperty("firstName");
    expect(getRes.body).toHaveProperty("lastName");
    expect(getRes.body).toHaveProperty("isActive", true);

    const patchRes = await request(app.getHttpServer())
      .patch(`/coaches/admin/${coachPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "CoachUpdated",
        lastName: "Updated",
        email: "coach.updated@test.com",
        isActive: false,
      })
      .expect(200);

    expect(patchRes.body.pseudonymId).toBe(coachPseudonymId);
    expect(patchRes.body.firstName).toBe("CoachUpdated");
    expect(patchRes.body.lastName).toBe("Updated");
    expect(patchRes.body.email).toBe("coach.updated@test.com");
    expect(patchRes.body.isActive).toBe(false);
  });

  it("rejects coach email update when email already exists", async () => {
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
      lastName: "Original",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    await register({
      email: "player@test.com",
      password: "PlayerPassword123!",
      firstName: "Player",
      lastName: "User",
      dateOfBirth: "2000-01-01",
      identityType: "player",
    });

    await request(app.getHttpServer())
      .patch(`/coaches/admin/${coach.user.pseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ email: "player@test.com" })
      .expect(409);
  });

  it("allows admin to GET/PATCH parent profile", async () => {
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
      lastName: "Inviter",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    const inviteRes = await request(app.getHttpServer())
      .post("/parents/invite")
      .set("Authorization", `Bearer ${coach.accessToken}`)
      .send({ parentEmail: "parent@test.com", parentPhone: "555-1234" })
      .expect(201);

    const acceptRes = await request(app.getHttpServer())
      .post("/parents/accept")
      .send({
        token: inviteRes.body.token,
        pseudonymId: "parent-edit-001",
        firstName: "Parent",
        lastName: "Original",
        password: "ParentPassword123!",
      })
      .expect(201);

    const parentPseudonymId = acceptRes.body.pseudonymId;

    const getRes = await request(app.getHttpServer())
      .get(`/parents/admin/${parentPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(getRes.body).toHaveProperty("pseudonymId", parentPseudonymId);
    expect(getRes.body).toHaveProperty("email", "parent@test.com");
    expect(getRes.body).toHaveProperty("phone", "555-1234");
    expect(getRes.body).toHaveProperty("isActive", true);

    const patchRes = await request(app.getHttpServer())
      .patch(`/parents/admin/${parentPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "ParentUpdated",
        lastName: "Updated",
        phone: "555-0000",
        isActive: false,
      })
      .expect(200);

    expect(patchRes.body.firstName).toBe("ParentUpdated");
    expect(patchRes.body.lastName).toBe("Updated");
    expect(patchRes.body.phone).toBe("555-0000");
    expect(patchRes.body.isActive).toBe(false);
  });

  it("allows admin to GET/PATCH player profile", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const player = await register({
      email: "player@test.com",
      password: "PlayerPassword123!",
      firstName: "Player",
      lastName: "Original",
      dateOfBirth: "2000-01-01",
      identityType: "player",
    });

    const playerPseudonymId = player.user.pseudonymId;

    const getRes = await request(app.getHttpServer())
      .get(`/players/admin/${playerPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(getRes.body).toHaveProperty("pseudonymId", playerPseudonymId);
    expect(getRes.body).toHaveProperty("email", "player@test.com");
    expect(getRes.body).toHaveProperty("isActive", true);

    const patchRes = await request(app.getHttpServer())
      .patch(`/players/admin/${playerPseudonymId}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({
        firstName: "PlayerUpdated",
        lastName: "Updated",
        email: "player.updated@test.com",
        isActive: false,
      })
      .expect(200);

    expect(patchRes.body.firstName).toBe("PlayerUpdated");
    expect(patchRes.body.lastName).toBe("Updated");
    expect(patchRes.body.email).toBe("player.updated@test.com");
    expect(patchRes.body.isActive).toBe(false);
  });

  it("allows admin to reset a user password and login with temp password", async () => {
    const admin = await register({
      email: "admin@test.com",
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: "1980-01-01",
      identityType: "admin",
    });

    const playerPassword = "PlayerPassword123!";
    const player = await register({
      email: "player@test.com",
      password: playerPassword,
      firstName: "Player",
      lastName: "User",
      dateOfBirth: "2000-01-01",
      identityType: "player",
    });

    const playerPseudonymId = player.user.pseudonymId;

    const resetRes = await request(app.getHttpServer())
      .post(`/auth/admin/users/${playerPseudonymId}/reset-password`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .expect(201);

    expect(resetRes.body).toHaveProperty("temporaryPassword");
    const temporaryPassword = resetRes.body.temporaryPassword;

    const oldLogin = await login("player@test.com", playerPassword);
    expect(oldLogin.status).toBe(401);

    const newLogin = await login("player@test.com", temporaryPassword);
    expect(newLogin.status).toBe(200);
    expect(newLogin.body).toHaveProperty("accessToken");
  });
});

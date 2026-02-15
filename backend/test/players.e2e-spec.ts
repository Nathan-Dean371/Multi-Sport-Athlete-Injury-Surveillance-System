/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanPostgresTestDb, cleanNeo4jTestDb } from "./helpers/cleanup";

describe("Players (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: ReturnType<typeof createTestDatabaseConnections>;
  let authToken: string;

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
    await dbConnections.close();
    await app.close();
  });

  const registerAndLogin = async () => {
    await request(app.getHttpServer()).post("/auth/register").send({
      email: "coach@test.com",
      password: "TestPassword123!",
      firstName: "Coach",
      lastName: "User",
      dateOfBirth: "1985-01-01",
      identityType: "coach",
    });

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "coach@test.com", password: "TestPassword123!" });

    authToken = loginResponse.body.accessToken;
  };

  describe("GET /players", () => {
    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      await registerAndLogin();

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (t:Team {teamId: $teamId, name: $teamName, sport: $sport})
          CREATE (p1:Player {
            playerId: $playerId1,
            pseudonymId: $pseudonymId1,
            name: $name1,
            position: $position1,
            dateOfBirth: date($dob1),
            ageGroup: $ageGroup1,
            isActive: true
          })
          CREATE (p2:Player {
            playerId: $playerId2,
            pseudonymId: $pseudonymId2,
            name: $name2,
            position: $position2,
            dateOfBirth: date($dob2),
            ageGroup: $ageGroup2,
            isActive: false
          })
          CREATE (p1)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEAM-001",
            teamName: "Test United",
            sport: "Test Sport",
            playerId1: "PLAYER-001",
            pseudonymId1: "PSY-PLAYER-001",
            name1: "Alice Alpha",
            position1: "Forward",
            dob1: "2000-01-01",
            ageGroup1: "Senior",
            playerId2: "PLAYER-002",
            pseudonymId2: "PSY-PLAYER-002",
            name2: "Bob Bravo",
            position2: "Defender",
            dob2: "2001-02-02",
            ageGroup2: "Senior",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should return all players", async () => {
      const response = await request(app.getHttpServer())
        .get("/players")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.players)).toBe(true);
      expect(response.body.total).toBe(2);

      const player1 = response.body.players.find(
        (player: { playerId: string }) => player.playerId === "PLAYER-001",
      );
      const player2 = response.body.players.find(
        (player: { playerId: string }) => player.playerId === "PLAYER-002",
      );

      expect(player1).toBeDefined();
      expect(player1.name).toBe("Alice Alpha");
      expect(player1.teamName).toBe("Test United");
      expect(player1.isActive).toBe(true);

      expect(player2).toBeDefined();
      expect(player2.name).toBe("Bob Bravo");
      expect(player2.teamName).toBeNull();
      expect(player2.isActive).toBe(false);
    });

    it("should reject requests without authentication", async () => {
      await request(app.getHttpServer()).get("/players").expect(401);
    });
  });

  describe("GET /players/:id", () => {
    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      await registerAndLogin();

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (t:Team {teamId: $teamId, name: $teamName, sport: $sport})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            name: $name,
            position: $position,
            jerseyNumber: $jerseyNumber,
            dateOfBirth: date($dob),
            ageGroup: $ageGroup,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEAM-002",
            teamName: "Test City",
            sport: "Test Sport",
            playerId: "PLAYER-010",
            pseudonymId: "PSY-PLAYER-010",
            name: "Rory Runner",
            position: "Midfield",
            jerseyNumber: "8",
            dob: "1999-05-05",
            ageGroup: "Senior",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should return player details", async () => {
      const response = await request(app.getHttpServer())
        .get("/players/PSY-PLAYER-010")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.playerId).toBe("PLAYER-010");
      expect(response.body.name).toBe("Rory Runner");
      expect(response.body.position).toBe("Midfield");
      expect(response.body.jerseyNumber).toBe("8");
      expect(response.body.teamId).toBe("TEAM-002");
      expect(response.body.teamName).toBe("Test City");
      expect(response.body.team).toBeDefined();
      expect(response.body.team.teamId).toBe("TEAM-002");
      expect(response.body.team.teamName).toBe("Test City");
      expect(response.body.team.sport).toBe("Test Sport");
    });

    it("should return 404 for unknown player", async () => {
      await request(app.getHttpServer())
        .get("/players/PSY-PLAYER-404")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("GET /players/:id/injuries", () => {
    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      await registerAndLogin();

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            name: $name,
            position: $position,
            isActive: true
          })
          CREATE (i1:Injury {
            injuryId: $injuryId1,
            injuryType: $injuryType1,
            bodyPart: $bodyPart1,
            side: $side1,
            severity: $severity1,
            status: $status1,
            injuryDate: date($injuryDate1),
            expectedReturnDate: date($expectedReturnDate1),
            mechanism: $mechanism1,
            diagnosis: $diagnosis1,
            treatmentPlan: $treatmentPlan1,
            notes: $notes1
          })
          CREATE (i2:Injury {
            injuryId: $injuryId2,
            injuryType: $injuryType2,
            bodyPart: $bodyPart2,
            severity: $severity2,
            status: $status2,
            injuryDate: date($injuryDate2)
          })
          CREATE (p)-[:SUSTAINED {diagnosedDate: date($diagnosedDate1), reportedBy: $reportedBy1}]->(i1)
          CREATE (p)-[:SUSTAINED {diagnosedDate: date($diagnosedDate2), reportedBy: $reportedBy2}]->(i2)
        `,
          {
            playerId: "PLAYER-020",
            pseudonymId: "PSY-PLAYER-020",
            name: "Injury Case",
            position: "Forward",
            injuryId1: "INJ-020-1",
            injuryType1: "Hamstring Strain",
            bodyPart1: "Hamstring",
            side1: "Left",
            severity1: "Moderate",
            status1: "Active",
            injuryDate1: "2026-02-10",
            expectedReturnDate1: "2026-03-01",
            mechanism1: "Overuse",
            diagnosis1: "Grade 2 strain",
            treatmentPlan1: "RICE",
            notes1: "Test notes",
            injuryId2: "INJ-020-2",
            injuryType2: "Ankle Sprain",
            bodyPart2: "Ankle",
            severity2: "Minor",
            status2: "Recovering",
            injuryDate2: "2026-02-12",
            diagnosedDate1: "2026-02-11",
            reportedBy1: "COACH-001",
            diagnosedDate2: "2026-02-12",
            reportedBy2: "COACH-002",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should return player injuries", async () => {
      const response = await request(app.getHttpServer())
        .get("/players/PSY-PLAYER-020/injuries")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.playerId).toBe("PLAYER-020");
      expect(response.body.playerName).toBe("Injury Case");
      expect(response.body.total).toBe(2);

      const injury1 = response.body.injuries.find(
        (injury: { injuryId: string }) => injury.injuryId === "INJ-020-1",
      );
      const injury2 = response.body.injuries.find(
        (injury: { injuryId: string }) => injury.injuryId === "INJ-020-2",
      );

      expect(injury1).toBeDefined();
      expect(injury1.injuryType).toBe("Hamstring Strain");
      expect(injury1.severity).toBe("Moderate");
      expect(injury1.status).toBe("Active");
      expect(injury1.reportedBy).toBe("COACH-001");

      expect(injury2).toBeDefined();
      expect(injury2.injuryType).toBe("Ankle Sprain");
      expect(injury2.severity).toBe("Minor");
      expect(injury2.status).toBe("Recovering");
      expect(injury2.reportedBy).toBe("COACH-002");
    });

    it("should return 404 for unknown player injuries", async () => {
      await request(app.getHttpServer())
        .get("/players/PSY-PLAYER-404/injuries")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

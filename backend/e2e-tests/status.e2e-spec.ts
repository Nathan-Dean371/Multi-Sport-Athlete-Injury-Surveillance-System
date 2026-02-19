/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanPostgresTestDb, cleanNeo4jTestDb } from "./helpers/cleanup";

describe("Status (E2E)", () => {
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
    await dbConnections.close();
    await app.close();
  });

  describe("PATCH /status/players/:playerId/status", () => {
    let playerToken: string;
    let coachToken: string;
    let playerPseudonymId: string;
    let playerNeo4jId: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      const playerRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Player",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      playerPseudonymId = playerRegister.body.user.pseudonymId;

      const playerIdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId],
      );
      playerNeo4jId = playerIdResult.rows[0].neo4j_player_id;

      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player@test.com", password: "TestPassword123!" });

      playerToken = playerLogin.body.accessToken;

      const coachRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "coach@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Coach",
          dateOfBirth: "1985-01-01",
          identityType: "coach",
        });

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            firstName: $firstName,
            lastName: $lastName,
            position: $position,
            isActive: true
          })
        `,
          {
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonymId,
            firstName: "Test",
            lastName: "Player",
            position: "Forward",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should allow a player to update their own status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/status/players/${playerPseudonymId}/status`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ status: "GREEN", notes: "Feeling good" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.playerId).toBe(playerNeo4jId);
      expect(response.body.data.playerName).toBe("Test Player");
      expect(response.body.data.status).toBe("GREEN");
      expect(response.body.data.notes).toBe("Feeling good");

      const session = neo4jDriver.session();
      try {
        const result = await session.run(
          `
          MATCH (p:Player {pseudonymId: $pseudonymId})-[:HAS_STATUS]->(s:StatusUpdate)
          RETURN count(s) as statusCount
        `,
          { pseudonymId: playerPseudonymId },
        );

        const count = result.records[0].get("statusCount");
        expect(count.toNumber ? count.toNumber() : count).toBe(1);
      } finally {
        await session.close();
      }
    });

    it("should allow a coach to update any player status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/status/players/${playerPseudonymId}/status`)
        .set("Authorization", `Bearer ${coachToken}`)
        .send({ status: "ORANGE", notes: "Minor tightness" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.playerId).toBe(playerNeo4jId);
      expect(response.body.data.status).toBe("ORANGE");
    });

    it("should forbid a player from updating another player", async () => {
      await request(app.getHttpServer())
        .patch("/status/players/OTHER-PLAYER/status")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ status: "GREEN" })
        .expect(403);
    });

    it("should reject invalid status values", async () => {
      await request(app.getHttpServer())
        .patch(`/status/players/${playerPseudonymId}/status`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ status: "BLUE" })
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .patch(`/status/players/${playerPseudonymId}/status`)
        .send({ status: "GREEN" })
        .expect(401);
    });
  });

  describe("GET /status/latest", () => {
    let coachToken: string;
    let playerToken: string;
    let coachPseudonymId: string;
    let playerPseudonymId1: string;
    let playerPseudonymId2: string;
    let playerNeo4jId1: string;
    let playerNeo4jId2: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      const coachRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "coach@test.com",
          password: "TestPassword123!",
          firstName: "Coach",
          lastName: "User",
          dateOfBirth: "1985-01-01",
          identityType: "coach",
        });

      coachPseudonymId = coachRegister.body.user.pseudonymId;

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      const player1Register = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player1@test.com",
          password: "TestPassword123!",
          firstName: "Alice",
          lastName: "Alpha",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      playerPseudonymId1 = player1Register.body.user.pseudonymId;

      const player2Register = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player2@test.com",
          password: "TestPassword123!",
          firstName: "Bob",
          lastName: "Bravo",
          dateOfBirth: "2000-02-02",
          identityType: "player",
        });

      playerPseudonymId2 = player2Register.body.user.pseudonymId;

      const player1IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId1],
      );
      playerNeo4jId1 = player1IdResult.rows[0].neo4j_player_id;

      const player2IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId2],
      );
      playerNeo4jId2 = player2IdResult.rows[0].neo4j_player_id;

      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player1@test.com", password: "TestPassword123!" });

      playerToken = playerLogin.body.accessToken;

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (o:Organization {orgId: $orgId, name: $orgName})
          CREATE (sp:Sport {sportId: $sportId, name: $sportName})
          CREATE (t:Team {teamId: $teamId, name: $teamName})
          CREATE (t)-[:BELONGS_TO]->(o)
          CREATE (t)-[:PLAYS]->(sp)

          CREATE (c:Coach {coachId: $coachId, pseudonymId: $coachPseudo})
          CREATE (c)-[:MANAGES]->(t)

          CREATE (p1:Player {
            playerId: $playerId1,
            pseudonymId: $playerPseudo1,
            firstName: $firstName1,
            lastName: $lastName1
          })
          CREATE (p2:Player {
            playerId: $playerId2,
            pseudonymId: $playerPseudo2,
            firstName: $firstName2,
            lastName: $lastName2
          })
          CREATE (p1)-[:PLAYS_FOR]->(t)
          CREATE (p2)-[:PLAYS_FOR]->(t)

          CREATE (s1:StatusUpdate {status: $status1, date: date(), notes: $notes1})
          CREATE (s2:StatusUpdate {status: $status2, date: date(), notes: $notes2})
          CREATE (p1)-[:HAS_STATUS]->(s1)
          CREATE (p2)-[:HAS_STATUS]->(s2)

          CREATE (i1:Injury {injuryId: $injuryId1, isResolved: false})
          CREATE (p2)-[:SUSTAINED]->(i1)
        `,
          {
            orgId: "ORG-001",
            orgName: "Test Organization",
            sportId: "SPORT-001",
            sportName: "Test Sport",
            teamId: "TEAM-001",
            teamName: "Test United",
            coachId: "COACH-001",
            coachPseudo: coachPseudonymId,
            playerId1: playerNeo4jId1,
            playerPseudo1: playerPseudonymId1,
            firstName1: "Alice",
            lastName1: "Alpha",
            playerId2: playerNeo4jId2,
            playerPseudo2: playerPseudonymId2,
            firstName2: "Bob",
            lastName2: "Bravo",
            status1: "GREEN",
            notes1: "Ready",
            status2: "RED",
            notes2: "Injured",
            injuryId1: "INJ-001",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should return latest team statuses for a coach", async () => {
      const response = await request(app.getHttpServer())
        .get("/status/latest")
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(Array.isArray(response.body.teams)).toBe(true);
      expect(response.body.teams.length).toBe(1);

      const team = response.body.teams[0];
      expect(team.teamId).toBe("TEAM-001");
      expect(team.teamName).toBe("Test United");
      expect(team.sport).toBe("Test Sport");
      expect(team.players.length).toBe(2);

      expect(team.statusCounts.green).toBe(1);
      expect(team.statusCounts.red).toBe(1);
      expect(team.statusCounts.orange).toBe(0);
      expect(team.statusCounts.noStatus).toBe(0);

      const player1 = team.players.find(
        (player: { playerId: string }) => player.playerId === playerNeo4jId1,
      );
      const player2 = team.players.find(
        (player: { playerId: string }) => player.playerId === playerNeo4jId2,
      );

      expect(player1).toBeDefined();
      expect(player1.currentStatus).toBe("GREEN");
      expect(player1.activeInjuryCount).toBe(0);

      expect(player2).toBeDefined();
      expect(player2.currentStatus).toBe("RED");
      expect(player2.activeInjuryCount).toBe(1);
    });

    it("should forbid access for players", async () => {
      await request(app.getHttpServer())
        .get("/status/latest")
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(403);
    });
  });

  describe("GET /status/players/:playerId/history", () => {
    let playerToken: string;
    let coachToken: string;
    let playerPseudonymId: string;
    let playerNeo4jId: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      const playerRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
          firstName: "History",
          lastName: "Player",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      playerPseudonymId = playerRegister.body.user.pseudonymId;

      const playerIdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId],
      );
      playerNeo4jId = playerIdResult.rows[0].neo4j_player_id;

      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player@test.com", password: "TestPassword123!" });

      playerToken = playerLogin.body.accessToken;

      const coachRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "coach@test.com",
          password: "TestPassword123!",
          firstName: "History",
          lastName: "Coach",
          dateOfBirth: "1985-01-01",
          identityType: "coach",
        });

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      const session = neo4jDriver.session();
      try {
        await session.run(
          `
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            firstName: $firstName,
            lastName: $lastName
          })
          CREATE (s1:StatusUpdate {
            id: $statusId1,
            status: $status1,
            date: date($date1),
            timestamp: datetime($timestamp1),
            notes: $notes1
          })
          CREATE (s2:StatusUpdate {
            id: $statusId2,
            status: $status2,
            date: date($date2),
            timestamp: datetime($timestamp2),
            notes: $notes2
          })
          CREATE (p)-[:HAS_STATUS]->(s1)
          CREATE (p)-[:HAS_STATUS]->(s2)
        `,
          {
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonymId,
            firstName: "History",
            lastName: "Player",
            statusId1: "STATUS-001",
            status1: "ORANGE",
            date1: "2026-02-10",
            timestamp1: "2026-02-10T09:00:00Z",
            notes1: "Tightness",
            statusId2: "STATUS-002",
            status2: "GREEN",
            date2: "2026-02-12",
            timestamp2: "2026-02-12T09:00:00Z",
            notes2: "Recovered",
          },
        );
      } finally {
        await session.close();
      }
    });

    it("should return player status history", async () => {
      const response = await request(app.getHttpServer())
        .get(`/status/players/${playerPseudonymId}/history`)
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body.playerId).toBe(playerPseudonymId);
      expect(response.body.total).toBe(2);
      expect(response.body.statusHistory.length).toBe(2);

      const mostRecent = response.body.statusHistory[0];
      expect(mostRecent.status).toBe("GREEN");
      expect(mostRecent.notes).toBe("Recovered");
    });

    it("should allow coaches to view player history", async () => {
      const response = await request(app.getHttpServer())
        .get(`/status/players/${playerPseudonymId}/history`)
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.playerId).toBe(playerPseudonymId);
      expect(response.body.total).toBe(2);
    });

    it("should return 404 for unknown player", async () => {
      await request(app.getHttpServer())
        .get("/status/players/PSY-PLAYER-404/history")
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(404);
    });
  });
});

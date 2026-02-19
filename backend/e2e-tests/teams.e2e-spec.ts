/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanPostgresTestDb, cleanNeo4jTestDb } from "./helpers/cleanup";

describe("Teams (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: ReturnType<typeof createTestDatabaseConnections>;

  let playerToken: string;
  let coachToken: string;
  let playerPseudonymId1: string;
  let playerPseudonymId2: string;
  let teamId: string;

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

  describe("GET /teams", () => {
    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      teamId = "TEAM-001";

      // Base Neo4j team setup
      const baseSession = neo4jDriver.session();
      try {
        await baseSession.run(
          `
          CREATE (o:Organization {orgId: $orgId, name: $orgName})
          CREATE (sp:Sport {sportId: $sportId, name: $sportName})
          CREATE (t:Team {
            teamId: $teamId,
            name: $teamName,
            ageGroup: $ageGroup,
            gender: $gender,
            seasonStart: $seasonStart,
            seasonEnd: $seasonEnd
          })
          CREATE (t)-[:BELONGS_TO]->(o)
          CREATE (t)-[:PLAYS]->(sp)
        `,
          {
            orgId: "ORG-001",
            orgName: "Test Organization",
            sportId: "SPORT-001",
            sportName: "Test Sport",
            teamId,
            teamName: "Test United",
            ageGroup: "Senior",
            gender: "Male",
            seasonStart: "2026-01-01",
            seasonEnd: "2026-12-31",
          },
        );
      } finally {
        await baseSession.close();
      }

      // Register players
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

      // Get Neo4j player IDs from PostgreSQL
      const player1IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId1],
      );
      const player1Neo4jId = player1IdResult.rows[0].neo4j_player_id;

      const player2IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId2],
      );
      const player2Neo4jId = player2IdResult.rows[0].neo4j_player_id;

      // Register coach
      const coachRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "coach@test.com",
          password: "TestPassword123!",
          firstName: "Casey",
          lastName: "Coach",
          dateOfBirth: "1985-01-01",
          identityType: "coach",
        });

      const coachPseudonymId = coachRegister.body.user.pseudonymId;

      const coachIdResult = await postgresPool.query(
        "SELECT neo4j_coach_id FROM coach_identities WHERE pseudonym_id = $1",
        [coachPseudonymId],
      );
      const coachNeo4jId = coachIdResult.rows[0].neo4j_coach_id;

      // Create Neo4j players, coach, status, injuries, and relationships
      const dataSession = neo4jDriver.session();
      try {
        await dataSession.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p1:Player {
            playerId: $player1Id,
            pseudonymId: $player1Pseudo,
            position: $player1Position
          })
          CREATE (p2:Player {
            playerId: $player2Id,
            pseudonymId: $player2Pseudo,
            position: $player2Position
          })
          CREATE (p1)-[:PLAYS_FOR]->(t)
          CREATE (p2)-[:PLAYS_FOR]->(t)

          CREATE (c:Coach {
            coachId: $coachId,
            pseudonymId: $coachPseudo,
            specialization: $coachSpec
          })
          CREATE (c)-[:MANAGES]->(t)

          CREATE (s:StatusUpdate {status: $status, notes: $statusNotes, date: date()})
          CREATE (p1)-[:HAS_STATUS]->(s)

          CREATE (i1:Injury {injuryId: $injuryId1, isResolved: false})
          CREATE (i2:Injury {injuryId: $injuryId2, isResolved: false})
          CREATE (p1)-[:SUSTAINED]->(i1)
          CREATE (p1)-[:SUSTAINED]->(i2)
        `,
          {
            teamId,
            player1Id: player1Neo4jId,
            player1Pseudo: playerPseudonymId1,
            player1Position: "Forward",
            player2Id: player2Neo4jId,
            player2Pseudo: playerPseudonymId2,
            player2Position: "Defender",
            coachId: coachNeo4jId,
            coachPseudo: coachPseudonymId,
            coachSpec: "Physiotherapy",
            status: "GREEN",
            statusNotes: "Feeling good",
            injuryId1: "INJ-TEAM-001",
            injuryId2: "INJ-TEAM-002",
          },
        );
      } finally {
        await dataSession.close();
      }

      // Login for tokens
      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player1@test.com", password: "TestPassword123!" });

      playerToken = playerLogin.body.accessToken;

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;
    });

    it("should return teams for the current coach", async () => {
      const response = await request(app.getHttpServer())
        .get("/teams/coach/my-teams")
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].teamId).toBe(teamId);
      expect(response.body[0].name).toBe("Test United");
      expect(response.body[0].organizationName).toBe("Test Organization");
    });

    it("should return team roster for a coach", async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${teamId}/players`)
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.teamId).toBe(teamId);
      expect(response.body.players.length).toBe(2);
      expect(response.body.playersReportedToday).toBe(1);

      const player1 = response.body.players.find(
        (player: { pseudonymId: string }) =>
          player.pseudonymId === playerPseudonymId1,
      );
      const player2 = response.body.players.find(
        (player: { pseudonymId: string }) =>
          player.pseudonymId === playerPseudonymId2,
      );

      expect(player1).toBeDefined();
      expect(player1.firstName).toBe("Alice");
      expect(player1.lastName).toBe("Alpha");
      expect(player1.activeInjuryCount).toBe(2);

      expect(player2).toBeDefined();
      expect(player2.firstName).toBe("Bob");
      expect(player2.lastName).toBe("Bravo");
      expect(player2.activeInjuryCount).toBe(0);
    });

    it("should forbid roster access for players", async () => {
      await request(app.getHttpServer())
        .get(`/teams/${teamId}/players`)
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(403);
    });

    it("should return team details for authenticated users", async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${teamId}`)
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body.teamId).toBe(teamId);
      expect(response.body.name).toBe("Test United");
      expect(response.body.organizationName).toBe("Test Organization");
      expect(response.body.playerCount).toBe(2);
      expect(response.body.coaches.length).toBe(1);
      expect(response.body.coaches[0].pseudonymId).toBeDefined();
    });

    it("should return 404 for unknown team details", async () => {
      await request(app.getHttpServer())
        .get("/teams/TEAM-404")
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(404);
    });
  });
});

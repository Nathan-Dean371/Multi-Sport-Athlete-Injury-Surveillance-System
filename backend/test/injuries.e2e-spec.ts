/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanPostgresTestDb, cleanNeo4jTestDb } from "./helpers/cleanup";

describe("Injuries (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: any;

  // Test user tokens
  let playerToken: string;
  let coachToken: string;
  let adminToken: string;

  // Test data IDs
  let playerPseudonymId: string;
  let playerNeo4jId: string;
  let teamId: string;
  let createdInjuryId: string;

  beforeAll(async () => {
    // Create test database connections
    dbConnections = createTestDatabaseConnections();
    postgresPool = dbConnections.postgresPool;
    neo4jDriver = dbConnections.neo4jDriver;

    // Create NestJS testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
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

  describe("POST /injuries (Create Injury)", () => {
    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      // Create test team in Neo4j
      const neo4jSession = neo4jDriver.session();
      try {
        await neo4jSession.run(`
          CREATE (t:Team {
            teamId: 'TEST-TEAM-001',
            teamName: 'Test United',
            ageGroup: 'Senior',
            isActive: true
          })
        `);
        teamId = "TEST-TEAM-001";
      } finally {
        await neo4jSession.close();
      }

      // Register and login as player
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

      // Get Neo4j player ID from PostgreSQL
      const playerIdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId],
      );
      playerNeo4jId = playerIdResult.rows[0].neo4j_player_id;

      // Create player node in Neo4j (registration only creates PostgreSQL records)
      const playerSession = neo4jDriver.session();
      try {
        await playerSession.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonymId,
            playerName: "Test Player",
            dateOfBirth: "2000-01-01",
          },
        );
      } finally {
        await playerSession.close();
      }

      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
        });

      playerToken = playerLogin.body.accessToken;

      // Register and login as coach
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

      if (coachRegister.status !== 201) {
        console.log(
          "Coach registration failed:",
          coachRegister.status,
          coachRegister.body,
        );
      }

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "coach@test.com",
          password: "TestPassword123!",
        });

      if (coachLogin.status !== 200) {
        console.log("Coach login failed:", coachLogin.status, coachLogin.body);
      }

      coachToken = coachLogin.body.accessToken;
      console.log("Coach token:", coachToken ? "SET" : "UNDEFINED");

      // Register and login as admin
      const adminRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "admin@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Admin",
          dateOfBirth: "1980-01-01",
          identityType: "admin",
        });

      const adminLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "admin@test.com",
          password: "TestPassword123!",
        });

      adminToken = adminLogin.body.accessToken;
    });

    it("should allow player to create injury report for themselves", async () => {
      const response = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonymId,
          injuryType: "Hamstring Strain",
          bodyPart: "Hamstring",
          side: "Left",
          severity: "Moderate",
          injuryDate: "2026-02-10",
          expectedReturnDate: "2026-03-15",
          mechanism: "Overuse",
          diagnosis: "Grade 2 hamstring strain",
          treatmentPlan: "RICE protocol, physical therapy 3x/week",
          notes: "Player reported pain during sprint training",
        });

      if (response.status !== 201) {
        console.log(
          "Player create injury failed:",
          response.status,
          response.body,
        );
      }

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty("injuryId");
      expect(response.body.injuryType).toBe("Hamstring Strain");
      expect(response.body.severity).toBe("Moderate");
      expect(response.body.status).toBe("Active");
      expect(response.body.player).toHaveProperty("pseudonymId");

      createdInjuryId = response.body.injuryId;

      // Verify injury exists in Neo4j
      const neo4jSession = neo4jDriver.session();
      try {
        const result = await neo4jSession.run(
          "MATCH (i:Injury {injuryId: $injuryId}) RETURN i",
          { injuryId: createdInjuryId },
        );
        expect(result.records.length).toBe(1);
        expect(result.records[0].get("i").properties.injuryType).toBe(
          "Hamstring Strain",
        );
      } finally {
        await neo4jSession.close();
      }
    });

    it("should allow coach to create injury report for any player", async () => {
      const response = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${coachToken}`)
        .send({
          playerId: playerPseudonymId,
          injuryType: "Ankle Sprain",
          bodyPart: "Ankle",
          side: "Right",
          severity: "Minor",
          injuryDate: "2026-02-14",
          mechanism: "Contact",
        })
        .expect(201);

      expect(response.body).toHaveProperty("injuryId");
      expect(response.body.injuryType).toBe("Ankle Sprain");
      expect(response.body.player).toHaveProperty("pseudonymId");
    });

    it("should allow admin to create injury report", async () => {
      const response = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          playerId: playerPseudonymId,
          injuryType: "Concussion",
          bodyPart: "Head",
          severity: "Severe",
          injuryDate: "2026-02-13",
        })
        .expect(201);

      expect(response.body).toHaveProperty("injuryId");
      expect(response.body.injuryType).toBe("Concussion");
      expect(response.body.severity).toBe("Severe");
    });

    it("should reject injury creation without authentication", async () => {
      await request(app.getHttpServer())
        .post("/injuries")
        .send({
          playerId: playerPseudonymId,
          injuryType: "Test Injury",
          bodyPart: "Test",
          severity: "Minor",
          injuryDate: "2026-02-14",
        })
        .expect(401);
    });

    it("should validate required fields", async () => {
      const response = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonymId,
          // Missing injuryType, bodyPart, severity, injuryDate
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it("should validate severity enum", async () => {
      const response = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonymId,
          injuryType: "Test Injury",
          bodyPart: "Test",
          severity: "Invalid",
          injuryDate: "2026-02-14",
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("GET /injuries (Query Injuries)", () => {
    let injury1Id: string;
    let injury2Id: string;
    let otherPlayerPseudonymId: string;
    let otherPlayerNeo4jId: string;
    let otherPlayerToken: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      // Create test team
      const neo4jSession = neo4jDriver.session();
      try {
        await neo4jSession.run(`
          CREATE (t:Team {
            teamId: 'TEST-TEAM-001',
            teamName: 'Test United',
            ageGroup: 'Senior',
            isActive: true
          })
        `);
      } finally {
        await neo4jSession.close();
      }

      // Register players
      const player1Register = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player1@test.com",
          password: "TestPassword123!",
          firstName: "Player",
          lastName: "One",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      playerPseudonymId = player1Register.body.user.pseudonymId;

      // Get Neo4j player ID from PostgreSQL
      const player1IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonymId],
      );
      playerNeo4jId = player1IdResult.rows[0].neo4j_player_id;

      // Create player1 node in Neo4j
      const player1Session = neo4jDriver.session();
      try {
        await player1Session.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonymId,
            playerName: "Player One",
            dateOfBirth: "2000-01-01",
          },
        );
      } finally {
        await player1Session.close();
      }

      const player1Login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player1@test.com", password: "TestPassword123!" });

      playerToken = player1Login.body.accessToken;

      const player2Register = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player2@test.com",
          password: "TestPassword123!",
          firstName: "Player",
          lastName: "Two",
          dateOfBirth: "2001-01-01",
          identityType: "player",
        });

      otherPlayerPseudonymId = player2Register.body.user.pseudonymId;

      // Get Neo4j player ID from PostgreSQL
      const player2IdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [otherPlayerPseudonymId],
      );
      otherPlayerNeo4jId = player2IdResult.rows[0].neo4j_player_id;

      // Create player2 node in Neo4j
      const player2Session = neo4jDriver.session();
      try {
        await player2Session.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: otherPlayerNeo4jId,
            pseudonymId: otherPlayerPseudonymId,
            playerName: "Player Two",
            dateOfBirth: "2001-01-01",
          },
        );
      } finally {
        await player2Session.close();
      }

      const player2Login = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player2@test.com", password: "TestPassword123!" });

      otherPlayerToken = player2Login.body.accessToken;

      // Register coach
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

      const coachPseudonymId = coachRegister.body.user.pseudonymId;

      // Get Neo4j coach ID from PostgreSQL
      const coachIdResult = await postgresPool.query(
        "SELECT neo4j_coach_id FROM coach_identities WHERE pseudonym_id = $1",
        [coachPseudonymId],
      );
      const coachNeo4jId = coachIdResult.rows[0].neo4j_coach_id;

      // Create coach node in Neo4j with MANAGES relationship
      const coachSession = neo4jDriver.session();
      try {
        await coachSession.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (c:Coach {
            coachId: $coachId,
            pseudonymId: $pseudonymId,
            coachName: $coachName,
            isActive: true
          })
          CREATE (c)-[:MANAGES]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            coachId: coachNeo4jId,
            pseudonymId: coachPseudonymId,
            coachName: "Test Coach",
          },
        );
      } finally {
        await coachSession.close();
      }

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      // Create injuries for player 1
      const injury1 = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonymId,
          injuryType: "Hamstring Strain",
          bodyPart: "Hamstring",
          severity: "Moderate",
          injuryDate: "2026-02-10",
        });

      if (injury1.status !== 201) {
        console.log("Injury 1 creation failed:", injury1.status, injury1.body);
      }

      injury1Id = injury1.body.injuryId;

      // Create injury for player 2
      const injury2 = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${otherPlayerToken}`)
        .send({
          playerId: otherPlayerPseudonymId,
          injuryType: "Ankle Sprain",
          bodyPart: "Ankle",
          severity: "Minor",
          injuryDate: "2026-02-12",
        });

      if (injury2.status !== 201) {
        console.log("Injury 2 creation failed:", injury2.status, injury2.body);
      }

      injury2Id = injury2.body.injuryId;
      console.log("Created injuries:", injury1Id, injury2Id);
    });

    it("should allow player to query only their own injuries", async () => {
      const response = await request(app.getHttpServer())
        .get("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].injuryId).toBe(injury1Id);
      expect(response.body.data[0].injuryType).toBe("Hamstring Strain");
    });

    it("should allow coach to query all injuries", async () => {
      const response = await request(app.getHttpServer())
        .get("/injuries")
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it("should support filtering by status", async () => {
      const response = await request(app.getHttpServer())
        .get("/injuries")
        .query({ status: "Active" })
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(
        response.body.data.every((inj: any) => inj.status === "Active"),
      ).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/injuries")
        .query({ page: 1, limit: 1 })
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 1);
    });
  });

  describe("GET /injuries/:id (Get Injury Detail)", () => {
    let testInjuryId: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      // Create test team
      const neo4jSession = neo4jDriver.session();
      try {
        await neo4jSession.run(`
          CREATE (t:Team {
            teamId: 'TEST-TEAM-001',
            teamName: 'Test United',
            ageGroup: 'Senior',
            isActive: true
          })
        `);
      } finally {
        await neo4jSession.close();
      }

      // Setup player, coach, and injury
      const playerSetup = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Player",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      const playerPseudonym = playerSetup.body.user.pseudonymId;

      // Get Neo4j player ID from PostgreSQL
      const playerIdResult = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonym],
      );
      playerNeo4jId = playerIdResult.rows[0].neo4j_player_id;

      // Create player node in Neo4j
      const playerSession = neo4jDriver.session();
      try {
        await playerSession.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonym,
            playerName: "Test Player",
            dateOfBirth: "2000-01-01",
          },
        );
      } finally {
        await playerSession.close();
      }

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

      const coachPseudonymId = coachRegister.body.user.pseudonymId;

      // Get Neo4j coach ID from PostgreSQL
      const coachIdResult = await postgresPool.query(
        "SELECT neo4j_coach_id FROM coach_identities WHERE pseudonym_id = $1",
        [coachPseudonymId],
      );
      const coachNeo4jId = coachIdResult.rows[0].neo4j_coach_id;

      // Create coach node in Neo4j with MANAGES relationship
      const coachSession = neo4jDriver.session();
      try {
        await coachSession.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (c:Coach {
            coachId: $coachId,
            pseudonymId: $pseudonymId,
            coachName: $coachName,
            isActive: true
          })
          CREATE (c)-[:MANAGES]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            coachId: coachNeo4jId,
            pseudonymId: coachPseudonymId,
            coachName: "Test Coach",
          },
        );
      } finally {
        await coachSession.close();
      }

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      // Create test injury
      const injury = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonym,
          injuryType: "Test Injury",
          bodyPart: "Test Part",
          severity: "Moderate",
          injuryDate: "2026-02-10",
        });

      testInjuryId = injury.body.injuryId;
    });

    it("should allow player to view their own injury", async () => {
      const response = await request(app.getHttpServer())
        .get(`/injuries/${testInjuryId}`)
        .set("Authorization", `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body.injuryId).toBe(testInjuryId);
      expect(response.body.injuryType).toBe("Test Injury");
    });

    it("should allow coach to view any injury", async () => {
      const response = await request(app.getHttpServer())
        .get(`/injuries/${testInjuryId}`)
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(200);

      expect(response.body.injuryId).toBe(testInjuryId);
    });

    it("should return 404 for non-existent injury", async () => {
      await request(app.getHttpServer())
        .get("/injuries/INJ-9999-999")
        .set("Authorization", `Bearer ${coachToken}`)
        .expect(404);
    });
  });

  describe("PATCH /injuries/:id (Update Injury)", () => {
    let testInjuryId: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      // Create test team
      const neo4jSession = neo4jDriver.session();
      try {
        await neo4jSession.run(`
          CREATE (t:Team {
            teamId: 'TEST-TEAM-001',
            teamName: 'Test United',
            ageGroup: 'Senior',
            isActive: true
          })
        `);
      } finally {
        await neo4jSession.close();
      }

      // Setup users and injury
      const playerSetup = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Player",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      const playerPseudonym2 = playerSetup.body.user.pseudonymId;

      // Get Neo4j player ID from PostgreSQL
      const playerIdResult2 = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonym2],
      );
      playerNeo4jId = playerIdResult2.rows[0].neo4j_player_id;

      // Create player node in Neo4j
      const playerSession2 = neo4jDriver.session();
      try {
        await playerSession2.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonym2,
            playerName: "Test Player",
            dateOfBirth: "2000-01-01",
          },
        );
      } finally {
        await playerSession2.close();
      }

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

      const coachPseudonymId2 = coachRegister.body.user.pseudonymId;

      // Get Neo4j coach ID from PostgreSQL
      const coachIdResult2 = await postgresPool.query(
        "SELECT neo4j_coach_id FROM coach_identities WHERE pseudonym_id = $1",
        [coachPseudonymId2],
      );
      const coachNeo4jId2 = coachIdResult2.rows[0].neo4j_coach_id;

      // Create coach node in Neo4j with MANAGES relationship
      const coachSession2 = neo4jDriver.session();
      try {
        await coachSession2.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (c:Coach {
            coachId: $coachId,
            pseudonymId: $pseudonymId,
            coachName: $coachName,
            isActive: true
          })
          CREATE (c)-[:MANAGES]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            coachId: coachNeo4jId2,
            pseudonymId: coachPseudonymId2,
            coachName: "Test Coach",
          },
        );
      } finally {
        await coachSession2.close();
      }

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      const adminRegister = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "admin@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Admin",
          dateOfBirth: "1980-01-01",
          identityType: "admin",
        });

      const adminLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "admin@test.com", password: "TestPassword123!" });

      adminToken = adminLogin.body.accessToken;

      // Create injury
      const injury = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonym2,
          injuryType: "Hamstring Strain",
          bodyPart: "Hamstring",
          severity: "Moderate",
          injuryDate: "2026-02-10",
        });

      testInjuryId = injury.body.injuryId;
    });

    it("should allow coach to update injury status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/injuries/${testInjuryId}`)
        .set("Authorization", `Bearer ${coachToken}`)
        .send({
          status: "Recovering",
          statusNote: "Patient showing good progress",
          treatmentPlan: "Continue PT, add strengthening exercises",
        })
        .expect(200);

      expect(response.body.injuryId).toBe(testInjuryId);
      expect(response.body.status).toBe("Recovering");
    });

    it("should allow admin to update injury", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/injuries/${testInjuryId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "Recovering",
        })
        .expect(200);

      expect(response.body.status).toBe("Recovering");
    });

    it("should reject update by player", async () => {
      await request(app.getHttpServer())
        .patch(`/injuries/${testInjuryId}`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          status: "Recovering",
        })
        .expect(403);
    });

    it("should return 404 for non-existent injury", async () => {
      await request(app.getHttpServer())
        .patch("/injuries/INJ-9999-999")
        .set("Authorization", `Bearer ${coachToken}`)
        .send({
          status: "Recovering",
        })
        .expect(404);
    });
  });

  describe("POST /injuries/:id/resolve (Resolve Injury)", () => {
    let testInjuryId: string;

    beforeEach(async () => {
      await cleanPostgresTestDb(postgresPool);
      await cleanNeo4jTestDb(neo4jDriver);

      // Create test team
      const neo4jSession = neo4jDriver.session();
      try {
        await neo4jSession.run(`
          CREATE (t:Team {
            teamId: 'TEST-TEAM-001',
            teamName: 'Test United',
            ageGroup: 'Senior',
            isActive: true
          })
        `);
      } finally {
        await neo4jSession.close();
      }

      // Setup users
      const playerSetup = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "player@test.com",
          password: "TestPassword123!",
          firstName: "Test",
          lastName: "Player",
          dateOfBirth: "2000-01-01",
          identityType: "player",
        });

      const playerPseudonym3 = playerSetup.body.user.pseudonymId;

      // Get Neo4j player ID from PostgreSQL
      const playerIdResult3 = await postgresPool.query(
        "SELECT neo4j_player_id FROM player_identities WHERE pseudonym_id = $1",
        [playerPseudonym3],
      );
      playerNeo4jId = playerIdResult3.rows[0].neo4j_player_id;

      // Create player node in Neo4j
      const playerSession3 = neo4jDriver.session();
      try {
        await playerSession3.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (p:Player {
            playerId: $playerId,
            pseudonymId: $pseudonymId,
            playerName: $playerName,
            dateOfBirth: $dateOfBirth,
            isActive: true
          })
          CREATE (p)-[:PLAYS_FOR]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            playerId: playerNeo4jId,
            pseudonymId: playerPseudonym3,
            playerName: "Test Player",
            dateOfBirth: "2000-01-01",
          },
        );
      } finally {
        await playerSession3.close();
      }

      const playerLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "player@test.com", password: "TestPassword123!" });

      playerToken = playerLogin.body.accessToken;

      // Register coach and create Neo4j node
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

      const coachPseudonymId3 = coachRegister.body.user.pseudonymId;

      // Get Neo4j coach ID from PostgreSQL
      const coachIdResult3 = await postgresPool.query(
        "SELECT neo4j_coach_id FROM coach_identities WHERE pseudonym_id = $1",
        [coachPseudonymId3],
      );
      const coachNeo4jId3 = coachIdResult3.rows[0].neo4j_coach_id;

      // Create coach node in Neo4j with MANAGES relationship
      const coachSession3 = neo4jDriver.session();
      try {
        await coachSession3.run(
          `
          MATCH (t:Team {teamId: $teamId})
          CREATE (c:Coach {
            coachId: $coachId,
            pseudonymId: $pseudonymId,
            coachName: $coachName,
            isActive: true
          })
          CREATE (c)-[:MANAGES]->(t)
        `,
          {
            teamId: "TEST-TEAM-001",
            coachId: coachNeo4jId3,
            pseudonymId: coachPseudonymId3,
            coachName: "Test Coach",
          },
        );
      } finally {
        await coachSession3.close();
      }

      const coachLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "coach@test.com", password: "TestPassword123!" });

      coachToken = coachLogin.body.accessToken;

      // Create injury
      const injury = await request(app.getHttpServer())
        .post("/injuries")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          playerId: playerPseudonym3,
          injuryType: "Hamstring Strain",
          bodyPart: "Hamstring",
          severity: "Moderate",
          injuryDate: "2026-02-01",
        });

      testInjuryId = injury.body.injuryId;
    });

    it("should allow coach to resolve injury", async () => {
      const response = await request(app.getHttpServer())
        .post(`/injuries/${testInjuryId}/resolve`)
        .set("Authorization", `Bearer ${coachToken}`)
        .send({
          returnToPlayDate: "2026-02-15",
          resolutionNotes: "Full recovery, cleared for training",
        })
        .expect(200);

      expect(response.body.injuryId).toBe(testInjuryId);
      expect(response.body.status).toBe("Recovered");
    });

    it("should reject resolve by player", async () => {
      await request(app.getHttpServer())
        .post(`/injuries/${testInjuryId}/resolve`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          returnToPlayDate: "2026-02-15",
        })
        .expect(403);
    });

    it("should return 404 for non-existent injury", async () => {
      await request(app.getHttpServer())
        .post("/injuries/INJ-9999-999/resolve")
        .set("Authorization", `Bearer ${coachToken}`)
        .send({
          returnToPlayDate: "2026-02-15",
        })
        .expect(404);
    });
  });
});

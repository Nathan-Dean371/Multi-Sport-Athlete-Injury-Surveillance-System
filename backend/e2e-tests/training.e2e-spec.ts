/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";
import { cleanPostgresTestDb, cleanNeo4jTestDb } from "./helpers/cleanup";

describe("Training (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: any;

  let playerToken: string;
  let parentToken: string;
  let otherParentToken: string;

  let playerPseudonymId: string;
  let parentPseudonymId: string;
  let otherParentPseudonymId: string;

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

  beforeEach(async () => {
    await cleanPostgresTestDb(postgresPool);
    await cleanNeo4jTestDb(neo4jDriver);

    // Register + login player
    const playerRegister = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "player@training.test.com",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "Player",
        dateOfBirth: "2000-01-01",
        identityType: "player",
      });

    playerPseudonymId = playerRegister.body.user.pseudonymId;

    const playerLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "player@training.test.com",
        password: "TestPassword123!",
      });

    playerToken = playerLogin.body.accessToken;

    // Register + login linked parent
    const parentRegister = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "parent@training.test.com",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "Parent",
        dateOfBirth: "1980-01-01",
        identityType: "parent",
      });

    parentPseudonymId = parentRegister.body.user.pseudonymId;

    const parentLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "parent@training.test.com",
        password: "TestPassword123!",
      });

    parentToken = parentLogin.body.accessToken;

    // Register + login unlinked parent
    const otherParentRegister = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "other-parent@training.test.com",
        password: "TestPassword123!",
        firstName: "Other",
        lastName: "Parent",
        dateOfBirth: "1980-01-01",
        identityType: "parent",
      });

    otherParentPseudonymId = otherParentRegister.body.user.pseudonymId;

    const otherParentLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "other-parent@training.test.com",
        password: "TestPassword123!",
      });

    otherParentToken = otherParentLogin.body.accessToken;

    // Create Neo4j nodes + relationship (auth/register doesn't create these)
    const s = neo4jDriver.session();
    try {
      await s.run(
        `
        CREATE (pl:Player {
          playerId: 'PLAYER-TEST-001',
          pseudonymId: $playerPseudonymId,
          isActive: true,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        CREATE (p:Parent {
          parentId: $parentPseudonymId,
          pseudonymId: $parentPseudonymId,
          createdAt: datetime()
        })
        CREATE (p)-[:PARENT_OF {createdAt: datetime()}]->(pl)
      `,
        { playerPseudonymId, parentPseudonymId },
      );

      await s.run(
        `
        CREATE (p:Parent {
          parentId: $otherParentPseudonymId,
          pseudonymId: $otherParentPseudonymId,
          createdAt: datetime()
        })
      `,
        { otherParentPseudonymId },
      );
    } finally {
      await s.close();
    }
  });

  it("player can upsert training session definition and fetch schedule", async () => {
    const sessionId = "TRN-TEST-001";

    const upsert = await request(app.getHttpServer())
      .put(
        `/players/${playerPseudonymId}/training-schedule/sessions/${sessionId}`,
      )
      .set("Authorization", `Bearer ${playerToken}`)
      .send({
        name: "Gym",
        sessionType: "strength",
        startDateTime: "2026-04-13T18:30:00.000Z",
        isRepeatable: true,
        repeatIntervalDays: 7,
      });

    expect(upsert.status).toBe(200);
    expect(upsert.body).toHaveProperty("trainingSessionId", sessionId);

    const schedule = await request(app.getHttpServer())
      .get(`/players/${playerPseudonymId}/training-schedule`)
      .set("Authorization", `Bearer ${playerToken}`);

    expect(schedule.status).toBe(200);
    expect(schedule.body).toHaveProperty("sessions");
    expect(Array.isArray(schedule.body.sessions)).toBe(true);
    expect(schedule.body.sessions.length).toBe(1);
    expect(schedule.body.sessions[0]).toMatchObject({
      trainingSessionId: sessionId,
      name: "Gym",
      sessionType: "strength",
      isRepeatable: true,
      repeatIntervalDays: 7,
    });
  });

  it("linked parent can upsert report for player's session", async () => {
    const sessionId = "TRN-TEST-002";

    await request(app.getHttpServer())
      .put(
        `/players/${playerPseudonymId}/training-schedule/sessions/${sessionId}`,
      )
      .set("Authorization", `Bearer ${playerToken}`)
      .send({
        name: "Sprint Session",
        sessionType: "field",
        startDateTime: "2026-04-13T18:30:00.000Z",
        isRepeatable: false,
      });

    const occurrenceDate = "2026-04-13";

    const upsertReport = await request(app.getHttpServer())
      .put(
        `/players/${playerPseudonymId}/training-reports/${sessionId}/${occurrenceDate}`,
      )
      .set("Authorization", `Bearer ${parentToken}`)
      .send({
        reportDate: "2026-04-13",
        effortExpended: 8,
        physicalFeeling: "Tired",
        mentalFeeling: "Focused",
        notes: "Good session",
      });

    expect(upsertReport.status).toBe(200);
    expect(upsertReport.body).toHaveProperty(
      "reportKey",
      `${sessionId}:${occurrenceDate}`,
    );

    const listReports = await request(app.getHttpServer())
      .get(`/players/${playerPseudonymId}/training-reports`)
      .set("Authorization", `Bearer ${playerToken}`);

    expect(listReports.status).toBe(200);
    expect(Array.isArray(listReports.body.reports)).toBe(true);
    expect(listReports.body.reports.length).toBe(1);
    expect(listReports.body.reports[0]).toMatchObject({
      reportKey: `${sessionId}:${occurrenceDate}`,
      trainingSessionId: sessionId,
      playerPseudonymId,
      occurrenceDate,
      reportDate: "2026-04-13",
      effortExpended: 8,
      physicalFeeling: "Tired",
      mentalFeeling: "Focused",
      notes: "Good session",
    });
  });

  it("unlinked parent cannot access player's schedule", async () => {
    const res = await request(app.getHttpServer())
      .get(`/players/${playerPseudonymId}/training-schedule`)
      .set("Authorization", `Bearer ${otherParentToken}`);

    expect(res.status).toBe(403);
  });
});

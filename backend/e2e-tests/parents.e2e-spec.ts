/// <reference types="jest" />
import * as dotenv from "dotenv";
import * as path from "path";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { AppModule } from "../src/app.module";
import { cleanPostgresTestDb } from "./helpers/cleanup";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";

// Load .env.test file at module load time, before any test code runs
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

/**
 * Parents E2E Tests
 *
 * Tests the full parent invitation and registration flow including:
 * - Coach inviting a parent
 * - Parent accepting invitation and creating account
 * - Parent logging in with created account
 * - Parent accessing their profile
 *
 * These tests use real databases (PostgreSQL + Neo4j) to verify:
 * - Invitations are properly created
 * - User accounts are created with proper credentials
 * - Password hashing works correctly
 * - JWT tokens work for parent users
 */
describe("Parents (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: ReturnType<typeof createTestDatabaseConnections>;

  /**
   * Setup - Runs once before all tests
   */
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

  /**
   * Teardown - Runs once after all tests
   */
  afterAll(async () => {
    await cleanPostgresTestDb(postgresPool);
    await dbConnections.close();
    await app.close();
  });

  /**
   * PARENT INVITATION AND REGISTRATION TESTS
   */
  describe("Parent Invitation & Acceptance", () => {
    let coachToken: string;
    let coachPseudonymId: string;
    let invitationToken: string;

    beforeEach(async () => {
      // Clean database before each test
      await cleanPostgresTestDb(postgresPool);

      // Register a coach to send the invitation
      const coachDto = {
        email: "coach@test.com",
        password: "CoachPassword123!",
        firstName: "Coach",
        lastName: "Smith",
        dateOfBirth: "1980-05-15",
        identityType: "coach",
      };

      const coachResponse = await request(app.getHttpServer())
        .post("/auth/register")
        .send(coachDto);

      // Debug: Log response if registration failed
      if (!coachResponse.body.user) {
        console.error(
          "Coach registration failed:",
          coachResponse.status,
          JSON.stringify(coachResponse.body),
        );
      }

      expect(coachResponse.status).toBe(201);
      expect(coachResponse.body).toHaveProperty("accessToken");
      expect(coachResponse.body).toHaveProperty("user");

      coachToken = coachResponse.body.accessToken;
      coachPseudonymId = coachResponse.body.user.pseudonymId;
    });

    it("should allow a coach to invite a parent", async () => {
      const inviteDto = {
        parentEmail: "parent@test.com",
        parentPhone: "555-1234",
      };

      const response = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${coachToken}`)
        .send(inviteDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");

      // Verify invitation was created in database
      const invitationResult = await postgresPool.query(
        "SELECT * FROM parent_invitations WHERE parent_email = $1",
        [inviteDto.parentEmail],
      );

      expect(invitationResult.rows).toHaveLength(1);
      expect(invitationResult.rows[0].coach_pseudonym_id).toBe(
        coachPseudonymId,
      );
      expect(invitationResult.rows[0].parent_email).toBe(inviteDto.parentEmail);
      expect(invitationResult.rows[0].parent_phone).toBe(inviteDto.parentPhone);
      expect(invitationResult.rows[0].accepted).toBe(false);

      // Store token for next test
      invitationToken = response.body.token;
    });

    it("should allow parent to accept invitation and create account", async () => {
      // First, create an invitation
      const inviteDto = {
        parentEmail: "parent2@test.com",
        parentPhone: "555-5678",
      };

      const inviteResponse = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${coachToken}`)
        .send(inviteDto);

      const token = inviteResponse.body.token;

      // Now accept the invitation
      const acceptDto = {
        token,
        pseudonymId: "parent-001",
        firstName: "Jane",
        lastName: "Doe",
        password: "ParentPassword123!",
      };

      const acceptResponse = await request(app.getHttpServer())
        .post("/parents/accept")
        .send(acceptDto);

      expect(acceptResponse.status).toBe(201);
      expect(acceptResponse.body).toHaveProperty("pseudonymId");
      expect(acceptResponse.body.pseudonymId).toBe(acceptDto.pseudonymId);

      // Verify parent identity was created
      const parentResult = await postgresPool.query(
        "SELECT * FROM parent_identities WHERE pseudonym_id = $1",
        [acceptDto.pseudonymId],
      );

      expect(parentResult.rows).toHaveLength(1);
      expect(parentResult.rows[0].first_name).toBe(acceptDto.firstName);
      expect(parentResult.rows[0].last_name).toBe(acceptDto.lastName);
      expect(parentResult.rows[0].email).toBe(inviteDto.parentEmail);
      expect(parentResult.rows[0].phone).toBe(inviteDto.parentPhone);

      // Verify user account was created
      const accountResult = await postgresPool.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [inviteDto.parentEmail],
      );

      expect(accountResult.rows).toHaveLength(1);
      expect(accountResult.rows[0].identity_type).toBe("parent");
      expect(accountResult.rows[0].pseudonym_id).toBe(acceptDto.pseudonymId);
      expect(accountResult.rows[0].is_active).toBe(true);

      // Verify password is hashed
      expect(accountResult.rows[0].password_hash).not.toBe(acceptDto.password);
      expect(accountResult.rows[0].password_hash).toHaveLength(60); // bcrypt hash

      // Verify invitation was marked as accepted
      const invitationResult = await postgresPool.query(
        "SELECT * FROM parent_invitations WHERE token = $1",
        [token],
      );

      expect(invitationResult.rows[0].accepted).toBe(true);
      expect(invitationResult.rows[0].accepted_at).not.toBeNull();
    });

    it("should allow parent to login with created account", async () => {
      // Create invitation and accept it
      const inviteDto = {
        parentEmail: "parent3@test.com",
        parentPhone: "555-9999",
      };

      const inviteResponse = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${coachToken}`)
        .send(inviteDto);

      const acceptDto = {
        token: inviteResponse.body.token,
        pseudonymId: "parent-003",
        firstName: "Bob",
        lastName: "Johnson",
        password: "ParentLogin123!",
      };

      await request(app.getHttpServer())
        .post("/parents/accept")
        .send(acceptDto);

      // Now try to login with parent credentials
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: inviteDto.parentEmail,
          password: acceptDto.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty("accessToken");
      expect(loginResponse.body.user.email).toBe(inviteDto.parentEmail);
      expect(loginResponse.body.user.identityType).toBe("parent");
      expect(loginResponse.body.user.pseudonymId).toBe(acceptDto.pseudonymId);
    });

    it("should allow parent to access their profile endpoint", async () => {
      // Create invitation and accept it
      const inviteDto = {
        parentEmail: "parent4@test.com",
        parentPhone: "555-4444",
      };

      const inviteResponse = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${coachToken}`)
        .send(inviteDto);

      const acceptDto = {
        token: inviteResponse.body.token,
        pseudonymId: "parent-004",
        firstName: "Alice",
        lastName: "Williams",
        password: "ParentProfile123!",
      };

      const acceptResponse = await request(app.getHttpServer())
        .post("/parents/accept")
        .send(acceptDto);

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: inviteDto.parentEmail,
          password: acceptDto.password,
        });

      const parentToken = loginResponse.body.accessToken;

      // Access parent profile
      const profileResponse = await request(app.getHttpServer())
        .get("/parents/me")
        .set("Authorization", `Bearer ${parentToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body).toHaveProperty("parent_id");
      expect(profileResponse.body.pseudonym_id).toBe(acceptDto.pseudonymId);
      expect(profileResponse.body.first_name).toBe(acceptDto.firstName);
      expect(profileResponse.body.last_name).toBe(acceptDto.lastName);
      expect(profileResponse.body.email).toBe(inviteDto.parentEmail);
    });

    it("should reject invitation with invalid token", async () => {
      const acceptDto = {
        token: "invalid-token-12345",
        pseudonymId: "parent-invalid",
        firstName: "Test",
        lastName: "User",
        password: "Password123!",
      };

      const response = await request(app.getHttpServer())
        .post("/parents/accept")
        .send(acceptDto);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Invitation not found");
    });

    it("should reject accepting already accepted invitation", async () => {
      // Create and accept invitation
      const inviteDto = {
        parentEmail: "parent5@test.com",
        parentPhone: "555-5555",
      };

      const inviteResponse = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${coachToken}`)
        .send(inviteDto);

      const token = inviteResponse.body.token;

      const acceptDto = {
        token,
        pseudonymId: "parent-005",
        firstName: "First",
        lastName: "Accept",
        password: "Password123!",
      };

      // First acceptance should succeed
      await request(app.getHttpServer())
        .post("/parents/accept")
        .send(acceptDto);

      // Second acceptance with same token should fail
      const response = await request(app.getHttpServer())
        .post("/parents/accept")
        .send({
          ...acceptDto,
          pseudonymId: "parent-005-retry",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("already accepted");
    });

    it("should reject unauthorized parent invite attempt (non-coach user)", async () => {
      // Register a player
      const playerDto = {
        email: "player@test.com",
        password: "PlayerPassword123!",
        firstName: "Player",
        lastName: "User",
        dateOfBirth: "2005-01-01",
        identityType: "player",
      };

      const playerResponse = await request(app.getHttpServer())
        .post("/auth/register")
        .send(playerDto);

      const playerToken = playerResponse.body.accessToken;

      // Try to invite parent as player (should fail - only coaches can invite)
      const inviteDto = {
        parentEmail: "parent6@test.com",
        parentPhone: "555-6666",
      };

      const response = await request(app.getHttpServer())
        .post("/parents/invite")
        .set("Authorization", `Bearer ${playerToken}`)
        .send(inviteDto);

      expect(response.status).toBe(403); // Forbidden - RolesGuard should reject non-coach
    });
  });
});

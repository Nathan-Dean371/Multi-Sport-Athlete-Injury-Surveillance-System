/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import { AppModule } from "../src/app.module";
import { cleanAllTestDatabases, cleanPostgresTestDb } from "./helpers/cleanup";
import { createTestDatabaseConnections } from "./helpers/test-db-connection";

/**
 * Authentication E2E Tests
 *
 * Tests the full authentication flow including:
 * - User registration (player, coach, admin)
 * - User login with JWT generation
 * - Protected route access
 * - Role-based access control
 *
 * These tests use real databases (PostgreSQL + Neo4j) to verify:
 * - Data is correctly persisted
 * - Password hashing works
 * - JWT tokens are valid
 * - Guards protect routes properly
 */
describe("Authentication (E2E)", () => {
  let app: INestApplication;
  let postgresPool: Pool;
  let neo4jDriver: Driver;
  let dbConnections: ReturnType<typeof createTestDatabaseConnections>;

  /**
   * Setup - Runs once before all tests
   * - Create NestJS app
   * - Connect to test databases
   * - Apply global pipes/middleware
   */
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

  /**
   * Note: Cleanup is handled per-describe block, not globally
   * This allows nested beforeEach blocks to create test data
   */

  /**
   * Teardown - Runs once after all tests
   * Close connections and stop app
   *
   * IMPORTANT: Only clean PostgreSQL test database, NOT Neo4j!
   * Neo4j Community Edition doesn't support multiple databases,
   * so we share the dev database. Never run cleanNeo4jTestDb here!
   */
  afterAll(async () => {
    await cleanPostgresTestDb(postgresPool);
    await dbConnections.close();
    await app.close();
  });

  /**
   * REGISTRATION TESTS
   * Test user registration endpoint for all identity types
   */
  describe("POST /auth/register", () => {
    beforeEach(async () => {
      // Clean database before each registration test
      await cleanPostgresTestDb(postgresPool);
    });
    it("should register a new player and create records in PostgreSQL", async () => {
      const registerDto = {
        email: "newplayer@test.com",
        password: "StrongPassword123!",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "2000-01-15",

        identityType: "player",
      };

      // Make registration request
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto);

      // Debug: log response if not 201
      if (response.status !== 201) {
        console.log("Registration failed with status:", response.status);
        console.log("Response body:", JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      // Verify response structure
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("pseudonymId");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.identityType).toBe("player");

      // Verify player identity created in PostgreSQL
      const identityResult = await postgresPool.query(
        "SELECT * FROM player_identities WHERE email = $1",
        [registerDto.email],
      );
      expect(identityResult.rows).toHaveLength(1);
      expect(identityResult.rows[0].first_name).toBe(registerDto.firstName);
      expect(identityResult.rows[0].last_name).toBe(registerDto.lastName);

      // Verify user account created in PostgreSQL
      const accountResult = await postgresPool.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [registerDto.email],
      );
      expect(accountResult.rows).toHaveLength(1);
      expect(accountResult.rows[0].identity_type).toBe("player");
      expect(accountResult.rows[0].is_active).toBe(true);
      expect(accountResult.rows[0].is_locked).toBe(false);

      // Verify password is hashed (not plain text)
      expect(accountResult.rows[0].password_hash).not.toBe(
        registerDto.password,
      );
      expect(accountResult.rows[0].password_hash).toHaveLength(60); // bcrypt hash length
    });

    it("should register a new coach", async () => {
      const registerDto = {
        email: "newcoach@test.com",
        password: "CoachPassword123!",
        firstName: "Mike",
        lastName: "Smith",
        dateOfBirth: "1985-03-20",
        identityType: "coach",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user).toHaveProperty("pseudonymId");

      // Verify coach identity created
      const identityResult = await postgresPool.query(
        "SELECT * FROM coach_identities WHERE email = $1",
        [registerDto.email],
      );
      expect(identityResult.rows).toHaveLength(1);
      expect(identityResult.rows[0].first_name).toBe("Mike");
      expect(identityResult.rows[0].last_name).toBe("Smith");

      // Verify user account identity_type is coach
      const accountResult = await postgresPool.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [registerDto.email],
      );
      expect(accountResult.rows[0].identity_type).toBe("coach");
    });

    it("should register a new admin", async () => {
      const registerDto = {
        email: "newadmin@test.com",
        password: "AdminPassword123!",
        firstName: "Sarah",
        lastName: "Johnson",
        dateOfBirth: "1980-07-10",
        identityType: "admin",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.user).toHaveProperty("pseudonymId");

      // Verify admin identity created
      const identityResult = await postgresPool.query(
        "SELECT * FROM admin_identities WHERE email = $1",
        [registerDto.email],
      );
      expect(identityResult.rows).toHaveLength(1);

      // Verify user account identity_type is admin
      const accountResult = await postgresPool.query(
        "SELECT * FROM user_accounts WHERE email = $1",
        [registerDto.email],
      );
      expect(accountResult.rows[0].identity_type).toBe("admin");
    });

    it("should reject registration with duplicate email", async () => {
      const registerDto = {
        email: "duplicate@test.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
        dateOfBirth: "2000-01-01",
        identityType: "player",
      };

      // First registration should succeed
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(401); // UnauthorizedException is thrown

      expect(response.body.message).toContain("Email already exists");
    });

    it("should validate required fields", async () => {
      const invalidDto = {
        email: "invalid@test.com",
        // Missing password
        firstName: "Test",
        identityType: "player",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it("should validate password strength", async () => {
      const weakPasswordDto = {
        email: "weak@test.com",
        password: "weak", // Too weak
        firstName: "Test",
        lastName: "User",
        phone: "+1111111111",
        identityType: "player",
        dateOfBirth: "2000-01-01",
      };

      await request(app.getHttpServer())
        .post("/auth/register")
        .send(weakPasswordDto)
        .expect(400);
    });
  });

  /**
   * LOGIN TESTS
   * Test user authentication and JWT token generation
   */
  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Clean and create a test user before each login test
      await cleanPostgresTestDb(postgresPool);
      await request(app.getHttpServer()).post("/auth/register").send({
        email: "testuser@test.com",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
        identityType: "player",
        dateOfBirth: "2000-01-15",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginDto = {
        email: "testuser@test.com",
        password: "TestPassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(200);

      // Verify response contains JWT token
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("pseudonymId");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("identityType");
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user.identityType).toBe("player");

      // Verify token is a valid JWT (3 parts separated by dots)
      const tokenParts = response.body.accessToken.split(".");
      expect(tokenParts).toHaveLength(3);
    });

    it("should reject login with invalid password", async () => {
      const loginDto = {
        email: "testuser@test.com",
        password: "WrongPassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body).not.toHaveProperty("accessToken");
      expect(response.body.message).toBeDefined();
    });

    it("should reject login with non-existent email", async () => {
      const loginDto = {
        email: "nonexistent@test.com",
        password: "Password123!",
      };

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);
    });

    it("should reject login for inactive account", async () => {
      // Mark the account as inactive
      await postgresPool.query(
        "UPDATE user_accounts SET is_active = false WHERE email = $1",
        ["testuser@test.com"],
      );

      const loginDto = {
        email: "testuser@test.com",
        password: "TestPassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain("inactive");
    });

    it("should reject login for locked account", async () => {
      // Lock the account
      await postgresPool.query(
        "UPDATE user_accounts SET is_locked = true WHERE email = $1",
        ["testuser@test.com"],
      );

      const loginDto = {
        email: "testuser@test.com",
        password: "TestPassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toContain("locked");
    });

    it("should increment failed login attempts on wrong password", async () => {
      const loginDto = {
        email: "testuser@test.com",
        password: "WrongPassword!",
      };

      // Make failed login attempt
      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      // Check failed attempts incremented
      const result = await postgresPool.query(
        "SELECT failed_login_attempts FROM user_accounts WHERE email = $1",
        ["testuser@test.com"],
      );
      expect(result.rows[0].failed_login_attempts).toBe(1);
    });

    it("should reset failed login attempts on successful login", async () => {
      // First make a failed attempt
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "testuser@test.com", password: "Wrong!" })
        .expect(401);

      // Then successful login
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "testuser@test.com", password: "TestPassword123!" })
        .expect(200);

      // Check failed attempts reset to 0
      const result = await postgresPool.query(
        "SELECT failed_login_attempts FROM user_accounts WHERE email = $1",
        ["testuser@test.com"],
      );
      expect(result.rows[0].failed_login_attempts).toBe(0);
    });
  });

  /**
   * PROTECTED ROUTES TESTS
   * Test that JWT authentication guards work correctly
   */
  describe("Protected Routes", () => {
    let authToken: string;
    let userPseudonymId: string;

    beforeEach(async () => {
      // Clean database and create test user
      await cleanPostgresTestDb(postgresPool);

      // Register and login to get auth token
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "authuser@test.com",
          password: "TestPassword123!",
          firstName: "Auth",
          lastName: "User",
          dateOfBirth: "2000-01-15",
          identityType: "player",
        });

      userPseudonymId = registerResponse.body.user.pseudonymId;

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "authuser@test.com",
          password: "TestPassword123!",
        });

      authToken = loginResponse.body.accessToken;
    });

    it("should allow access to protected route with valid JWT", async () => {
      // Try to access a protected endpoint (using players endpoint which only needs PostgreSQL)
      const response = await request(app.getHttpServer())
        .get("/players")
        .set("Authorization", `Bearer ${authToken}`);

      // Should get 200 OK or empty array, not 401 Unauthorized
      expect([200, 404]).toContain(response.status); // 404 is ok if no players in Neo4j

      // The key is that we don't get 401 Unauthorized with a valid token
      if (response.status === 401) {
        throw new Error("Should not get 401 with valid JWT");
      }
    });

    it("should reject access to protected route without JWT", async () => {
      await request(app.getHttpServer())
        .get(`/status/players/${userPseudonymId}/history`)
        .expect(401);
    });

    it("should reject access with invalid JWT", async () => {
      await request(app.getHttpServer())
        .get(`/status/players/${userPseudonymId}/history`)
        .set("Authorization", "Bearer invalid.jwt.token")
        .expect(401);
    });

    it("should reject access with malformed Authorization header", async () => {
      await request(app.getHttpServer())
        .get(`/status/players/${userPseudonymId}/history`)
        .set("Authorization", authToken) // Missing "Bearer " prefix
        .expect(401);
    });
  });
});

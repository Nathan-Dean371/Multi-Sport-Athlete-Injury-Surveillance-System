/**
 * Auth Service Unit Tests
 * 
 * Purpose: Test authentication logic including login, registration, and user validation
 * 
 * What we're testing:
 * 1. Login flow - password validation, account status checks, JWT generation
 * 2. Registration - user creation, pseudonym generation, database transactions
 * 3. User validation - JWT payload verification
 * 
 * Mocking strategy:
 * - Mock PostgreSQL pool (no real database calls)
 * - Mock JwtService (no real token generation)
 * - Use bcrypt for real password hashing (fast enough for tests)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockPool: any;
  let mockJwtService: any;

  // Sample user data for consistent testing
  const testUser = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: '', // Will be set in beforeAll
    password_salt: 'bcrypt',
    identity_type: 'player',
    pseudonym_id: 'PSY-PLAYER-ABC123',
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
  };

  beforeAll(async () => {
    // Pre-hash password once for all tests
    testUser.password_hash = await bcrypt.hash('password123', 10);
  });

  beforeEach(async () => {
    // Create mock PostgreSQL pool
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
    };

    // Create mock JWT service
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'POSTGRES_POOL',
          useValue: mockPool,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // LOGIN TESTS
  // ============================================================================

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange: Mock database to return our test user
      mockPool.query
        .mockResolvedValueOnce({ rows: [testUser] }) // SELECT user
        .mockResolvedValueOnce({ rows: [] }); // UPDATE last_login

      // Act: Attempt login
      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert: Check response structure
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        id: testUser.id,
        email: testUser.email,
        identityType: testUser.identity_type,
        pseudonymId: testUser.pseudonym_id,
      });

      // Verify JWT payload
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: testUser.id,
        email: testUser.email,
        identityType: testUser.identity_type,
        pseudonymId: testUser.pseudonym_id,
      });

      // Verify login timestamp was updated
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_accounts'),
        expect.arrayContaining([testUser.id]),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange: Mock database to return no users
      mockPool.query.mockResolvedValue({ rows: [] });

      // Act & Assert: Expect error
      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Reset and test error message
      mockPool.query.mockResolvedValue({ rows: [] });
      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      // Arrange: Mock database to return user
      mockPool.query
        .mockResolvedValueOnce({ rows: [testUser] }) // SELECT user
        .mockResolvedValueOnce({ rows: [] }); // UPDATE failed_login_attempts

      // Act & Assert: Expect error
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Verify failed login attempt was incremented
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('failed_login_attempts'),
        expect.arrayContaining([testUser.id]),
      );
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      // Arrange: Mock inactive user
      const inactiveUser = { ...testUser, is_active: false };
      mockPool.query.mockResolvedValueOnce({ rows: [inactiveUser] });

      // Act & Assert
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Account is inactive');
    });

    it('should throw UnauthorizedException for locked account', async () => {
      // Arrange: Mock locked user
      const lockedUser = { ...testUser, is_locked: true };
      mockPool.query.mockResolvedValueOnce({ rows: [lockedUser] });

      // Act & Assert
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Account is locked');
    });

    it('should reset failed login attempts on successful login', async () => {
      // Arrange: User with previous failed attempts
      const userWithFailedAttempts = { ...testUser, failed_login_attempts: 3 };
      mockPool.query
        .mockResolvedValueOnce({ rows: [userWithFailedAttempts] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE query

      // Act
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert: Verify reset query was called
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('failed_login_attempts = 0'),
        expect.arrayContaining([testUser.id]),
      );
    });
  });

  // ============================================================================
  // REGISTRATION TESTS
  // ============================================================================

  describe('register', () => {
    let mockClient: any;

    beforeEach(() => {
      // Mock database client for transactions
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);
    });

    it('should successfully register a new player', async () => {
      // Arrange: Mock empty user check and successful inserts
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] }) // INSERT player_identities
        .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] }) // INSERT user_accounts
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      const result = await service.register({
        email: 'newplayer@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1995-06-15'),
        identityType: 'player',
      });

      // Assert: Check response
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('newplayer@example.com');
      expect(result.user.identityType).toBe('player');
      expect(result.user.pseudonymId).toContain('PSY-PLAYER-');

      // Verify transaction flow
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      // Verify player_identities insert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO player_identities'),
        expect.arrayContaining([
          expect.stringContaining('PSY-PLAYER-'),
          expect.stringContaining('PLAYER-'),
          'John',
          'Doe',
          expect.any(Date),
          'newplayer@example.com',
        ]),
      );
    });

    it('should successfully register a new coach', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'identity-456' }] }) // INSERT coach_identities
        .mockResolvedValueOnce({ rows: [{ id: 'user-456' }] }) // INSERT user_accounts
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      const result = await service.register({
        email: 'coach@example.com',
        password: 'CoachPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-03-20'),
        identityType: 'coach',
      });

      // Assert
      expect(result.user.identityType).toBe('coach');
      expect(result.user.pseudonymId).toContain('PSY-COACH-');

      // Verify coach_identities insert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO coach_identities'),
        expect.arrayContaining([
          expect.stringContaining('PSY-COACH-'),
          expect.stringContaining('COACH-'),
          'Jane',
          'Smith',
          'coach@example.com',
        ]),
      );
    });

    it('should successfully register a new admin', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'identity-789' }] }) // INSERT admin_identities
        .mockResolvedValueOnce({ rows: [{ id: 'user-789' }] }) // INSERT user_accounts
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      const result = await service.register({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        firstName: 'Bob',
        lastName: 'Admin',
        dateOfBirth: new Date('1980-01-01'),
        identityType: 'admin',
      });

      // Assert
      expect(result.user.identityType).toBe('admin');
      expect(result.user.pseudonymId).toContain('PSY-ADMIN-');

      // Verify admin_identities insert (no date_of_birth)
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO admin_identities'),
        expect.arrayContaining([
          expect.stringContaining('PSY-ADMIN-'),
          'Bob',
          'Admin',
          'admin@example.com',
        ]),
      );
    });

    it('should throw UnauthorizedException for duplicate email', async () => {
      // Arrange: Mock existing user
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

      // Act & Assert
      await expect(
        service.register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          identityType: 'player',
        }),
      ).rejects.toThrow('Email already exists');

      // Verify no insert was attempted
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it('should rollback transaction on database error', async () => {
      // Arrange: Mock error during insert
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

      // Act & Assert
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          identityType: 'player',
        }),
      ).rejects.toThrow('Database error');

      // Verify rollback was called
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] })
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Act
      await service.register({
        email: 'test@example.com',
        password: 'PlainTextPassword123!',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        identityType: 'player',
      });

      // Assert: Password should be hashed (not plain text)
      const userAccountsCall = mockClient.query.mock.calls.find((call) =>
        call[0].includes('INSERT INTO user_accounts'),
      );
      const passwordHash = userAccountsCall[1][1]; // Second parameter (password_hash)

      expect(passwordHash).not.toBe('PlainTextPassword123!');
      expect(passwordHash).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix ($2a$ or $2b$)
    });
  });

  // ============================================================================
  // VALIDATE USER TESTS
  // ============================================================================

  describe('validateUser', () => {
    it('should return user data for valid active user', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [testUser] });

      // Act
      const result = await service.validateUser('user-123');

      // Assert
      expect(result).toEqual({
        id: testUser.id,
        email: testUser.email,
        identityType: testUser.identity_type,
        pseudonymId: testUser.pseudonym_id,
        pseudonym: testUser.pseudonym_id,
      });
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Act
      const result = await service.validateUser('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...testUser, is_active: false };
      mockPool.query.mockResolvedValueOnce({ rows: [inactiveUser] });

      // Act
      const result = await service.validateUser('user-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for locked user', async () => {
      // Arrange
      const lockedUser = { ...testUser, is_locked: true };
      mockPool.query.mockResolvedValueOnce({ rows: [lockedUser] });

      // Act
      const result = await service.validateUser('user-123');

      // Assert
      expect(result).toBeNull();
    });
  });
});

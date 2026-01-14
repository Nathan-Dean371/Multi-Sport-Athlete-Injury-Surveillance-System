# Authentication Module Implementation

**Status:** ✅ Complete  
**Date:** January 14, 2026  
**Author:** Development Team

---

## Overview

This document details the implementation of JWT-based authentication for the Multi-Sport Athlete Injury Surveillance System. The authentication module provides secure user registration, login, and session management across the dual-database architecture (PostgreSQL for identity/PII, Neo4j for analytics).

---

## Architecture

### Components

```
backend/src/auth/
├── auth.module.ts          # Module configuration & DI setup
├── auth.service.ts         # Business logic (login, register, validation)
├── auth.controller.ts      # HTTP endpoints
├── jwt.strategy.ts         # Passport JWT validation strategy
├── jwt-auth.guard.ts       # Route protection guard
└── dto/
    └── auth.dto.ts         # Data transfer objects
```

### Technology Stack

- **Framework:** NestJS
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt (cost factor: 10)
- **Strategy Pattern:** Passport.js
- **Database:** PostgreSQL (identity service)

---

## Database Schema

### User Accounts Table

The `user_accounts` table in PostgreSQL serves as the authentication source:

```sql
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    identity_type VARCHAR(20) NOT NULL,  -- 'player', 'coach', 'admin'
    pseudonym_id VARCHAR(50) NOT NULL UNIQUE,
    identity_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Identity Tables Relationship

User accounts link to identity-specific tables:

- **Players:** `player_identities` (contains PII, DOB, medical info)
- **Coaches:** `coach_identities` (contains specialization, qualifications)
- **Admins:** `admin_identities` (contains administrative details)

---

## API Endpoints

### 1. User Registration

**POST** `/auth/register`

Creates a new user account with associated identity record.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2000-01-01",
  "identityType": "player"  // or "coach", "admin"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "534a44f1-72ae-411f-a5a4-f83640fffeb",
    "email": "user@example.com",
    "identityType": "player",
    "pseudonymId": "PSY-PLAYER-A1B2C3D4"
  }
}
```

**Process Flow:**
1. Validate email doesn't already exist
2. Hash password using bcrypt (10 rounds)
3. Generate unique pseudonym ID
4. Create identity record (player/coach/admin table)
5. Create user account record
6. Generate JWT token
7. Return token and user info

### 2. User Login

**POST** `/auth/login`

Authenticates existing user and returns JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "534a44f1-72ae-411f-a5a4-f83640fffeb",
    "email": "user@example.com",
    "identityType": "player",
    "pseudonymId": "PSY-PLAYER-A1B2C3D4"
  }
}
```

**Process Flow:**
1. Query user by email
2. Check if account is active and not locked
3. Verify password using bcrypt.compare()
4. Update `last_login_at` timestamp
5. Reset `failed_login_attempts` to 0
6. Generate JWT token
7. Return token and user info

**Security Features:**
- Account locking after 5 failed attempts
- Tracks failed login attempts
- Records last login timestamp
- Generic error messages (prevents email enumeration)

---

## JWT Token Structure

### Token Payload

```javascript
{
  "sub": "534a44f1-72ae-411f-a5a4-f83640fffeb",  // User ID
  "email": "user@example.com",
  "identityType": "player",
  "pseudonymId": "PSY-PLAYER-A1B2C3D4",
  "iat": 1736881234,    // Issued at
  "exp": 1736967634     // Expiry (24 hours)
}
```

### Token Configuration

- **Algorithm:** HS256 (HMAC-SHA256)
- **Expiration:** 24 hours
- **Secret:** Configurable via environment variable
- **Header:** `Authorization: Bearer <token>`

---

## Security Implementation

### Password Security

1. **Hashing Algorithm:** bcrypt
2. **Cost Factor:** 10 (2^10 = 1024 rounds)
3. **Salt:** Automatically generated and embedded in hash
4. **Storage:** Hash stored in `password_hash`, salt marker in `password_salt`

```typescript
// Password hashing
const passwordHash = await bcrypt.hash(password, 10);

// Password verification
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

### Account Protection

- **Brute Force Prevention:** Lock account after 5 failed attempts
- **Status Checks:** Validates `is_active` and `is_locked` flags
- **Session Tracking:** Records login timestamps and IP addresses
- **Token Expiry:** 24-hour JWT expiration enforced

### Route Protection

Protected routes use the `JwtAuthGuard`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user;  // Injected by JWT strategy
}
```

---

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=identity_service
POSTGRES_USER=identity_admin
POSTGRES_PASSWORD=identity-service-dev-password
```

### Module Registration

```typescript
@Module({
  imports: [
    PostgresModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## Testing

### Manual Testing (PowerShell)

**Register New User:**
```powershell
$registerBody = @{
    email = "test@example.com"
    password = "testpass123"
    firstName = "Test"
    lastName = "User"
    dateOfBirth = "2000-01-01"
    identityType = "player"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
  -Method POST -Body $registerBody -ContentType "application/json"
```

**Login Existing User:**
```powershell
$loginBody = @{
    email = "liam.murphy@email.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
  -Method POST -Body $loginBody -ContentType "application/json"

$token = $response.accessToken
```

**Use Token for Protected Routes:**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/profile" -Headers $headers
```

### Test Accounts

All sample accounts use password: `password123`

**Players:**
- liam.murphy@email.com
- cian.obrien@email.com
- sean.kelly@email.com
- conor.walsh@email.com
- oisin.ryan@email.com

**Coaches:**
- sarah.oconnor@physio.ie
- michael.fitzgerald@coaching.ie

**Admin:**
- james.osullivan@admin.ie

---

## Error Handling

### Common Error Responses

**401 Unauthorized - Invalid Credentials:**
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**401 Unauthorized - Account Inactive:**
```json
{
  "message": "Account is inactive",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**401 Unauthorized - Account Locked:**
```json
{
  "message": "Account is locked",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**409 Conflict - Email Exists:**
```json
{
  "message": "Email already exists",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## Database Transactions

### Registration Transaction

Registration uses PostgreSQL transactions to ensure data integrity:

```typescript
const client = await this.pool.connect();
try {
  await client.query('BEGIN');
  
  // 1. Insert into identity table (player/coach/admin)
  const identityResult = await client.query(/* ... */);
  
  // 2. Insert into user_accounts
  const userResult = await client.query(/* ... */);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

This ensures:
- Both records created or neither created
- No orphaned identity records
- No orphaned user accounts
- Referential integrity maintained

---

## Integration with Neo4j

### Pseudonym ID Synchronization

The authentication system uses **pseudonym IDs** to maintain privacy:

1. **PostgreSQL** stores: Real identity + pseudonym mapping
2. **Neo4j** stores: Graph data using pseudonyms only

**Example:**
- PostgreSQL: `Liam Murphy → PSY-PLAYER-A1B2C3D4`
- Neo4j: Player node with `playerId: "PLAYER-001"` and `pseudonymId: "PSY-PLAYER-A1B2C3D4"`

### Cross-Database Queries

After authentication, the JWT token contains the `pseudonymId` which can be used to query Neo4j:

```typescript
// From JWT token
const { pseudonymId } = req.user;

// Query Neo4j
const query = `
  MATCH (p:Player {pseudonymId: $pseudonymId})-[:HAS_INJURY]->(i:Injury)
  RETURN p, i
`;
```

---

## Implementation Timeline

| Date | Task | Status |
|------|------|--------|
| Jan 14, 2026 | Database modules configured | ✅ Complete |
| Jan 14, 2026 | Auth service implementation | ✅ Complete |
| Jan 14, 2026 | JWT strategy & guards | ✅ Complete |
| Jan 14, 2026 | DTOs and validation | ✅ Complete |
| Jan 14, 2026 | Sample data population | ✅ Complete |
| Jan 14, 2026 | Password hash correction | ✅ Complete |
| Jan 14, 2026 | Testing and verification | ✅ Complete |

---

## Future Enhancements

### Planned Features

1. **Email Verification**
   - Send verification email on registration
   - Require email confirmation before login
   - Add `is_verified` flag validation

2. **Password Reset Flow**
   - Forgot password endpoint
   - Time-limited reset tokens
   - Email-based reset link

3. **Two-Factor Authentication (2FA)**
   - TOTP-based 2FA
   - Backup codes
   - Optional per-user setting

4. **Refresh Tokens**
   - Long-lived refresh tokens
   - Short-lived access tokens
   - Token rotation on refresh

5. **OAuth/Social Login**
   - Google OAuth
   - Microsoft/Azure AD
   - Apple Sign In

6. **Session Management**
   - Multiple device sessions
   - Session revocation
   - "Sign out all devices"

7. **Audit Logging**
   - Login attempt logging
   - IP address tracking
   - Geographic location tracking
   - Suspicious activity alerts

8. **Role-Based Access Control (RBAC)**
   - Granular permissions
   - Role hierarchy
   - Resource-level permissions

---

## Dependencies

### NPM Packages

```json
{
  "@nestjs/jwt": "^10.x.x",
  "@nestjs/passport": "^10.x.x",
  "passport": "^0.7.x",
  "passport-jwt": "^4.x.x",
  "bcryptjs": "^2.x.x",
  "pg": "^8.x.x"
}
```

### Dev Dependencies

```json
{
  "@types/passport-jwt": "^4.x.x",
  "@types/bcryptjs": "^2.x.x"
}
```

---

## Troubleshooting

### Common Issues

**Issue:** "Invalid credentials" on valid password
- **Cause:** Password hash not properly stored
- **Solution:** Regenerate hash using `bcrypt.hash()` with cost factor 10

**Issue:** JWT token not validated
- **Cause:** Secret mismatch or token expired
- **Solution:** Check `JWT_SECRET` consistency, verify token expiration

**Issue:** User account exists but can't login
- **Cause:** `is_active` is false or `is_locked` is true
- **Solution:** Update account status in database

**Issue:** Registration creates identity but no user account
- **Cause:** Transaction failure
- **Solution:** Check database logs, ensure proper transaction handling

---

## References

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Passport.js Documentation](http://www.passportjs.org/)
- [JWT.io - JWT Introduction](https://jwt.io/introduction)
- [bcrypt - NPM Package](https://www.npmjs.com/package/bcryptjs)
- [ADR-0006: JWT Authentication](./decisions/adr-0006-jwt-authentication.md)
- [ADR-0003: Two-Database Privacy Architecture](./decisions/adr-0003-two-database-privacy-architecture.md)

---

## Conclusion

The authentication module provides a secure, scalable foundation for user management in the Multi-Sport Athlete Injury Surveillance System. It successfully integrates with the dual-database architecture, maintaining privacy through pseudonymization while providing robust authentication capabilities.

**Key Achievements:**
- ✅ JWT-based stateless authentication
- ✅ Secure password hashing with bcrypt
- ✅ Role-based identity management (player/coach/admin)
- ✅ Account security features (locking, failed attempt tracking)
- ✅ Transaction-safe registration process
- ✅ Integration with PostgreSQL identity service
- ✅ Pseudonym-based privacy protection
- ✅ Comprehensive error handling
- ✅ Production-ready configuration



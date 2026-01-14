# ADR-0006: JWT-Based Authentication

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean

---

## Context

The injury surveillance system requires secure authentication for:
- Mobile app users (players, coaches)
- Web dashboard users (admins, medical staff)
- API protection
- Role-based access control
- Session management across devices

### Requirements
- Secure authentication mechanism
- Stateless (no server-side session storage)
- Support for multiple clients (mobile, web)
- Role-based authorization
- Reasonable token expiration
- Refresh token support
- Cross-platform compatibility

### Authentication Options Considered

#### 1. Session-Based Authentication
**How it works:**
- Server stores session data
- Client receives session ID cookie
- Session ID maps to user data on server

**Pros:**
- Server has full control
- Easy to revoke sessions
- Well-understood pattern

**Cons:**
- Requires server-side session storage (Redis, database)
- Not ideal for mobile apps (cookies)
- Harder to scale (session affinity required)
- Mobile apps need special handling
- Cross-origin complications

#### 2. OAuth 2.0 / OpenID Connect
**How it works:**
- Delegate authentication to third party
- Use Google, Apple, Microsoft accounts

**Pros:**
- No password management
- Social login convenience
- Professional security

**Cons:**
- Requires external service
- Dependency on third-party
- More complex implementation
- Users may not have accounts
- Privacy concerns (third-party data)
- Overkill for FYP

#### 3. JWT (JSON Web Tokens) - Selected
**How it works:**
- Server signs token with secret
- Client stores token
- Token sent with each request
- Server validates signature

**Pros:**
- Stateless (no server-side storage)
- Self-contained (user info in token)
- Works well with mobile apps
- Cross-platform (HTTP headers)
- Industry standard
- Easy to implement
- Suitable for microservices

**Cons:**
- Token can't be revoked easily (until expiry)
- Token size larger than session ID
- Requires secure storage on client
- Need refresh token strategy

---

## Decision

We will implement **JWT-based authentication** with the following strategy:

### Token Strategy

#### Access Token
- **Purpose**: Authenticate API requests
- **Lifetime**: 15 minutes
- **Storage**: Mobile - AsyncStorage (encrypted), Web - Memory only
- **Contents**: User ID (pseudo_id), role, permissions

#### Refresh Token
- **Purpose**: Obtain new access tokens
- **Lifetime**: 7 days
- **Storage**: Mobile - Secure storage, Web - HttpOnly cookie
- **Contents**: User ID, token family ID (for rotation)

### Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Backend   │
│ (Mobile/Web)│                    │  (NestJS)   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  POST /auth/login                │
       │  { email, password }             │
       ├─────────────────────────────────>│
       │                                  │
       │  { accessToken, refreshToken }   │
       │<─────────────────────────────────┤
       │                                  │
       │  GET /injuries                   │
       │  Authorization: Bearer <token>   │
       ├─────────────────────────────────>│
       │                                  │
       │  Verify JWT + Check Role         │
       │                                  ├──> Valid?
       │                                  │
       │  Response                        │
       │<─────────────────────────────────┤
       │                                  │
```

---

## Implementation Details

### JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;           // Subject (pseudo_id)
  email: string;         // User email
  role: UserRole;        // 'player' | 'coach' | 'medical_staff' | 'admin'
  iat: number;           // Issued at
  exp: number;           // Expiration
}

interface RefreshTokenPayload {
  sub: string;           // Subject (pseudo_id)
  tokenFamily: string;   // For token rotation
  iat: number;
  exp: number;
}
```

### Authentication Flow

#### 1. Login
```typescript
POST /auth/login
{
  "email": "player@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "pseudoId": "uuid-here",
    "email": "player@example.com",
    "role": "player"
  }
}
```

#### 2. API Request with JWT
```typescript
GET /injuries
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 3. Token Refresh
```typescript
POST /auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",  // New access token
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // New refresh token (rotation)
}
```

#### 4. Logout
```typescript
POST /auth/logout
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Invalidate refresh token family in database
```

---

## Security Measures

### 1. Password Hashing
```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. JWT Signing
```typescript
import { JwtService } from '@nestjs/jwt';

generateAccessToken(payload: JwtPayload): string {
  return this.jwtService.sign(payload, {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  });
}

generateRefreshToken(payload: RefreshTokenPayload): string {
  return this.jwtService.sign(payload, {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  });
}
```

### 3. Token Validation
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('NEO4J_DRIVER') private neo4jDriver: Driver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // Additional validation: check if user still exists
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        'MATCH (p:Player {pseudoId: $pseudoId}) RETURN p',
        { pseudoId: payload.sub }
      );
      
      if (result.records.length === 0) {
        throw new UnauthorizedException();
      }
      
      return {
        pseudoId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } finally {
      await session.close();
    }
  }
}
```

### 4. Role-Based Guards
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    
    if (!requiredRoles) {
      return true; // No role restriction
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return requiredRoles.includes(user.role);
  }
}

// Usage
@Controller('injuries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InjuryController {
  @Get()
  @Roles('coach', 'medical_staff', 'admin')
  async findAll() {
    // Only coaches, medical staff, and admins can list injuries
  }
}
```

---

## Token Storage

### Mobile (React Native)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Access token (short-lived, less sensitive)
await AsyncStorage.setItem('access_token', accessToken);

// Refresh token (long-lived, more sensitive)
await SecureStore.setItemAsync('refresh_token', refreshToken);
```

### Web (React)
```typescript
// Access token in memory only (React state/context)
const [accessToken, setAccessToken] = useState<string | null>(null);

// Refresh token in HttpOnly cookie (set by backend)
// Client can't access it (XSS protection)
```

---

## Refresh Token Rotation

To prevent refresh token reuse attacks:

```typescript
@Post('refresh')
async refresh(@Body('refreshToken') refreshToken: string) {
  const payload = this.jwtService.verify(refreshToken, {
    secret: process.env.JWT_REFRESH_SECRET,
  });
  
  // Check if token family is valid (not revoked)
  const isValid = await this.checkTokenFamily(payload.tokenFamily);
  
  if (!isValid) {
    throw new UnauthorizedException('Token family revoked');
  }
  
  // Generate new token family
  const newTokenFamily = uuidv4();
  
  // Revoke old family, store new family
  await this.rotateTokenFamily(payload.tokenFamily, newTokenFamily);
  
  // Issue new tokens
  const newAccessToken = this.generateAccessToken({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  });
  
  const newRefreshToken = this.generateRefreshToken({
    sub: payload.sub,
    tokenFamily: newTokenFamily,
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

---

## Consequences

### Positive

1. **Stateless Architecture**
   - No session storage required
   - Easy to scale horizontally
   - Lower server memory usage

2. **Mobile-Friendly**
   - Works well with HTTP headers
   - No cookie dependencies
   - Cross-platform compatibility

3. **Self-Contained**
   - Token contains user info
   - No database lookup for every request (performance)
   - Can verify token with just secret key

4. **Industry Standard**
   - Well-documented pattern
   - Libraries available
   - Security best practices established

5. **Flexibility**
   - Easy to add claims (permissions, etc.)
   - Can use different tokens for different services
   - Supports microservices architecture

### Negative

1. **Token Revocation**
   - Can't immediately revoke tokens
   - Must wait for expiration
   - Requires blacklist for immediate revocation

2. **Token Size**
   - JWT tokens larger than session IDs
   - More bandwidth per request
   - (Mitigated: typically <1KB)

3. **Secret Management**
   - Must protect JWT secret keys
   - Key rotation is complex
   - Compromised key affects all tokens

4. **Client Storage**
   - Must securely store tokens on client
   - XSS vulnerability if stored in localStorage
   - (Mitigated: use memory + secure storage)

### Mitigation Strategies

1. **Revocation**: 
   - Short access token lifetime (15 min)
   - Refresh token rotation
   - Token family blacklist in database

2. **Size**: 
   - Minimal payload (only essential claims)
   - GZIP compression on transport

3. **Secrets**: 
   - Environment variables
   - Different secrets for access and refresh tokens
   - Separate secrets per environment

4. **Storage**: 
   - Memory-only for access tokens (web)
   - Secure storage for refresh tokens
   - HttpOnly cookies when possible

---

## Authorization Matrix

| Role | Can Report Injury | Can View Team | Can Manage Users |
|------|------------------|---------------|------------------|
| Player | Own injuries | Own teams | No |
| Coach | No | Own teams | No |
| Medical Staff | Any player | All teams | No |
| Admin | Any player | All teams | Yes |

---

## Related Decisions

- ADR-0003: Two-database architecture (stores password hashes in PostgreSQL)
- ADR-0004: NestJS backend (excellent JWT support via Passport)
- ADR-0005: React Native mobile (AsyncStorage + SecureStore)

---

## References

- [JWT.io](https://jwt.io/)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

---

## Review Date

End of Sprint 2 - After implementing authentication flow, review:
- Token lifetime appropriateness
- Refresh strategy effectiveness
- Security posture
- User experience

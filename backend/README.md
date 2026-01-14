# Backend API - Multi-Sport Athlete Injury Surveillance System

NestJS REST API for injury tracking, user management, and analytics with Neo4j graph database integration.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Module Structure](#module-structure)
- [Database Integration](#database-integration)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Neo4j 5.25+ (via Docker or Neo4j Desktop)
- PostgreSQL 15+ (for identity management)
- Git

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see Environment Setup below)
# Edit .env with your database credentials

# Start Neo4j (if using Docker)
docker run -d \
  --name injury-surveillance-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your-password \
  neo4j:latest

# Run database migrations (if applicable)
npm run migration:run

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

**API Documentation (Swagger):** `http://localhost:3000/api/docs`

---

## Architecture Overview

### Technology Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Primary Database:** Neo4j (graph database for injury relationships)
- **Identity Database:** PostgreSQL (secure PII storage)
- **Authentication:** JWT with refresh token rotation
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI 3.0
- **Testing:** Jest

### Design Principles

1. **Privacy by Design:** Two-database architecture separates PII from analytical data
2. **Dependency Injection:** Clean separation of concerns via NestJS DI container
3. **Type Safety:** Full TypeScript coverage with shared types from `/shared`
4. **RBAC:** Role-based access control enforced via Guards
5. **Audit Logging:** Complete trail of all data access in Neo4j

### Module Architecture

```
backend/
├── src/
│   ├── auth/              # Authentication & JWT management
│   ├── users/             # User management & roles
│   ├── injuries/          # Core injury tracking logic
│   ├── players/           # Player profile management
│   ├── teams/             # Team & organization management
│   ├── notifications/     # Push notifications (FCM)
│   ├── audit/             # Audit logging service
│   ├── database/          # Neo4j & PostgreSQL connections
│   ├── shared/            # DTOs, guards, interceptors
│   ├── config/            # Configuration management
│   └── main.ts            # Application entry point
├── test/                  # E2E tests
├── package.json
└── tsconfig.json
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the `backend/` directory with the following:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Neo4j Configuration (Analytical Database)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
NEO4J_DATABASE=neo4j

# PostgreSQL Configuration (Identity Database)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=injury_surveillance_identity

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Cloud Messaging (Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGIN=http://localhost:19006,http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### Environment-Specific Configurations

- **Development:** Uses local Neo4j and PostgreSQL via Docker
- **Testing:** Separate test databases (configured in `test/jest-e2e.json`)
- **Production:** Neo4j Aura + managed PostgreSQL (e.g., AWS RDS)

---

## Development

### Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

### Code Generation

NestJS CLI provides generators for scaffolding:

```bash
# Generate a new module
nest g module <module-name>

# Generate a service
nest g service <module-name>/<service-name>

# Generate a controller
nest g controller <module-name>/<controller-name>

# Generate a complete resource (module, service, controller, DTOs)
nest g resource <resource-name>
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

---

## API Documentation

### Swagger/OpenAPI

Interactive API documentation is automatically generated from code decorators and available at:

**Local:** `http://localhost:3000/api/docs`

The Swagger UI provides:
- Complete endpoint reference with request/response schemas
- Interactive "Try it out" functionality
- Authentication token input for testing protected endpoints
- Schema definitions for all DTOs

### Additional Documentation

Comprehensive API documentation is also available in the documentation repository:

- **[Interactive HTML Documentation](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/api_endpoints.html)**
- **[Neo4j Database Documentation](https://github.com/Nathan-Dean371/FYP-Documentation-Repo/blob/main/neo4j_database_documentation.md)**

### Example: Using Swagger Decorators

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateInjuryDto } from './dto/create-injury.dto';
import { InjuryResponseDto } from './dto/injury-response.dto';

@ApiTags('injuries')
@ApiBearerAuth()
@Controller('injuries')
export class InjuryController {
  
  @Post()
  @ApiOperation({ summary: 'Report a new injury' })
  @ApiResponse({ 
    status: 201, 
    description: 'Injury successfully created',
    type: InjuryResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createInjuryDto: CreateInjuryDto): Promise<InjuryResponseDto> {
    return this.injuryService.create(createInjuryDto);
  }
}
```

---

## Module Structure

### Core Modules

#### 1. Authentication Module (`/auth`)
Handles user authentication and JWT token management.

**Key Features:**
- User registration and login
- JWT access token generation (15min expiry)
- Refresh token rotation (7-day expiry)
- Password hashing with bcrypt
- Token blacklisting on logout

**Endpoints:**
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate and receive tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate tokens

#### 2. Users Module (`/users`)
Manages user profiles and role assignments.

**Key Features:**
- CRUD operations for user profiles
- Role management (player, coach, medical_staff, admin)
- Device token registration for push notifications
- User preferences

**Endpoints:**
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user
- `POST /users/device-token` - Register FCM token

#### 3. Injuries Module (`/injuries`)
Core domain logic for injury tracking and management.

**Key Features:**
- Injury creation with validation
- Update injury status and severity
- Link injuries to treatments and assessments
- Query active/resolved injuries
- Privacy-preserving queries

**Endpoints:**
- `POST /injuries` - Report new injury
- `GET /injuries` - List injuries (filtered by role/permissions)
- `GET /injuries/:id` - Get injury details
- `PATCH /injuries/:id` - Update injury
- `POST /injuries/:id/resolve` - Mark injury as resolved

#### 4. Players Module (`/players`)
Player profile management with pseudonymization.

**Key Features:**
- Player registration
- Sport and team associations
- Injury history aggregation
- Privacy-preserving queries

#### 5. Teams Module (`/teams`)
Team and organization management.

**Key Features:**
- Team creation and management
- Coach/staff assignments
- Player roster management
- Organization hierarchy

#### 6. Audit Module (`/audit`)
Tracks all data access for compliance.

**Key Features:**
- Log all database queries
- Track who accessed what data and when
- Research purpose documentation
- GDPR compliance reporting

---

## Database Integration

### Neo4j (Primary Database)

The application uses the official Neo4j JavaScript driver for graph database operations.

**Connection Setup:**

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j from 'neo4j-driver';

@Module({
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: (configService: ConfigService) => {
        return neo4j.driver(
          configService.get('NEO4J_URI'),
          neo4j.auth.basic(
            configService.get('NEO4J_USER'),
            configService.get('NEO4J_PASSWORD')
          )
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: ['NEO4J_DRIVER'],
})
export class DatabaseModule {}
```

**Service Usage:**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';

@Injectable()
export class InjuryService {
  constructor(
    @Inject('NEO4J_DRIVER') private neo4jDriver: Driver
  ) {}

  async createInjury(data: CreateInjuryDto): Promise<Injury> {
    const session: Session = this.neo4jDriver.session();
    
    try {
      const result = await session.run(
        `
        CREATE (i:Injury {
          id: randomUUID(),
          bodyPart: $bodyPart,
          severity: $severity,
          occurredAt: datetime($occurredAt),
          isResolved: false
        })
        RETURN i
        `,
        data
      );
      
      return result.records[0].get('i').properties;
    } finally {
      await session.close();
    }
  }
}
```

### PostgreSQL (Identity Database)

Uses TypeORM for relational data management.

**Configuration:**

```typescript
// src/database/identity.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Identity } from './entities/identity.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [Identity],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class IdentityModule {}
```

### Database Best Practices

1. **Always close sessions:** Use try-finally blocks to ensure Neo4j sessions are closed
2. **Use transactions:** Wrap complex operations in transactions for atomicity
3. **Parameterized queries:** Never concatenate user input into Cypher queries
4. **Connection pooling:** Let the driver manage connection pools (default config is fine)
5. **Migrations:** Use TypeORM migrations for PostgreSQL schema changes

---

## Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

**Example Unit Test:**

```typescript
// injuries.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { InjuryService } from './injury.service';

describe('InjuryService', () => {
  let service: InjuryService;
  let mockNeo4jDriver: any;

  beforeEach(async () => {
    mockNeo4jDriver = {
      session: jest.fn().mockReturnValue({
        run: jest.fn(),
        close: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InjuryService,
        {
          provide: 'NEO4J_DRIVER',
          useValue: mockNeo4jDriver,
        },
      ],
    }).compile();

    service = module.get<InjuryService>(InjuryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an injury', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```bash
# Run E2E tests
npm run test:e2e
```

### Test Databases

Configure separate test databases in your `.env.test` file to avoid polluting development data.

---

## Deployment

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Build and Run:**

```bash
# Build Docker image
docker build -t injury-surveillance-api .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name api \
  injury-surveillance-api
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Configure Neo4j Aura or self-hosted production instance
- [ ] Set up managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS with specific origins
- [ ] Set up application monitoring (e.g., Sentry)
- [ ] Configure log aggregation (e.g., CloudWatch, Datadog)
- [ ] Set up automated backups for both databases
- [ ] Disable TypeORM synchronize (use migrations instead)
- [ ] Configure rate limiting
- [ ] Set up health check endpoints
- [ ] Configure CI/CD pipeline

---

## Troubleshooting

### Common Issues

**Neo4j Connection Errors:**
```bash
# Check if Neo4j is running
docker ps | grep neo4j

# Check Neo4j logs
docker logs injury-surveillance-neo4j

# Verify credentials
# Make sure NEO4J_PASSWORD in .env matches docker run command
```

**TypeORM Connection Issues:**
```bash
# Verify PostgreSQL is running
psql -h localhost -U postgres -d injury_surveillance_identity

# Check database exists
psql -h localhost -U postgres -c "\l"
```

**Port Already in Use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Module Not Found Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Related Documentation

- **[Architecture Decision Records](../docs/decisions/README.md)** - All major technical decisions
- **[Neo4j Setup Guide](../docs/setup/neo4j-setup-guide.md)** - Detailed Neo4j installation
- **[Monorepo Structure](../README.md)** - Overall project organization
- **[Interactive API Docs](https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/api_endpoints.html)** - External API reference

---

## Contributing

### Code Style

This project follows the [NestJS Style Guide](https://docs.nestjs.com/):
- Use dependency injection for all services
- Follow module/service/controller separation
- Use DTOs for all request/response validation
- Implement guards for authorization
- Use interceptors for cross-cutting concerns

**Last Updated:** January 2025  
**NestJS Version:** 10+  
**Node Version:** 18+  
**Maintainer:** Nathan Dean

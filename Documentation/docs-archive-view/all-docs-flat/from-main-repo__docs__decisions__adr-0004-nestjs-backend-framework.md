# ADR-0004: NestJS Backend Framework

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean

---

## Context

The backend API needs to:
- Handle authentication and authorization
- Manage connections to Neo4j and PostgreSQL
- Provide RESTful API endpoints for mobile and web clients
- Implement business logic for injury tracking
- Support role-based access control
- Integrate with Firebase Cloud Messaging
- Maintain audit logs
- Be scalable and maintainable

### Framework Options Considered

#### 1. Express.js (Minimal Framework)
**Pros:**
- Lightweight and flexible
- Large ecosystem
- Well-documented
- Fast performance

**Cons:**
- No built-in structure (need to create architecture)
- Manual dependency injection
- No built-in validation
- More boilerplate code
- Harder to maintain as project grows

#### 2. Fastify
**Pros:**
- High performance
- Schema validation built-in
- Good TypeScript support

**Cons:**
- Smaller ecosystem than Express
- Less structure than NestJS
- Still requires architectural decisions

#### 3. NestJS (Selected)
**Pros:**
- Built on Express (can use Express middleware)
- Strong TypeScript support (built for TypeScript)
- Opinionated architecture (follows Angular patterns)
- Built-in dependency injection
- Excellent testing support
- Module-based architecture
- Decorators for clean code
- Guards, Interceptors, Pipes for cross-cutting concerns
- CLI for code generation
- Good documentation

**Cons:**
- Larger bundle size
- Steeper learning curve initially
- More "magic" with decorators

---

## Decision

We will use **NestJS** as the backend framework for the following reasons:

### 1. TypeScript-First Design
NestJS is built specifically for TypeScript, which aligns with our monorepo strategy where we share types between frontend and backend.

```typescript
// Shared type in monorepo
export interface InjuryDTO {
  bodyPart: string;
  injuryType: string;
  severity: 'mild' | 'moderate' | 'severe';
  painLevel: number;
}

// Used in NestJS controller
@Post()
async createInjury(@Body() injuryDto: InjuryDTO) {
  return this.injuryService.create(injuryDto);
}
```

### 2. Module-Based Architecture
Fits naturally with our domain model:

```
backend/
├── auth/           # Authentication module
├── users/          # User management module
├── injuries/       # Injury tracking module
├── players/        # Player management module
├── teams/          # Team management module
├── notifications/  # FCM module
└── audit/          # Audit logging module
```

Each module is self-contained with:
- Controller (routes)
- Service (business logic)
- DTOs (validation)
- Guards (authorization)

### 3. Built-in Dependency Injection
Clean separation of concerns:

```typescript
@Injectable()
export class InjuryService {
  constructor(
    @Inject('NEO4J_DRIVER') private neo4jDriver: Driver,
    private identityService: IdentityService,
    private auditService: AuditService,
  ) {}
}
```

### 4. Validation and Transformation
Built-in validation with `class-validator`:

```typescript
export class CreateInjuryDto {
  @IsString()
  @IsNotEmpty()
  bodyPart: string;

  @IsEnum(['mild', 'moderate', 'severe'])
  severity: string;

  @IsInt()
  @Min(0)
  @Max(10)
  painLevel: number;
}
```

### 5. Guards and Decorators
Clean implementation of role-based access control:

```typescript
@Controller('injuries')
@UseGuards(JwtAuthGuard)
export class InjuryController {
  @Get()
  @Roles('coach', 'medical_staff')
  async findAll() { }
  
  @Post()
  @Roles('player', 'medical_staff')
  async create() { }
}
```

### 6. Testing Support
First-class testing support:

```typescript
describe('InjuryService', () => {
  let service: InjuryService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [InjuryService, MockNeo4jService],
    }).compile();
    
    service = module.get<InjuryService>(InjuryService);
  });
  
  it('should create an injury', async () => {
    // Test implementation
  });
});
```

### 7. Academic Value
Demonstrates understanding of:
- Design patterns (Dependency Injection, Decorators)
- SOLID principles
- Enterprise architecture patterns
- Modern TypeScript development

---

## Consequences

### Positive

1. **Structure and Organization**
   - Clear project structure out of the box
   - Module boundaries enforce separation of concerns
   - Easier to onboard new developers (if needed)

2. **Type Safety**
   - Full TypeScript support throughout
   - Compile-time error checking
   - IntelliSense support in IDEs

3. **Code Quality**
   - Built-in validation reduces bugs
   - Dependency injection enables testability
   - Guards/Interceptors for cross-cutting concerns

4. **Developer Experience**
   - CLI for generating boilerplate
   - Extensive documentation
   - Large community and ecosystem

5. **Maintainability**
   - Consistent patterns throughout codebase
   - Easy to add new features
   - Refactoring is safer with TypeScript

6. **Integration**
   - Easy to integrate Neo4j driver
   - PostgreSQL support via TypeORM
   - Firebase Admin SDK integration
   - Passport.js for authentication

### Negative

1. **Learning Curve**
   - Need to learn NestJS concepts (modules, providers, etc.)
   - Decorator syntax may be unfamiliar
   - More abstractions than Express

2. **Bundle Size**
   - Larger than minimal Express app
   - More dependencies

3. **Performance**
   - Slight overhead compared to raw Express
   - (Note: Still very performant, unlikely to matter for FYP scale)

4. **Flexibility Trade-off**
   - More opinionated (less freedom)
   - Must follow NestJS patterns

### Mitigation

- **Learning**: Excellent official documentation and tutorials
- **Size**: Not a concern for backend (no client-side bundle)
- **Performance**: Scale is appropriate for FYP, optimization premature
- **Flexibility**: Structure actually beneficial for academic project

---

## Implementation Strategy

### Phase 1: Setup
```bash
cd backend
npx @nestjs/cli new . --skip-git
```

### Phase 2: Core Modules
Create in order:
1. Database module (Neo4j + PostgreSQL connections)
2. Auth module (JWT, Passport)
3. Users module (identity management)
4. Injuries module (core domain logic)

### Phase 3: Extensions
5. Players, Teams, Organizations modules
6. Notifications module (FCM)
7. Audit module

### Development Workflow
```bash
# Generate new module
nest g module injuries

# Generate service
nest g service injuries

# Generate controller
nest g controller injuries

# Generate guard
nest g guard auth/jwt-auth

# Run tests
npm test

# Run in dev mode
npm run start:dev
```

---

## Integration Examples

### Neo4j Integration
```typescript
@Module({
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: (configService: ConfigService) => {
        return neo4j.driver(
          configService.get('NEO4J_URI'),
          neo4j.auth.basic(
            configService.get('NEO4J_USER'),
            configService.get('NEO4J_PASSWORD'),
          ),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: ['NEO4J_DRIVER'],
})
export class DatabaseModule {}
```

### PostgreSQL Integration
```typescript
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
        entities: [Identity, DeviceToken],
        synchronize: true, // Disable in production
      }),
      inject: [ConfigService],
    }),
  ],
})
export class IdentityModule {}
```

---

## Alternatives Considered

### Why Not Express + TypeScript?
While lighter, Express lacks:
- Structure (need to create manually)
- Dependency injection (need to implement)
- Validation (need external library)
- Testing utilities (need to set up)

For a 6-month FYP, NestJS's structure is more valuable than Express's flexibility.

### Why Not Django/Flask (Python)?
- TypeScript monorepo requires Node.js backend
- Can't share types with frontend
- Different deployment model

### Why Not Spring Boot (Java)?
- Separate language from frontend
- Heavier runtime
- Less aligned with modern web development

---

## Related Decisions

- ADR-0001: Monorepo architecture (enables TypeScript sharing)
- ADR-0002: Neo4j database (NestJS has good Neo4j driver support)
- ADR-0003: Two-database architecture (NestJS handles multiple connections well)
- ADR-0005: React Native mobile (TypeScript across stack)

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Neo4j Integration](https://docs.nestjs.com/recipes/neo4j)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---


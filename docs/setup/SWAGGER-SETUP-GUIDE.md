# Swagger/OpenAPI Setup Guide

Complete guide for implementing auto-generated API documentation in your NestJS backend.

---

## Table of Contents

- [Installation](#installation)
- [Basic Configuration](#basic-configuration)
- [Decorator Reference](#decorator-reference)
- [DTO Documentation](#dto-documentation)
- [Authentication Configuration](#authentication-configuration)
- [Response Documentation](#response-documentation)
- [Best Practices](#best-practices)
- [Examples by Module](#examples-by-module)

---

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install --save @nestjs/swagger swagger-ui-express
```

### 2. Update main.ts

Add Swagger configuration to your application bootstrap:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Injury Surveillance System API')
    .setDescription('REST API for Multi-Sport Athlete Injury Tracking and Analytics')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name will be used in controllers
    )
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management')
    .addTag('injuries', 'Injury tracking and management')
    .addTag('players', 'Player profile management')
    .addTag('teams', 'Team and organization management')
    .addTag('notifications', 'Push notification management')
    .addTag('audit', 'Audit logging and compliance')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.production.com', 'Production')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Injury Surveillance API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { color: #E0234E }
    `,
  });
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:19006',
    credentials: true,
  });
  
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getApplicationUrl()}`);
  console.log(`Swagger docs available at: ${await app.getApplicationUrl()}/api/docs`);
}

bootstrap();
```

### 3. Verify Setup

Start your application:

```bash
npm run start:dev
```

Navigate to: **http://localhost:3000/api/docs**

You should see the Swagger UI with your API documentation.

---

## Basic Configuration

### Controller-Level Decorators

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('injuries') // Groups endpoints under "injuries" tag
@ApiBearerAuth('JWT-auth') // Requires JWT authentication
@Controller('injuries')
export class InjuryController {
  
  @Get()
  @ApiOperation({ summary: 'List all injuries', description: 'Returns a paginated list of injuries filtered by user role' })
  async findAll() {
    // Implementation
  }
}
```

### Method-Level Decorators

```typescript
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@Get(':id')
@ApiOperation({ summary: 'Get injury by ID' })
@ApiParam({ name: 'id', description: 'Injury unique identifier', type: String })
@ApiResponse({ status: 200, description: 'Injury found', type: InjuryResponseDto })
@ApiResponse({ status: 404, description: 'Injury not found' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async findOne(@Param('id') id: string) {
  // Implementation
}
```

---

## Decorator Reference

### @ApiTags()
Groups related endpoints together in Swagger UI.

```typescript
@ApiTags('injuries')
@Controller('injuries')
export class InjuryController {}
```

### @ApiOperation()
Describes what an endpoint does.

```typescript
@Get()
@ApiOperation({ 
  summary: 'List all injuries',
  description: 'Returns paginated injuries with optional filters'
})
async findAll() {}
```

### @ApiResponse()
Documents possible response status codes and types.

```typescript
@Post()
@ApiResponse({ 
  status: 201, 
  description: 'Injury created successfully',
  type: InjuryResponseDto 
})
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async create(@Body() dto: CreateInjuryDto) {}
```

### @ApiParam()
Documents URL parameters.

```typescript
@Get(':id')
@ApiParam({ 
  name: 'id', 
  description: 'Injury UUID',
  example: '123e4567-e89b-12d3-a456-426614174000'
})
async findOne(@Param('id') id: string) {}
```

### @ApiQuery()
Documents query parameters.

```typescript
@Get()
@ApiQuery({ 
  name: 'status', 
  required: false, 
  enum: ['active', 'resolved', 'all'],
  description: 'Filter by injury status'
})
@ApiQuery({ 
  name: 'page', 
  required: false, 
  type: Number,
  description: 'Page number for pagination'
})
async findAll(
  @Query('status') status?: string,
  @Query('page') page?: number,
) {}
```

### @ApiBody()
Documents request body (alternative to using DTO decorators).

```typescript
@Post()
@ApiBody({ 
  description: 'Injury details',
  type: CreateInjuryDto,
  examples: {
    example1: {
      summary: 'Ankle sprain',
      value: {
        bodyPart: 'ankle',
        injuryType: 'sprain',
        severity: 'moderate',
        painLevel: 6
      }
    }
  }
})
async create(@Body() dto: CreateInjuryDto) {}
```

### @ApiBearerAuth()
Indicates endpoint requires JWT authentication.

```typescript
@ApiBearerAuth('JWT-auth')
@Controller('injuries')
export class InjuryController {}
```

### @ApiHeader()
Documents required headers.

```typescript
@Post()
@ApiHeader({ 
  name: 'X-Request-ID',
  description: 'Unique request identifier for tracing',
  required: false
})
async create() {}
```

---

## DTO Documentation

### Basic DTO with Swagger Decorators

```typescript
// src/injuries/dto/create-injury.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, IsOptional, Min, Max, IsDateString } from 'class-validator';

export class CreateInjuryDto {
  
  @ApiProperty({
    description: 'Body part affected by injury',
    example: 'ankle',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  bodyPart: string;
  
  @ApiProperty({
    description: 'Type of injury',
    example: 'sprain',
    examples: ['sprain', 'strain', 'fracture', 'contusion', 'laceration'],
  })
  @IsString()
  injuryType: string;
  
  @ApiProperty({
    description: 'Severity level of the injury',
    enum: ['mild', 'moderate', 'severe'],
    example: 'moderate',
  })
  @IsEnum(['mild', 'moderate', 'severe'])
  severity: 'mild' | 'moderate' | 'severe';
  
  @ApiProperty({
    description: 'Pain level reported by athlete',
    minimum: 0,
    maximum: 10,
    example: 6,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel: number;
  
  @ApiPropertyOptional({
    description: 'How the injury occurred',
    example: 'Landed awkwardly after jump',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  mechanism?: string;
  
  @ApiProperty({
    description: 'When the injury occurred (ISO 8601 format)',
    example: '2025-01-15T14:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  occurredAt: string;
}
```

### Response DTO

```typescript
// src/injuries/dto/injury-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class InjuryResponseDto {
  
  @ApiProperty({
    description: 'Unique injury identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
  
  @ApiProperty({
    description: 'Affected body part',
    example: 'ankle',
  })
  bodyPart: string;
  
  @ApiProperty({
    description: 'Type of injury',
    example: 'sprain',
  })
  injuryType: string;
  
  @ApiProperty({
    description: 'Severity level',
    enum: ['mild', 'moderate', 'severe'],
  })
  severity: string;
  
  @ApiProperty({
    description: 'Pain level (0-10)',
    example: 6,
  })
  painLevel: number;
  
  @ApiProperty({
    description: 'Whether injury is resolved',
    example: false,
  })
  isResolved: boolean;
  
  @ApiProperty({
    description: 'When injury occurred',
    example: '2025-01-15T14:30:00.000Z',
  })
  occurredAt: Date;
  
  @ApiProperty({
    description: 'When injury was reported',
    example: '2025-01-15T15:00:00.000Z',
  })
  reportedAt: Date;
}
```

### Paginated Response DTO

```typescript
// src/shared/dto/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  currentPage: number;
  
  @ApiProperty({ example: 10 })
  itemsPerPage: number;
  
  @ApiProperty({ example: 100 })
  totalItems: number;
  
  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ type: [Object] })
  items: T[];
  
  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

// Usage in controller
@Get()
@ApiResponse({ 
  status: 200, 
  description: 'Paginated list of injuries',
  schema: {
    allOf: [
      { $ref: '#/components/schemas/PaginatedResponseDto' },
      {
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/InjuryResponseDto' },
          },
        },
      },
    ],
  },
})
async findAll(): Promise<PaginatedResponseDto<InjuryResponseDto>> {}
```

---

## Authentication Configuration

### JWT Authentication Setup

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    // Implementation
  }
  
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and receive JWT tokens' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    // Implementation
  }
  
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout() {
    // Implementation
  }
}
```

### Auth DTOs

```typescript
// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'athlete@example.com',
  })
  @IsEmail()
  email: string;
  
  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}

// src/auth/dto/auth-response.dto.ts
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (15min expiry)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
  
  @ApiProperty({
    description: 'JWT refresh token (7day expiry)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
  
  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}
```

---

## Response Documentation

### Error Response DTO

```typescript
// src/shared/dto/error-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;
  
  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message: string;
  
  @ApiProperty({
    description: 'Detailed error information',
    example: ['bodyPart should not be empty', 'painLevel must be between 0 and 10'],
    type: [String],
    required: false,
  })
  errors?: string[];
}
```

### Applying Error Responses Globally

```typescript
// Use in controllers
@Post()
@ApiResponse({ status: 201, type: InjuryResponseDto })
@ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
@ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
async create(@Body() dto: CreateInjuryDto) {}
```

---

## Best Practices

### 1. Use Separate DTOs for Requests and Responses

```typescript
// ✅ Good - Separate DTOs
export class CreateInjuryDto { /* input fields */ }
export class UpdateInjuryDto extends PartialType(CreateInjuryDto) {}
export class InjuryResponseDto { /* output fields with id, timestamps */ }

// ❌ Bad - Single DTO for everything
export class InjuryDto { /* mixed input/output */ }
```

### 2. Document All Enum Values

```typescript
@ApiProperty({
  description: 'User role',
  enum: UserRole,
  enumName: 'UserRole',
  examples: ['player', 'coach', 'medical_staff', 'admin'],
})
role: UserRole;
```

### 3. Provide Examples

```typescript
@ApiProperty({
  description: 'Body part',
  example: 'ankle',
  examples: ['ankle', 'knee', 'shoulder', 'hamstring', 'lower_back'],
})
bodyPart: string;
```

### 4. Group Related Endpoints with Tags

```typescript
@ApiTags('injuries:reporting')
@Controller('injuries/report')
export class InjuryReportingController {}

@ApiTags('injuries:analytics')
@Controller('injuries/analytics')
export class InjuryAnalyticsController {}
```

### 5. Document Deprecation

```typescript
@Get('old-endpoint')
@ApiOperation({ 
  summary: 'Old endpoint (deprecated)',
  deprecated: true,
  description: 'Use GET /injuries instead'
})
async oldEndpoint() {}
```

### 6. Use Schema Composition

```typescript
import { IntersectionType, PickType, OmitType } from '@nestjs/swagger';

// Combine DTOs
export class UpdateInjuryDto extends IntersectionType(
  PartialType(CreateInjuryDto),
  PickType(InjuryResponseDto, ['id'] as const)
) {}

// Omit fields
export class PublicUserDto extends OmitType(UserDto, ['password', 'refreshToken'] as const) {}
```

---

## Examples by Module

### Complete Controller Example: Injuries Module

```typescript
// src/injuries/injuries.controller.ts
import { 
  Controller, Get, Post, Patch, Delete, 
  Body, Param, Query, UseGuards, Request 
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InjuryService } from './injuries.service';
import { CreateInjuryDto, UpdateInjuryDto, InjuryResponseDto } from './dto';
import { PaginatedResponseDto } from '../shared/dto/paginated-response.dto';
import { ErrorResponseDto } from '../shared/dto/error-response.dto';

@ApiTags('injuries')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('injuries')
export class InjuryController {
  constructor(private readonly injuryService: InjuryService) {}
  
  @Post()
  @Roles('player', 'coach', 'medical_staff')
  @ApiOperation({ 
    summary: 'Report a new injury',
    description: 'Creates a new injury record and associates it with the reporting user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Injury successfully created',
    type: InjuryResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token missing or invalid',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User role not permitted',
    type: ErrorResponseDto 
  })
  async create(
    @Body() createInjuryDto: CreateInjuryDto,
    @Request() req,
  ): Promise<InjuryResponseDto> {
    return this.injuryService.create(createInjuryDto, req.user.pseudoId);
  }
  
  @Get()
  @Roles('player', 'coach', 'medical_staff', 'admin')
  @ApiOperation({ 
    summary: 'List injuries',
    description: 'Returns a paginated list of injuries filtered by user role and permissions'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['active', 'resolved', 'all'],
    description: 'Filter by injury resolution status'
  })
  @ApiQuery({ 
    name: 'severity', 
    required: false, 
    enum: ['mild', 'moderate', 'severe'],
    description: 'Filter by severity level'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of injuries retrieved successfully',
    type: PaginatedResponseDto<InjuryResponseDto>
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized',
    type: ErrorResponseDto 
  })
  async findAll(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req?,
  ): Promise<PaginatedResponseDto<InjuryResponseDto>> {
    return this.injuryService.findAll(
      req.user.pseudoId,
      req.user.role,
      { status, severity, page, limit }
    );
  }
  
  @Get(':id')
  @Roles('player', 'coach', 'medical_staff', 'admin')
  @ApiOperation({ summary: 'Get injury details by ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'Injury UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury details retrieved',
    type: InjuryResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - No permission to view this injury',
    type: ErrorResponseDto 
  })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<InjuryResponseDto> {
    return this.injuryService.findOne(id, req.user.pseudoId, req.user.role);
  }
  
  @Patch(':id')
  @Roles('medical_staff', 'admin')
  @ApiOperation({ 
    summary: 'Update injury details',
    description: 'Updates injury information. Restricted to medical staff and admins.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Injury UUID'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury updated successfully',
    type: InjuryResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden',
    type: ErrorResponseDto 
  })
  async update(
    @Param('id') id: string,
    @Body() updateInjuryDto: UpdateInjuryDto,
  ): Promise<InjuryResponseDto> {
    return this.injuryService.update(id, updateInjuryDto);
  }
  
  @Post(':id/resolve')
  @Roles('medical_staff', 'admin')
  @ApiOperation({ 
    summary: 'Mark injury as resolved',
    description: 'Sets injury status to resolved and records resolution timestamp'
  })
  @ApiParam({ name: 'id', description: 'Injury UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury marked as resolved',
    type: InjuryResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found',
    type: ErrorResponseDto 
  })
  async resolve(@Param('id') id: string): Promise<InjuryResponseDto> {
    return this.injuryService.resolve(id);
  }
}
```

---

## Advanced Features

### Custom Swagger Plugin

For automatic DTO property inference:

```typescript
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

This allows you to omit many `@ApiProperty()` decorators as they'll be inferred from `class-validator` decorators.

### Export OpenAPI JSON

```typescript
// src/main.ts (add after SwaggerModule.createDocument)
const document = SwaggerModule.createDocument(app, config);

// Write to file (for external tools)
import { writeFileSync } from 'fs';
writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
```

---

## Troubleshooting

### Issue: DTOs not appearing in Swagger

**Solution:** Ensure DTOs are properly imported and used in controller method signatures:

```typescript
// Bad
async create(@Body() dto: any) {}

// Good
async create(@Body() dto: CreateInjuryDto): Promise<InjuryResponseDto> {}
```

### Issue: Enum not showing in Swagger UI

**Solution:** Use `enumName` option:

```typescript
@ApiProperty({
  enum: UserRole,
  enumName: 'UserRole', // Add this
})
role: UserRole;
```

### Issue: Authentication not working in Swagger UI

**Solution:** Verify:
1. `addBearerAuth()` name matches `@ApiBearerAuth()` name
2. JWT token is valid
3. `persistAuthorization: true` in Swagger options

---

## Testing Swagger Setup

### Manual Testing Checklist

- [ ] Navigate to `/api/docs`
- [ ] Verify all endpoints are listed
- [ ] Check tag grouping
- [ ] Test "Try it out" on public endpoints
- [ ] Authenticate using "Authorize" button
- [ ] Test protected endpoints
- [ ] Verify error responses
- [ ] Check request/response schemas
- [ ] Confirm examples are helpful

---

## Related Documentation

- **[NestJS OpenAPI Documentation](https://docs.nestjs.com/openapi/introduction)**
- **[Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)**
- **[OpenAPI 3.0 Specification](https://swagger.io/specification/)**

---

**Last Updated:** January 2025  
**NestJS Version:** 10+  
**Swagger Version:** 7+

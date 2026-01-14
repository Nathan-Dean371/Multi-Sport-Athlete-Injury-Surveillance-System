# Database Tests

This directory contains tests for the database connections and basic operations.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the databases:**
   ```bash
   docker-compose up -d neo4j postgres
   ```

3. **Wait for databases to be ready** (usually takes 10-30 seconds)

## Running Tests

Run all tests:
```bash
npm test
```

Run only database tests:
```bash
npm run test:databases
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Test Structure

- `databases/neo4j.test.ts` - Tests for Neo4j graph database connection
- `databases/postgres.test.ts` - Tests for PostgreSQL database connection

## Environment Variables

You can override default connection settings using environment variables:

### Neo4j
- `NEO4J_URI` - Default: `bolt://localhost:7687`
- `NEO4J_USER` - Default: `neo4j`
- `NEO4J_PASSWORD` - Default: `injury-surveillance-dev-password`
- `NEO4J_DATABASE` - Default: `neo4j`

### PostgreSQL
- `POSTGRES_HOST` - Default: `localhost`
- `POSTGRES_PORT` - Default: `5432`
- `POSTGRES_DB` - Default: `identity_service`
- `POSTGRES_USER` - Default: `identity_admin`
- `POSTGRES_PASSWORD` - Default: `identity-service-dev-password`

## Test Coverage

The tests cover:
- Basic database connectivity
- Query execution
- Parameterized queries
- Database metadata retrieval
- Connection pooling (PostgreSQL)
- Node counting (Neo4j)

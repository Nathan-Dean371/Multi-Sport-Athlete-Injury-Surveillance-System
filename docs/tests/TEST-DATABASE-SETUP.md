# Test Database Setup - Quick Reference

## Overview

The test environment now uses completely isolated databases:

- **PostgreSQL:** `identity_service_test` database (in existing container)
- **Neo4j:** Dedicated test container on different ports

This ensures E2E tests **never affect development data**.

---

## Container Configuration

### Development Databases

- **PostgreSQL Dev:** localhost:5432/identity_service
  - User: identity_admin
  - Password: identity-service-dev-password
  - Container: injury-surveillance-postgres

- **Neo4j Dev:** bolt://localhost:7687
  - Browser: http://localhost:7474
  - User: neo4j
  - Password: injury-surveillance-dev-password
  - Container: injury-surveillance-neo4j

### Test Databases

- **PostgreSQL Test:** localhost:5432/identity_service_test
  - User: identity_admin
  - Password: identity-service-dev-password
  - Container: injury-surveillance-postgres (same container, different DB)

- **Neo4j Test:** bolt://localhost:7688
  - Browser: http://localhost:7475
  - User: neo4j
  - Password: injury-surveillance-test-password
  - Container: injury-surveillance-neo4j-test (separate container)

---

## Quick Commands

### Start/Stop Containers

```powershell
# Stop all containers
docker-compose down

# Start all containers (including neo4j-test)
docker-compose up -d

# Check status
docker ps
```

### Schema Management

```powershell
# Initialize/reset test databases
.\scripts\setup-test-databases.ps1

# Sync schema changes from dev to test
.\scripts\sync-test-schema.ps1
```

### Run Tests

```powershell
cd backend

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e-spec.ts

# Run with coverage
npm run test:cov
```

### Manual Database Access

```powershell
# PostgreSQL test DB
docker exec -it injury-surveillance-postgres psql -U identity_admin -d identity_service_test

# Neo4j test DB (browser)
# Open: http://localhost:7475
# Connect with: neo4j / injury-surveillance-test-password

# Neo4j test DB (CLI)
docker exec -it injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password -d neo4j
```

---

## Workflow

### When Making Schema Changes

1. Update schema files in `database/postgres/` or `database/neo4j/`
2. Apply to development database (manually or via scripts)
3. Run sync script to update test database:
   ```powershell
   .\scripts\sync-test-schema.ps1
   ```
4. Run E2E tests to verify:
   ```powershell
   cd backend
   npm run test:e2e
   ```

### When Writing New E2E Tests

1. Test cleanup helpers now **SAFE to use**:
   - `cleanPostgresTestDb()` - cleans PostgreSQL test DB
   - `cleanNeo4jTestDb()` - cleans Neo4j test container (NOT dev!)
   - `cleanAllTestDatabases()` - cleans both test DBs

2. Tests automatically connect to test databases via `.env.test`

3. Example test structure:

   ```typescript
   describe("Feature E2E Tests", () => {
     beforeEach(async () => {
       await cleanPostgresTestDb(postgresPool);
       await cleanNeo4jTestDb(neo4jDriver);
     });

     it("should test feature", async () => {
       // Test code - safe to create/delete data
     });
   });
   ```

---

## Files Created/Modified

### Docker Configuration

- `docker-compose.yml` - Added neo4j-test container

### Database Initialization

- `database/postgres/init-test-db.sql` - PostgreSQL test DB setup
- `database/neo4j/init-test-db.cypher` - Neo4j test DB setup

### Scripts

- `scripts/setup-test-databases.ps1` - One-time test DB initialization
- `scripts/sync-test-schema.ps1` - Sync schema from dev to test

### Backend Configuration

- `backend/.env.test` - Updated to use neo4j-test container (port 7688)
- `backend/test/helpers/cleanup.ts` - Updated warnings (now SAFE to use)

---

## Benefits

✅ **Complete Isolation:** Dev and test databases are 100% separate  
✅ **Safe Testing:** E2E tests can create/delete data without risk  
✅ **Schema Sync:** Easy to keep test environment in sync with dev  
✅ **Fast Reset:** Wipe test DBs anytime without affecting development  
✅ **Realistic:** Test environment mirrors production architecture  
✅ **CI/CD Ready:** Can be easily integrated into automated pipelines

---

## Troubleshooting

### Test container not starting

```powershell
# Check logs
docker logs injury-surveillance-neo4j-test

# Restart container
docker-compose restart neo4j-test
```

### Schema out of sync

```powershell
# Re-run sync script
.\scripts\sync-test-schema.ps1

# Or manually apply schema
Get-Content database\neo4j\schema-setup.cypher | docker exec -i injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password -d neo4j
```

### Tests failing with connection errors

1. Verify containers are running: `docker ps`
2. Check `.env.test` has correct ports (7688 for Neo4j, 5432 for PostgreSQL)
3. Verify test databases exist:

   ```powershell
   # PostgreSQL
   docker exec -i injury-surveillance-postgres psql -U identity_admin -d identity_service_test -c "\dt"

   # Neo4j
   docker exec -i injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password "MATCH (n) RETURN count(n)"
   ```

---

## Next Steps

1. ✅ Test databases are ready
2. ⏭️ Run existing E2E tests to verify: `cd backend && npm run test:e2e`
3. ⏭️ Write new E2E tests for Injuries, Teams, Status endpoints
4. ⏭️ Generate coverage report: `npm run test:cov`
5. ⏭️ Document test patterns in ADR-0008

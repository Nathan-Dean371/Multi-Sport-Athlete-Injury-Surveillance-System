# Database Connection Tests Documentation

This document provides a comprehensive breakdown of all database connection tests, their scope, and the functionality they validate.

## Overview

The test suite validates connectivity and basic operations for both databases in the Multi-Sport Athlete Injury Surveillance System:
- **Neo4j** - Graph database for athlete relationships and injury data
- **PostgreSQL** - Relational database for identity service

## Test Files

### `tests/databases/neo4j.test.ts`
Neo4j graph database connection and query tests

### `tests/databases/postgres.test.ts`
PostgreSQL relational database connection and query tests

---

## Neo4j Tests (6 tests)

### 1. Connection & Authentication

#### ✓ should successfully connect to Neo4j
**Scope:** Infrastructure & Authentication  
**Validates:**
- Driver can establish connection to Neo4j server
- Authentication credentials are correct
- Server address is reachable at `localhost:7687`

**What it tests:**
```typescript
driver.getServerInfo()
```

**Why it matters:**  
Ensures the basic network connection and authentication layer is functional before attempting any queries.

---

#### ✓ should verify database is accessible
**Scope:** Connection Health Check  
**Validates:**
- Database server is responding
- No connectivity issues exist
- Driver can verify the connection is alive

**What it tests:**
```typescript
driver.verifyConnectivity()
```

**Why it matters:**  
Confirms the database is not just reachable, but also in a healthy state to accept requests.

---

### 2. Query Execution

#### ✓ should execute a simple query
**Scope:** Basic Query Functionality  
**Validates:**
- Session can execute Cypher queries
- Results can be retrieved and parsed
- Return values match expected types

**What it tests:**
```cypher
RETURN 1 AS number
```

**Why it matters:**  
Validates the fundamental query execution pipeline works, which is essential for all database operations.

---

#### ✓ should handle query with parameters
**Scope:** Parameterized Queries  
**Validates:**
- Parameters can be passed to queries safely
- Parameter substitution works correctly
- Different data types (string, number) are handled properly

**What it tests:**
```cypher
RETURN $name AS name, $age AS age
```

**Why it matters:**  
Parameterized queries are critical for security (SQL injection prevention) and dynamic query construction.

---

### 3. Database Introspection

#### ✓ should retrieve database version
**Scope:** System Information & Metadata  
**Validates:**
- System procedures are accessible
- Database metadata can be queried
- Neo4j Kernel information is available

**What it tests:**
```cypher
CALL dbms.components() YIELD name, versions, edition
```

**Why it matters:**  
Ensures system-level queries work, which is important for debugging, monitoring, and version-specific feature detection.

---

#### ✓ should count nodes in database
**Scope:** Graph Data Operations  
**Validates:**
- Pattern matching works
- Aggregate functions execute correctly
- Graph traversal capabilities are functional

**What it tests:**
```cypher
MATCH (n) RETURN count(n) AS nodeCount
```

**Why it matters:**  
Tests the core graph database functionality - pattern matching and aggregation - which forms the basis of all graph queries.

---

## PostgreSQL Tests (7 tests)

### 1. Connection & Authentication

#### ✓ should successfully connect to PostgreSQL
**Scope:** Infrastructure & Connection Pooling  
**Validates:**
- Connection pool can acquire client connections
- Database server is reachable at `localhost:5432`
- Authentication is successful
- Server timestamp queries work

**What it tests:**
```sql
SELECT NOW()
```

**Why it matters:**  
Validates the connection pooling mechanism and basic server accessibility.

---

### 2. System Information

#### ✓ should verify database version
**Scope:** Database Metadata  
**Validates:**
- System functions are accessible
- PostgreSQL version information can be retrieved
- Server is running PostgreSQL (not another database)

**What it tests:**
```sql
SELECT version()
```

**Why it matters:**  
Confirms you're connected to the correct database type and can help identify version-specific issues.

---

#### ✓ should retrieve current database name
**Scope:** Connection Context  
**Validates:**
- Connected to the correct database (`identity_service`)
- Connection context is properly set
- Database selection works as expected

**What it tests:**
```sql
SELECT current_database()
```

**Why it matters:**  
Ensures tests and application code are connected to the intended database, preventing accidental operations on wrong databases.

---

### 3. Query Execution

#### ✓ should execute a simple query
**Scope:** Basic Query Functionality  
**Validates:**
- SQL queries can be executed
- Mathematical operations work
- Results are returned correctly

**What it tests:**
```sql
SELECT 1 + 1 AS result
```

**Why it matters:**  
Validates fundamental query execution, which is the foundation for all database operations.

---

#### ✓ should handle parameterized queries
**Scope:** Prepared Statements & Security  
**Validates:**
- Parameterized queries work correctly
- Type casting is functional
- Multiple parameters can be passed
- Different data types (text, integer) are handled

**What it tests:**
```sql
SELECT $1::text AS name, $2::int AS age
```

**Why it matters:**  
Parameterized queries are essential for security (SQL injection prevention) and performance (query plan caching).

---

### 4. Schema Introspection

#### ✓ should list tables in database
**Scope:** Schema Metadata & Information Schema  
**Validates:**
- `information_schema` is accessible
- Table metadata can be queried
- Schema introspection works

**What it tests:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
```

**Why it matters:**  
Schema introspection is critical for migrations, documentation generation, and understanding database structure.

---

### 5. Connection Pool Management

#### ✓ should verify connection pool size
**Scope:** Resource Management  
**Validates:**
- Connection pool is properly initialized
- Pool statistics are available
- Total, idle, and waiting connection counts are tracked

**What it tests:**
```typescript
pool.totalCount
pool.idleCount
pool.waitingCount
```

**Why it matters:**  
Connection pooling is crucial for application performance and resource efficiency. This validates the pool is working correctly.

---

## Test Categories by Concern

### Security & Authentication
- Neo4j connection with credentials
- PostgreSQL connection with credentials
- Parameterized queries (both databases)

### Network & Infrastructure
- TCP connection to Neo4j (port 7687)
- TCP connection to PostgreSQL (port 5432)
- Connection health verification

### Query Capabilities
- Simple query execution (both databases)
- Parameterized queries (both databases)
- Aggregate functions (Neo4j count)
- Mathematical operations (PostgreSQL)

### Metadata & Introspection
- Database version retrieval (both databases)
- System information queries (both databases)
- Schema introspection (PostgreSQL tables)
- Graph data counting (Neo4j nodes)

### Performance & Resources
- Connection pooling (PostgreSQL)
- Session management (Neo4j)

---

## Environment Configuration

All tests respect environment variables for configuration:

### Neo4j Environment Variables
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=injury-surveillance-dev-password
NEO4J_DATABASE=neo4j
```

### PostgreSQL Environment Variables
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=identity_service
POSTGRES_USER=identity_admin
POSTGRES_PASSWORD=identity-service-dev-password
```

---

## Coverage Summary

| Database   | Tests | Pass Rate | Coverage Areas                                    |
|------------|-------|-----------|---------------------------------------------------|
| Neo4j      | 6     | 100%      | Connection, Queries, Parameters, Graph Operations |
| PostgreSQL | 7     | 100%      | Connection, Queries, Parameters, Schema, Pool     |
| **Total**  | **13**| **100%**  | **All Critical Connection Points**                |

---

## Running Tests

```bash
# Run all tests
npm test

# Run only database tests
npm run test:databases

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Next Steps for Test Expansion

### Short Term
- Add transaction tests (commit/rollback)
- Add concurrent connection tests
- Add timeout and retry logic tests

### Medium Term
- Add schema validation tests
- Add data integrity tests
- Add migration tests

### Long Term
- Add performance benchmarks
- Add stress tests (connection limits)
- Add failover and recovery tests

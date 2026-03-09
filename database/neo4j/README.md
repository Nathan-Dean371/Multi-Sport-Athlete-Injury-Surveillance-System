# Neo4j Cypher Scripts

This directory contains Cypher migration and data scripts for the Multi-Sport Athlete Injury Surveillance System Neo4j graph database.

## 📋 Naming Conventions

Files follow a numeric prefix convention for ordered execution:

- **001-099**: Schema migrations (constraints, indexes, schema changes)
- **010-099**: Sample/seed data scripts
- **900-999**: Utility/verification scripts

Format: `###-descriptive-name.cypher`

## 🗂️ File Inventory

### Schema Scripts (001-099)

| File                                        | Purpose                                                     | Idempotent | Environment | Browser Compatible      |
| ------------------------------------------- | ----------------------------------------------------------- | ---------- | ----------- | ----------------------- |
| `001-schema-setup.cypher`                   | Core schema: constraints, indexes for all node types        | ✅ Yes     | All         | ❌ Use -browser version |
| `001-schema-setup-browser.cypher`           | **Neo4j Browser version** of core schema                    | ✅ Yes     | All         | ✅ Yes                  |
| `002-neo4j-aura-schema.cypher`              | Neo4j Aura-specific schema (cloud optimized)                | ✅ Yes     | Aura only   | ✅ Yes                  |
| `003-init-test-db.cypher`                   | Test database initialization (DESTRUCTIVE: clears all data) | ✅ Yes     | Test only   | ❌ No                   |
| `004-add-parent-session-constraints.cypher` | Additional constraints for Parent & Session nodes           | ✅ Yes     | All         | ✅ Yes                  |

### Sample Data Scripts (010-099) - ⚠️ DEV/TEST ONLY

| File                                  | Purpose                                                           | Idempotent | Environment | Browser Compatible |
| ------------------------------------- | ----------------------------------------------------------------- | ---------- | ----------- | ------------------ |
| `010-sample-data.cypher`              | Comprehensive sample data: sports, orgs, teams, players, injuries | ⚠️ Partial | Dev         | ❌ No              |
| `011-add-sample-data.cypher`          | Links injuries to players, adds training sessions, status updates | ⚠️ Partial | Dev         | ❌ No              |
| `012-link-and-add-data.cypher`        | Additional sample injuries and relationships (uses MERGE)         | ✅ Yes     | Dev         | ❌ No              |
| `013-add-senior-team-injuries.cypher` | Sample injuries for senior team players                           | ⚠️ Partial | Dev         | ❌ No              |
| `020-aura-sample-data-part1.cypher`   | Aura sample data: core entities and relationships                 | ⚠️ No      | Aura Dev    | ✅ Yes             |
| `021-aura-sample-data-part2.cypher`   | Aura sample data: relationships, sessions, injuries               | ⚠️ No      | Aura Dev    | ✅ Yes             |

### Utility Scripts (900-999)

| File                         | Purpose                                                         | Idempotent | Environment |
| ---------------------------- | --------------------------------------------------------------- | ---------- | ----------- |
| `900-verify-database.cypher` | Database health checks, schema verification, data quality tests | ✅ Yes     | All         |

## 🚀 Quick Start

### Local Docker Setup

```powershell
# Start Neo4j container
docker compose up -d neo4j

# Initialize schema
Get-Content database\neo4j\001-schema-setup.cypher | `
  docker exec -i injury-surveillance-neo4j cypher-shell `
  -u neo4j -p injury-surveillance-password -d neo4j

# Load sample data (for development)
Get-Content database\neo4j\010-sample-data.cypher | `
  docker exec -i injury-surveillance-neo4j cypher-shell `
  -u neo4j -p injury-surveillance-password -d neo4j

# Verify setup
Get-Content database\neo4j\900-verify-database.cypher | `
  docker exec -i injury-surveillance-neo4j cypher-shell `
  -u neo4j -p injury-surveillance-password -d neo4j
```

### Test Database Setup

```powershell
# Initialize test database (DESTRUCTIVE - clears all data)
Get-Content database\neo4j\003-init-test-db.cypher | `
  docker exec -i injury-surveillance-neo4j-test cypher-shell `
  -u neo4j -p injury-surveillance-test-password -d neo4j
```

### Neo4j Aura (Cloud) Setup

1. **Create Aura instance** at https://console.neo4j.io
2. **Copy connection URI and credentials**
3. **Run schema setup** (choose one method):

   **Via Aura Browser UI:**
   - Open Query tab in Aura Console
   - Copy/paste contents of `002-neo4j-aura-schema.cypher`
   - Execute

   **Via cypher-shell:**

   ```bash
   cat 002-neo4j-aura-schema.cypher | cypher-shell -a <aura-uri> -u neo4j -p <password>
   ```

4. **Load sample data** (optional, for development):

   **Via Aura Browser UI:**
   - Copy/paste `020-aura-sample-data-part1.cypher` into Query tab and execute
   - Copy/paste `021-aura-sample-data-part2.cypher` into Query tab and execute

   **Via cypher-shell:**

   ```bash
   cat 020-aura-sample-data-part1.cypher | cypher-shell -a <aura-uri> -u neo4j -p <password>
   cat 021-aura-sample-data-part2.cypher | cypher-shell -a <aura-uri> -u neo4j -p <password>
   ```

## 🌐 Neo4j Browser (Production) Setup

**For production databases accessed via Neo4j Browser web UI**, use these browser-compatible files:

### Step 1: Connect to Neo4j Browser

- **Local/Docker**: http://localhost:7474
- **Aura**: https://console.neo4j.io → Select your instance → "Open with Browser"

### Step 2: Run Schema Setup

**For Local/Docker Neo4j:**

1. Open [001-schema-setup-browser.cypher](database/neo4j/001-schema-setup-browser.cypher)
2. Copy entire file contents
3. Paste into Neo4j Browser query window
4. Click **Run** (▶ play button)
5. Wait for "Schema setup complete!" message

**For Neo4j Aura:**

1. Open [002-neo4j-aura-schema.cypher](database/neo4j/002-neo4j-aura-schema.cypher)
2. Copy entire file contents
3. Paste into Aura query window
4. Click **Run**

### Step 3: Add Parent/Session Constraints

1. Open [004-add-parent-session-constraints.cypher](database/neo4j/004-add-parent-session-constraints.cypher)
2. Copy and paste into Browser
3. Click **Run**

### Step 4: Verify Schema

Run these verification queries in Browser:

```cypher
SHOW CONSTRAINTS;
SHOW INDEXES;
```

Expected results:

- 12+ unique constraints
- 18+ indexes (all state: "ONLINE")

### ⚠️ Important Notes

**Neo4j Browser does NOT support:**

- `:begin` and `:commit` commands (causes "Multistatement.InvalidCommandError")
- Multi-statement scripts with transaction control

**Always use browser-compatible versions:**

- ✅ `001-schema-setup-browser.cypher` (not `-001-schema-setup.cypher`)
- ✅ `002-neo4j-aura-schema.cypher` (already compatible)
- ✅ `004-add-parent-session-constraints.cypher` (already compatible)
- ✅ `900-verify-database.cypher` (run sections individually)

**Never run in production:**

- ❌ Any file starting with `010-021` (sample data - dev/test only)
- ❌ `003-init-test-db.cypher` (DESTRUCTIVE - deletes all data)

## 📝 Script Writing Guidelines

### Header Template

Every Cypher script should start with:

```cypher
// ============================================================================
// <SCRIPT TITLE>
// ============================================================================
// Purpose:     <Brief description>
// Created:     <Date>
// Idempotent:  <Yes/No/Partial - explain>
// Environment: <Dev/Test/Prod/All/Aura>
// Dependencies: <List prerequisite scripts>
// ============================================================================
```

### Idempotency Rules

- **Always use** `IF NOT EXISTS` for constraints and indexes
- **Prefer** `MERGE` over `CREATE` for entities that should be unique
- **Use** `:begin` and `:commit` for transaction control
- **Avoid** `MATCH (n) DETACH DELETE n` in production scripts
- **Test** scripts multiple times to ensure safe re-runs

### Transaction Patterns

```cypher
// Good: Atomic transaction blocks
:begin;
CREATE (n:Node {id: 'unique-id', prop: 'value'});
:commit;

// Better: Idempotent with MERGE
:begin;
MERGE (n:Node {id: 'unique-id'})
ON CREATE SET n.prop = 'value', n.createdAt = datetime()
ON MATCH SET n.updatedAt = datetime();
:commit;
```

## 🔍 Verification & Debugging

### Check Constraints

```cypher
SHOW CONSTRAINTS;
```

Expected: 12 UNIQUE constraints for all core entities.

### Check Indexes

```cypher
SHOW INDEXES;
```

Expected: 18+ indexes, all showing `state: "ONLINE"`.

### Verify Data Integrity

Run the comprehensive verification script:

```powershell
Get-Content database\neo4j\900-verify-database.cypher | `
  docker exec -i injury-surveillance-neo4j cypher-shell `
  -u neo4j -p injury-surveillance-password -d neo4j
```

### Common Issues

| Issue                     | Solution                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:begin` error in Browser | **Multistatement.InvalidCommandError** - Use browser-compatible files: `001-schema-setup-browser.cypher`, `002-neo4j-aura-schema.cypher`, `004-add-parent-session-constraints.cypher` |
| Constraint creation fails | Delete duplicate nodes first: `MATCH (n:NodeType) WITH n.id as id, collect(n) as nodes WHERE size(nodes) > 1 FOREACH (n IN tail(nodes) \| DETACH DELETE n)`                           |
| Index not online          | Wait 10-30 seconds, check with `SHOW INDEXES`. If stuck, drop and recreate.                                                                                                           |
| Sample data duplicates    | Clear test data: use `003-init-test-db.cypher` or manually delete with `MATCH (n) DETACH DELETE n`                                                                                    |
| Connection refused        | Verify Neo4j container running: `docker ps`, check logs: `docker logs injury-surveillance-neo4j`                                                                                      |

## 🔒 Production Deployment Checklist

Before updating production Neo4j database via browser:

**Pre-Deployment:**

- [ ] **Backup database** - Neo4j Aura: create snapshot; Self-hosted: `neo4j-admin dump`
- [ ] **Test in staging** - Run scripts on copy of production data first
- [ ] **Document current state** - Run `SHOW CONSTRAINTS; SHOW INDEXES;` and save results
- [ ] **Schedule maintenance window** - Schema changes can briefly lock database

**Deployment (in Neo4j Browser):**

1. [ ] Run [001-schema-setup-browser.cypher](database/neo4j/001-schema-setup-browser.cypher) OR [002-neo4j-aura-schema.cypher](database/neo4j/002-neo4j-aura-schema.cypher) (Aura)
2. [ ] Run [004-add-parent-session-constraints.cypher](database/neo4j/004-add-parent-session-constraints.cypher)
3. [ ] Verify: `SHOW CONSTRAINTS;` → expect 13+ constraints
4. [ ] Verify: `SHOW INDEXES;` → expect 20+ indexes, all "ONLINE"

**Post-Deployment:**

- [ ] **Run verification queries** - Key sections from [900-verify-database.cypher](database/neo4j/900-verify-database.cypher)
- [ ] **Monitor performance** - Check query execution times
- [ ] **Test application** - Verify backend can query Neo4j successfully
- [ ] **Document changes** - Note what was deployed and when

**Never in Production:**

- ❌ Files `010-021` (sample data)
- ❌ File `003-init-test-db.cypher` (DESTRUCTIVE)

## 🔗 Related Documentation

- [Neo4j Setup Guide](../../docs/setup/neo4j-setup.md)
- [Database Architecture](../../docs/architecture/database-design.md)
- [ADR-0002: Neo4j Graph Database](../../docs/decisions/adr-0002-neo4j-graph-database.md)
- [ADR-0003: Two-Database Privacy Architecture](../../docs/decisions/adr-0003-two-database-privacy-architecture.md)

## ⚠️ Safety Notes

- **NEVER** run `003-init-test-db.cypher` against production (DESTRUCTIVE)
- **NEVER** run sample data files (`010-021`) in production
- **ALWAYS** use browser-compatible files when using Neo4j Browser web UI
- **ALWAYS** backup before schema changes in production
- **TEST** new scripts in development environment first
- **REVIEW** transaction sizes (split into smaller batches for large datasets)
- **VERIFY** idempotency by running scripts 2-3 times in test environment

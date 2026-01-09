# Quick Start Guide - Local Neo4j Setup

**Multi-Sport Athlete Injury Surveillance System**

This guide will get your local development environment up and running in ~15 minutes.

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org/))
- [ ] **npm or yarn** package manager
- [ ] **Docker & Docker Compose** (recommended) OR **Neo4j Desktop** installed
- [ ] **Git** for version control
- [ ] A code editor (VS Code recommended)

---

## Option A: Quick Start with Docker (Recommended)

### Step 1: Start the Databases

```bash
# Start Neo4j and PostgreSQL
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                              STATUS
# injury-surveillance-neo4j         Up (healthy)
# injury-surveillance-postgres      Up (healthy)
# injury-surveillance-pgadmin       Up
```

### Step 2: Initialize Neo4j Schema

```bash
# Create constraints and indexes
docker exec -i injury-surveillance-neo4j \
  cypher-shell -u neo4j -p injury-surveillance-dev-password \
  < schema-setup.cypher

# Expected output: "Schema setup complete!"
```

### Step 3: Load Sample Data (Optional)

```bash
# Add test data
docker exec -i injury-surveillance-neo4j \
  cypher-shell -u neo4j -p injury-surveillance-dev-password \
  < sample-data.cypher

# Expected output: "Sample data creation complete!"
```

### Step 4: Verify Setup

```bash
# Install neo4j-driver if not already installed
npm install neo4j-driver

# Run connection test
node test-neo4j-connection.js

# Expected output: "All tests passed!"
```

### Step 5: Access Neo4j Browser

1. Open browser: http://localhost:7474
2. Login:
   - **Username:** `neo4j`
   - **Password:** `injury-surveillance-dev-password`
3. Try a query:
   ```cypher
   MATCH (n) RETURN labels(n) AS Type, count(*) AS Count
   ```

---

## Option B: Neo4j Desktop Setup

### Step 1: Install and Configure

1. **Download Neo4j Desktop** from https://neo4j.com/download/
2. **Install and launch** Neo4j Desktop
3. **Create a new project:**
   - Name: "Multi-Sport Injury Surveillance"
4. **Create a new database:**
   - Click "Add" → "Local DBMS"
   - Name: `injury-surveillance-dev`
   - Password: Choose a strong password (save this!)
   - Version: Latest 5.x
   - Click "Create"
5. **Install APOC plugin:**
   - Select your database
   - Click "Plugins" tab
   - Install "APOC"
6. **Start the database:**
   - Click "Start"
   - Wait for status to show "Active"

### Step 2: Initialize Schema

1. **Open Neo4j Browser:**
   - Click "Open" → "Neo4j Browser"
   - Login: `neo4j` / (your password)

2. **Run schema setup:**
   - Copy contents of `schema-setup.cypher`
   - Paste into Neo4j Browser
   - Click "Play" or press Ctrl+Enter

3. **Verify constraints:**
   ```cypher
   SHOW CONSTRAINTS;
   ```
   - Should show 12 constraints

### Step 3: Load Sample Data

1. **In Neo4j Browser:**
   - Copy contents of `sample-data.cypher`
   - Paste and run
   - Wait for completion message

### Step 4: Test Connection

Update connection details in test script:

```javascript
// In test-neo4j-connection.js, update:
password: 'your-actual-password-here'
```

Run:
```bash
npm install neo4j-driver
node test-neo4j-connection.js
```

---

## Database Connection Details

### For Backend Development (.env file)

Create a `.env` file in your backend directory:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your details
```

**Docker setup:**
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=injury-surveillance-dev-password
NEO4J_DATABASE=neo4j

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=identity_service
POSTGRES_USER=identity_admin
POSTGRES_PASSWORD=identity-service-dev-password
```

**Neo4j Desktop setup:**
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-chosen-password
NEO4J_DATABASE=neo4j
```

---

## Verify Your Setup

### 1. Check Neo4j is Running

```bash
# Docker
docker ps | grep neo4j

# Neo4j Desktop
# Check Desktop UI shows "Active"
```

### 2. Verify Schema

Run in Neo4j Browser:

```cypher
// Should return 12
SHOW CONSTRAINTS YIELD * RETURN count(*);

// Should return 18+
SHOW INDEXES YIELD * WHERE type <> 'LOOKUP' RETURN count(*);
```

### 3. Check Sample Data

```cypher
// Should show all node types with counts
MATCH (n) 
RETURN labels(n)[0] AS Type, count(*) AS Count 
ORDER BY Count DESC;
```

### 4. Test a Complex Query

```cypher
// Should return team structure
MATCH (t:Team)-[:BELONGS_TO]->(o:Organization)
MATCH (t)-[:PLAYS]->(s:Sport)
RETURN t.name, o.name, s.name;
```

---

## Troubleshooting

### "Connection refused" error

**Problem:** Can't connect to Neo4j

**Solutions:**
1. Verify Neo4j is running:
   ```bash
   docker ps  # or check Neo4j Desktop
   ```
2. Check port 7687 is accessible:
   ```bash
   telnet localhost 7687
   ```
3. Verify firewall isn't blocking

### "Authentication failed" error

**Problem:** Wrong credentials

**Solutions:**
1. Double-check password
2. For Docker: password is `injury-surveillance-dev-password`
3. For Neo4j Desktop: use the password you set
4. First-time users: default is `neo4j/neo4j` (will prompt to change)

### "Database not found" error

**Problem:** Database name is incorrect

**Solution:**
- Use `neo4j` as the database name (default)
- Or create a new database in Neo4j Browser:
  ```cypher
  CREATE DATABASE mydb;
  ```

### Slow Queries

**Problem:** Queries taking too long

**Solutions:**
1. Verify indexes are created:
   ```cypher
   SHOW INDEXES;
   ```
2. Check query plan:
   ```cypher
   PROFILE MATCH (p:Player {playerId: 'PLAYER-001'}) RETURN p;
   ```
   - Look for "Index Seek" in plan
3. Ensure constraints are in place

---

## Next Steps

Now that your database is set up:

### 1. Explore Your Data

Open Neo4j Browser and try these queries:

```cypher
// View team structure
MATCH path = (t:Team {teamId: 'TEAM-GU-U21-001'})-[*1..2]-()
RETURN path LIMIT 50;

// Check current injuries
MATCH (p:Player)-[:SUSTAINED]->(i:Injury)
WHERE i.status IN ['Recovering', 'Under Assessment']
RETURN p.pseudonymId, i.injuryType, i.severity, i.injuryDate;

// View injury recovery timeline
MATCH (i:Injury {injuryId: 'INJ-2025-001'})-[:HAS_UPDATE]->(s:StatusUpdate)
RETURN i.injuryType, s.updateDate, s.painLevel, s.functionalStatus
ORDER BY s.updateDate;
```

### 2. Set Up Your Backend

Move to your backend setup:
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Install dependencies: `npm install`
- [ ] Create Neo4j service module
- [ ] Create basic API endpoints
- [ ] Test database connectivity

### 3. Learn Cypher

Resources:
- Neo4j Browser built-in guide: `:play start`
- Cypher Manual: https://neo4j.com/docs/cypher-manual/
- APOC Documentation: https://neo4j.com/labs/apoc/

### 4. Set Up the Identity Service

Initialize PostgreSQL schema for PII storage:
- Create tables for user identity mapping
- Set up encryption for sensitive data
- Configure backup procedures

---

## Daily Development Workflow

### Starting Your Day

**Docker:**
```bash
docker-compose up -d
# Verify: docker-compose ps
```

**Neo4j Desktop:**
- Open Desktop
- Click "Start" on your database

### Ending Your Day

**Docker:**
```bash
docker-compose stop
```

**Neo4j Desktop:**
- Click "Stop" on your database

### Resetting Data (Fresh Start)

**Docker:**
```bash
# Stop and remove volumes (DELETES ALL DATA!)
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-run setup scripts
docker exec -i injury-surveillance-neo4j \
  cypher-shell -u neo4j -p injury-surveillance-dev-password \
  < schema-setup.cypher

docker exec -i injury-surveillance-neo4j \
  cypher-shell -u neo4j -p injury-surveillance-dev-password \
  < sample-data.cypher
```

**Neo4j Desktop:**
```cypher
// In Neo4j Browser - DELETES ALL DATA!
MATCH (n) DETACH DELETE n;

// Re-run schema-setup.cypher and sample-data.cypher
```

---

## Useful Resources

### Files Created

- ✅ `neo4j-setup-guide.md` - Comprehensive setup instructions
- ✅ `schema-setup.cypher` - Database schema creation script
- ✅ `sample-data.cypher` - Sample data for testing
- ✅ `verify-database.cypher` - Verification queries
- ✅ `test-neo4j-connection.js` - Node.js connection test
- ✅ `docker-compose.yml` - Docker configuration
- ✅ `.env.example` - Environment variables template
- ✅ `QUICK_START.md` - This guide!

### Documentation Links

- **Your Project Docs:** https://github.com/Nathan-Dean371/FYP-Documentation-Repo
- **Interactive Schema:** https://nathan-dean371.github.io/FYP-Documentation-Repo/Html%20Docs/Neo4j-Schema-Interactive.html
- **Neo4j Docs:** https://neo4j.com/docs/
- **Cypher Reference:** https://neo4j.com/docs/cypher-manual/current/

---

## Success Checklist

Before moving to backend development, verify:

- [ ] Neo4j is running and accessible
- [ ] Can connect via Neo4j Browser (http://localhost:7474)
- [ ] All 12 constraints are created
- [ ] All 18+ indexes are created and ONLINE
- [ ] Sample data is loaded (optional)
- [ ] `test-neo4j-connection.js` passes all tests
- [ ] `.env` file is configured with correct credentials
- [ ] Can run Cypher queries successfully
- [ ] PostgreSQL is running (if using Docker)
- [ ] Can access pgAdmin (http://localhost:5050)

---

## Getting Help

If you encounter issues:

1. **Check logs:**
   ```bash
   docker-compose logs -f neo4j
   ```

2. **Run verification script:**
   ```bash
   node test-neo4j-connection.js
   ```

3. **Review setup guide:**
   - See `neo4j-setup-guide.md` for detailed instructions

4. **Common fixes:**
   - Restart database
   - Check credentials
   - Verify ports aren't in use
   - Ensure Docker has sufficient resources

---

**🎉 Congratulations!** Your Neo4j database is ready for development.

Next: Start building your NestJS backend services!

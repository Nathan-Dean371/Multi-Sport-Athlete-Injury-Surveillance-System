# Neo4j Setup Guide for Multi-Sport Athlete Injury Surveillance System

This guide will walk you through setting up Neo4j for your FYP project, from installation to schema creation.

## Table of Contents
1. [Installation Options](#installation-options)
2. [Initial Configuration](#initial-configuration)
3. [Database Schema Setup](#database-schema-setup)
4. [Verification](#verification)
5. [Next Steps](#next-steps)

---

## Installation Options

### Option 1: Neo4j Desktop (Recommended for Development)

**Best for:** Local development with GUI access

1. **Download Neo4j Desktop**
   - Visit: https://neo4j.com/download/
   - Select "Neo4j Desktop" (free)
   - Download for your operating system

2. **Install and Launch**
   - Run the installer
   - Launch Neo4j Desktop
   - Create an account or sign in

3. **Create a New Project**
   - Click "New Project"
   - Name it: "Multi-Sport Injury Surveillance"

4. **Create a Database**
   - Click "Add" → "Local DBMS"
   - Name: `injury-surveillance-dev`
   - Password: Choose a strong password (save this!)
   - Version: Select latest 5.x version
   - Click "Create"

5. **Start the Database**
   - Click "Start" on your database
   - Wait for it to show "Active"

6. **Open Neo4j Browser**
   - Click "Open" → "Neo4j Browser"
   - Login with username: `neo4j`, password: (your password)

**Connection Details:**
- Bolt URL: `bolt://localhost:7687`
- HTTP URL: `http://localhost:7474`
- Username: `neo4j`
- Password: (your chosen password)

---

### Option 2: Docker (Good for Consistency)

**Best for:** Consistent environment, CI/CD integration

1. **Pull Neo4j Image**
   ```bash
   docker pull neo4j:5.26-community
   ```

2. **Run Container**
   ```bash
   docker run \
     --name injury-surveillance-neo4j \
     -p 7474:7474 -p 7687:7687 \
     -d \
     -v $HOME/neo4j/data:/data \
     -v $HOME/neo4j/logs:/logs \
     -v $HOME/neo4j/import:/var/lib/neo4j/import \
     -v $HOME/neo4j/plugins:/plugins \
     --env NEO4J_AUTH=neo4j/your-password-here \
     --env NEO4J_PLUGINS='["apoc"]' \
     neo4j:5.26-community
   ```

   **Replace `your-password-here` with a strong password!**

3. **Verify Running**
   ```bash
   docker ps | grep injury-surveillance-neo4j
   docker logs injury-surveillance-neo4j
   ```

4. **Access Neo4j Browser**
   - Open: http://localhost:7474
   - Login: `neo4j` / `your-password-here`

**Docker Commands:**
```bash
# Stop database
docker stop injury-surveillance-neo4j

# Start database
docker start injury-surveillance-neo4j

# Remove container (data persists in volumes)
docker rm injury-surveillance-neo4j

# View logs
docker logs -f injury-surveillance-neo4j
```

---

### Option 3: Cloud - Neo4j Aura Free Tier

**Best for:** Remote access, team collaboration

1. **Create Account**
   - Visit: https://neo4j.com/cloud/aura-free/
   - Sign up for free tier

2. **Create Instance**
   - Click "Create Instance"
   - Name: `injury-surveillance`
   - Region: Choose closest to you
   - Click "Create"

3. **Save Credentials**
   - **IMPORTANT:** Download the credentials file immediately
   - Save the connection URI and password securely

4. **Connect**
   - Use the provided connection URI (starts with `neo4j+s://`)
   - Username: `neo4j`
   - Password: (from credentials file)

---

## Initial Configuration

### 1. Test Connection

In Neo4j Browser, run:
```cypher
RETURN "Hello from Neo4j!" AS message;
```

You should see a result table with your message.

### 2. Enable APOC (if not already enabled)

APOC provides additional procedures for Neo4j.

**For Neo4j Desktop:**
- In Desktop, select your database
- Click on "Plugins" tab
- Install "APOC"
- Restart database

**For Docker:**
Already configured in the docker run command above with `--env NEO4J_PLUGINS='["apoc"]'`

**Verify APOC:**
```cypher
RETURN apoc.version() AS version;
```

### 3. Configure Memory Settings (Optional but Recommended)

**For Neo4j Desktop:**
- Select your database
- Click "..." → "Settings"
- Add/modify:
  ```
  dbms.memory.heap.initial_size=512m
  dbms.memory.heap.max_size=2G
  dbms.memory.pagecache.size=512m
  ```
- Click "Apply"
- Restart database

---

## Database Schema Setup

Now let's create your injury surveillance database schema!

### Step 1: Create Constraints and Indexes

Run the `schema-setup.cypher` script (see separate file) or execute these commands in Neo4j Browser:

```cypher
// Unique Constraints
CREATE CONSTRAINT player_id_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.playerId IS UNIQUE;

CREATE CONSTRAINT injury_id_unique IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryId IS UNIQUE;

CREATE CONSTRAINT team_id_unique IF NOT EXISTS
FOR (t:Team) REQUIRE t.teamId IS UNIQUE;

CREATE CONSTRAINT sport_id_unique IF NOT EXISTS
FOR (s:Sport) REQUIRE s.sportId IS UNIQUE;

CREATE CONSTRAINT org_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.orgId IS UNIQUE;

CREATE CONSTRAINT coach_id_unique IF NOT EXISTS
FOR (c:Coach) REQUIRE c.coachId IS UNIQUE;

CREATE CONSTRAINT admin_id_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.adminId IS UNIQUE;

CREATE CONSTRAINT role_name_unique IF NOT EXISTS
FOR (r:Role) REQUIRE r.name IS UNIQUE;

CREATE CONSTRAINT session_id_unique IF NOT EXISTS
FOR (s:Session) REQUIRE s.sessionId IS UNIQUE;

CREATE CONSTRAINT status_id_unique IF NOT EXISTS
FOR (su:StatusUpdate) REQUIRE su.statusUpdateId IS UNIQUE;

CREATE CONSTRAINT audit_id_unique IF NOT EXISTS
FOR (al:AuditLog) REQUIRE al.auditId IS UNIQUE;

// Performance Indexes
CREATE INDEX player_active_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive);

CREATE INDEX injury_date_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryDate);

CREATE INDEX injury_status_idx IF NOT EXISTS
FOR (i:Injury) ON (i.status);

CREATE INDEX session_date_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate);

CREATE INDEX audit_timestamp_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.timestamp);

CREATE INDEX audit_action_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.action);
```

### Step 2: Verify Constraints and Indexes

```cypher
// Show all constraints
SHOW CONSTRAINTS;

// Show all indexes
SHOW INDEXES;
```

### Step 3: Create Sample Data (Optional)

Run the `sample-data.cypher` script or see the separate file for comprehensive test data.

Here's a minimal example to verify everything works:

```cypher
// Create a test sport
CREATE (s:Sport {
  sportId: 'SPORT-TEST-001',
  name: 'Soccer',
  category: 'Team Sport',
  riskLevel: 'Medium',
  createdAt: datetime(),
  updatedAt: datetime()
});

// Create a test organization
CREATE (o:Organization {
  orgId: 'ORG-TEST-001',
  name: 'Test Football Club',
  type: 'Club',
  region: 'Leinster',
  createdAt: datetime(),
  updatedAt: datetime()
});

// Create a test team
CREATE (t:Team {
  teamId: 'TEAM-TEST-001',
  name: 'U21 Development Squad',
  ageGroup: 'U21',
  competitionLevel: 'Development',
  season: '2025',
  isActive: true,
  createdAt: datetime(),
  updatedAt: datetime()
});

// Create relationships
MATCH (t:Team {teamId: 'TEAM-TEST-001'})
MATCH (o:Organization {orgId: 'ORG-TEST-001'})
MATCH (s:Sport {sportId: 'SPORT-TEST-001'})
CREATE (t)-[:BELONGS_TO]->(o)
CREATE (t)-[:PLAYS]->(s);

// Verify
MATCH (t:Team)-[:BELONGS_TO]->(o:Organization)
MATCH (t)-[:PLAYS]->(s:Sport)
RETURN t.name, o.name, s.name;
```

---

## Verification

### 1. Check Database is Accessible

```cypher
CALL dbms.components() YIELD name, versions, edition
RETURN name, versions[0] AS version, edition;
```

### 2. Verify Schema

```cypher
// Count constraints
SHOW CONSTRAINTS YIELD *
RETURN count(*) AS totalConstraints;

// Should return 12 constraints

// Count indexes
SHOW INDEXES YIELD *
WHERE type <> "LOOKUP"
RETURN count(*) AS totalIndexes;

// Should return at least 6 indexes
```

### 3. Test Query Performance

```cypher
// Create sample data and test query
PROFILE MATCH (t:Team {teamId: 'TEAM-TEST-001'})
RETURN t;
```

Look for "Index Seek" in the query plan - this confirms indexes are working.

---

## Connection String for Backend

Once your database is running, you'll need these details for your NestJS backend:

### Environment Variables Template

Create a `.env` file in your backend directory:

```env
# Neo4j Connection
NEO4J_SCHEME=bolt
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password-here
NEO4J_DATABASE=neo4j

# For Aura (cloud)
# NEO4J_SCHEME=neo4j+s
# NEO4J_HOST=your-instance-id.databases.neo4j.io
# NEO4J_PORT=7687
```

### Test Connection from Node.js

Create a quick test file `test-connection.js`:

```javascript
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'your-password-here')
);

async function testConnection() {
  const session = driver.session();
  try {
    const result = await session.run(
      'RETURN "Connection successful!" AS message'
    );
    console.log(result.records[0].get('message'));
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await session.close();
  }
  await driver.close();
}

testConnection();
```

Run:
```bash
npm install neo4j-driver
node test-connection.js
```

---

## Troubleshooting

### "Connection refused" error
- Verify database is running (check Neo4j Desktop or `docker ps`)
- Check firewall isn't blocking ports 7474/7687
- Verify connection URI is correct

### "Authentication failed" error
- Double-check username (should be `neo4j`)
- Verify password is correct
- For new installations, default is `neo4j/neo4j` (will prompt for change)

### Slow queries
- Verify indexes are created: `SHOW INDEXES`
- Use `PROFILE` or `EXPLAIN` before queries to check query plan
- Ensure constraints are in place

### Can't see Neo4j Browser
- Check http://localhost:7474 is accessible
- For Docker: ensure port 7474 is mapped correctly
- For Desktop: click "Open" button next to database

---

## Next Steps

1. ✅ Neo4j installed and running
2. ✅ Schema created with constraints and indexes
3. ✅ Sample data loaded (optional)
4. ⬜ Configure backend connection
5. ⬜ Implement NestJS Neo4j service
6. ⬜ Create API endpoints
7. ⬜ Set up identity service database

---

## Useful Resources

- **Neo4j Browser Guide:** Built into Neo4j Browser, type `:play start`
- **Cypher Manual:** https://neo4j.com/docs/cypher-manual/current/
- **Neo4j Driver Docs:** https://neo4j.com/docs/javascript-manual/current/
- **APOC Documentation:** https://neo4j.com/labs/apoc/

---

## Daily Usage

### Start your development session:

**Neo4j Desktop:**
1. Open Neo4j Desktop
2. Click "Start" on your database
3. Click "Open" → "Neo4j Browser"

**Docker:**
```bash
docker start injury-surveillance-neo4j
# Open browser to http://localhost:7474
```

### Stop at end of day:

**Neo4j Desktop:**
1. Click "Stop" on your database

**Docker:**
```bash
docker stop injury-surveillance-neo4j
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Setup guide for Multi-Sport Athlete Injury Surveillance System

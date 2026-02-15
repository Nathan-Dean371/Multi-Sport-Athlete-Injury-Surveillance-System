// ============================================================================
// Initialize Neo4j Test Database
// ============================================================================
// This script clears and initializes the test database with constraints and
// indexes only (no sample data). Sample data is managed by test suites.
// 
// Run with: 
// docker exec -i injury-surveillance-neo4j-test cypher-shell -u neo4j 
//   -p injury-surveillance-test-password -d neo4j < init-test-db.cypher
// ============================================================================

// ----------------------------------------------------------------------------
// STEP 1: Clear all existing data (DANGEROUS - only for test database!)
// ----------------------------------------------------------------------------
MATCH (n) DETACH DELETE n;

// ----------------------------------------------------------------------------
// STEP 2: Create Constraints (from schema-setup.cypher)
// ----------------------------------------------------------------------------

// Player constraints
CREATE CONSTRAINT player_id_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.playerId IS UNIQUE;

CREATE CONSTRAINT player_pseudonym_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.pseudonymId IS UNIQUE;

// Team constraints
CREATE CONSTRAINT team_id_unique IF NOT EXISTS
FOR (t:Team) REQUIRE t.teamId IS UNIQUE;

// Injury constraints
CREATE CONSTRAINT injury_id_unique IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryId IS UNIQUE;

// Coach constraints
CREATE CONSTRAINT coach_id_unique IF NOT EXISTS
FOR (c:Coach) REQUIRE c.coachId IS UNIQUE;

CREATE CONSTRAINT coach_pseudonym_unique IF NOT EXISTS
FOR (c:Coach) REQUIRE c.pseudonymId IS UNIQUE;

// Admin constraints
CREATE CONSTRAINT admin_id_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.adminId IS UNIQUE;

CREATE CONSTRAINT admin_pseudonym_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.pseudonymId IS UNIQUE;

// Organization constraints
CREATE CONSTRAINT org_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.organizationId IS UNIQUE;

// Sport constraints
CREATE CONSTRAINT sport_id_unique IF NOT EXISTS
FOR (s:Sport) REQUIRE s.sportId IS UNIQUE;

// Season constraints
CREATE CONSTRAINT season_id_unique IF NOT EXISTS
FOR (s:Season) REQUIRE s.seasonId IS UNIQUE;

// ----------------------------------------------------------------------------
// STEP 3: Create Indexes for Performance
// ----------------------------------------------------------------------------

// Player indexes
CREATE INDEX player_active IF NOT EXISTS FOR (p:Player) ON (p.isActive);
CREATE INDEX player_created IF NOT EXISTS FOR (p:Player) ON (p.createdAt);

// Team indexes
CREATE INDEX team_active IF NOT EXISTS FOR (t:Team) ON (t.isActive);
CREATE INDEX team_name IF NOT EXISTS FOR (t:Team) ON (t.teamName);

// Injury indexes
CREATE INDEX injury_date IF NOT EXISTS FOR (i:Injury) ON (i.injuryDate);
CREATE INDEX injury_status IF NOT EXISTS FOR (i:Injury) ON (i.status);
CREATE INDEX injury_severity IF NOT EXISTS FOR (i:Injury) ON (i.severity);

// Coach indexes
CREATE INDEX coach_active IF NOT EXISTS FOR (c:Coach) ON (c.isActive);

// ----------------------------------------------------------------------------
// Verification
// ----------------------------------------------------------------------------
CALL db.constraints() YIELD name, type
RETURN 'Constraints created: ' + count(*) AS status;

CALL db.indexes() YIELD name, type
WHERE type <> 'LOOKUP'
RETURN 'Indexes created: ' + count(*) AS status;

MATCH (n)
RETURN 'Test database initialized. Total nodes: ' + count(n) AS status;

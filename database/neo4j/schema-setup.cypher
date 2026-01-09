// ============================================================================
// Multi-Sport Athlete Injury Surveillance System
// Neo4j Database Schema Setup Script
// ============================================================================
// 
// This script creates all necessary constraints and indexes for the injury
// surveillance system. Run this script ONCE when initializing a new database.
//
// Execution: Copy and paste this entire script into Neo4j Browser, or run:
//   cat schema-setup.cypher | cypher-shell -u neo4j -p <password>
//
// ============================================================================

// ============================================================================
// PART 1: UNIQUE CONSTRAINTS
// ============================================================================
// These ensure data integrity by preventing duplicate IDs

:begin;

// Player Constraints
CREATE CONSTRAINT player_id_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.playerId IS UNIQUE;

// Injury Constraints
CREATE CONSTRAINT injury_id_unique IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryId IS UNIQUE;

// Team Constraints
CREATE CONSTRAINT team_id_unique IF NOT EXISTS
FOR (t:Team) REQUIRE t.teamId IS UNIQUE;

// Sport Constraints
CREATE CONSTRAINT sport_id_unique IF NOT EXISTS
FOR (s:Sport) REQUIRE s.sportId IS UNIQUE;

// Organization Constraints
CREATE CONSTRAINT org_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.orgId IS UNIQUE;

// Coach Constraints
CREATE CONSTRAINT coach_id_unique IF NOT EXISTS
FOR (c:Coach) REQUIRE c.coachId IS UNIQUE;

// Admin Constraints
CREATE CONSTRAINT admin_id_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.adminId IS UNIQUE;

// Role Constraints
CREATE CONSTRAINT role_name_unique IF NOT EXISTS
FOR (r:Role) REQUIRE r.name IS UNIQUE;

// Session Constraints
CREATE CONSTRAINT session_id_unique IF NOT EXISTS
FOR (s:Session) REQUIRE s.sessionId IS UNIQUE;

// StatusUpdate Constraints
CREATE CONSTRAINT status_id_unique IF NOT EXISTS
FOR (su:StatusUpdate) REQUIRE su.statusUpdateId IS UNIQUE;

// AuditLog Constraints
CREATE CONSTRAINT audit_id_unique IF NOT EXISTS
FOR (al:AuditLog) REQUIRE al.auditId IS UNIQUE;

:commit;

// ============================================================================
// PART 2: PERFORMANCE INDEXES
// ============================================================================
// These speed up common query patterns

:begin;

// --- Player Indexes ---
CREATE INDEX player_active_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive);

CREATE INDEX player_age_group_idx IF NOT EXISTS
FOR (p:Player) ON (p.ageGroup);

// --- Injury Indexes ---
CREATE INDEX injury_date_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryDate);

CREATE INDEX injury_status_idx IF NOT EXISTS
FOR (i:Injury) ON (i.status);

CREATE INDEX injury_severity_idx IF NOT EXISTS
FOR (i:Injury) ON (i.severity);

CREATE INDEX injury_type_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryType);

CREATE INDEX injury_body_part_idx IF NOT EXISTS
FOR (i:Injury) ON (i.bodyPart);

// --- Session Indexes ---
CREATE INDEX session_date_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate);

CREATE INDEX session_type_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionType);

// --- Team Indexes ---
CREATE INDEX team_active_idx IF NOT EXISTS
FOR (t:Team) ON (t.isActive);

CREATE INDEX team_season_idx IF NOT EXISTS
FOR (t:Team) ON (t.season);

// --- AuditLog Indexes ---
CREATE INDEX audit_timestamp_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.timestamp);

CREATE INDEX audit_action_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.action);

CREATE INDEX audit_entity_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.entityType);

// --- Organization Indexes ---
CREATE INDEX org_type_idx IF NOT EXISTS
FOR (o:Organization) ON (o.type);

CREATE INDEX org_region_idx IF NOT EXISTS
FOR (o:Organization) ON (o.region);

// --- StatusUpdate Indexes ---
CREATE INDEX status_date_idx IF NOT EXISTS
FOR (su:StatusUpdate) ON (su.updateDate);

CREATE INDEX status_level_idx IF NOT EXISTS
FOR (su:StatusUpdate) ON (su.painLevel);

:commit;

// ============================================================================
// PART 3: COMPOSITE INDEXES (For complex queries)
// ============================================================================

:begin;

// Injury lookup by date range and status
CREATE INDEX injury_date_status_composite_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryDate, i.status);

// Active players in specific age group
CREATE INDEX player_active_age_composite_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive, p.ageGroup);

// Session lookup by date and type
CREATE INDEX session_date_type_composite_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate, s.sessionType);

:commit;

// ============================================================================
// PART 4: EXISTENCE CONSTRAINTS (Optional - Neo4j Enterprise only)
// ============================================================================
// Uncomment these if you're using Neo4j Enterprise Edition
// These ensure required properties are always present

/*
:begin;

// Player existence constraints
CREATE CONSTRAINT player_id_exists IF NOT EXISTS
FOR (p:Player) REQUIRE p.playerId IS NOT NULL;

CREATE CONSTRAINT player_active_exists IF NOT EXISTS
FOR (p:Player) REQUIRE p.isActive IS NOT NULL;

// Injury existence constraints
CREATE CONSTRAINT injury_id_exists IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryId IS NOT NULL;

CREATE CONSTRAINT injury_date_exists IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryDate IS NOT NULL;

CREATE CONSTRAINT injury_type_exists IF NOT EXISTS
FOR (i:Injury) REQUIRE i.injuryType IS NOT NULL;

:commit;
*/

// ============================================================================
// VERIFICATION QUERIES
// ============================================================================
// Run these after the script completes to verify setup

// Show all constraints
SHOW CONSTRAINTS;

// Show all indexes
SHOW INDEXES;

// Count constraints by type
CALL db.constraints() 
YIELD name, type 
RETURN type, count(*) as count 
ORDER BY type;

// Count indexes
CALL db.indexes() 
YIELD name, type, state
WHERE state = 'ONLINE' AND type <> 'LOOKUP'
RETURN type, count(*) as count
ORDER BY type;

// ============================================================================
// EXPECTED RESULTS
// ============================================================================
// After running this script, you should have:
// - 12 UNIQUE constraints (one for each primary ID field)
// - 18+ indexes for performance optimization
// - All indexes in ONLINE state
//
// If any constraints or indexes show as FAILED, check the error message
// and ensure no duplicate data exists before creating constraints
// ============================================================================

// Display completion message
RETURN "Schema setup complete! Run SHOW CONSTRAINTS and SHOW INDEXES to verify." AS message;

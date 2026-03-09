// ============================================================================
// Neo4j Schema Setup - Neo4j Browser Compatible
// ============================================================================
// Purpose:     Create all constraints, unique indexes, and performance indexes
//              (Neo4j Browser version - no transaction commands)
// Created:     2026
// Idempotent:  Yes (uses IF NOT EXISTS)
// Environment: All (Dev/Test/Prod)
// Dependencies: None (run this first)
// Usage:       Copy/paste entire file into Neo4j Browser query window and run
// Notes:       For cypher-shell, use 001-schema-setup.cypher instead
// ============================================================================

// ============================================================================
// PART 1: UNIQUE CONSTRAINTS
// ============================================================================

// Player Constraints
CREATE CONSTRAINT player_id_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.playerId IS UNIQUE;

CREATE CONSTRAINT player_pseudonym_unique IF NOT EXISTS
FOR (p:Player) REQUIRE p.pseudonymId IS UNIQUE;

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

CREATE CONSTRAINT coach_pseudonym_unique IF NOT EXISTS
FOR (c:Coach) REQUIRE c.pseudonymId IS UNIQUE;

// Admin Constraints
CREATE CONSTRAINT admin_id_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.adminId IS UNIQUE;

CREATE CONSTRAINT admin_pseudonym_unique IF NOT EXISTS
FOR (a:Admin) REQUIRE a.pseudonymId IS UNIQUE;

// Parent Constraints
CREATE CONSTRAINT parent_id_unique IF NOT EXISTS
FOR (p:Parent) REQUIRE p.parentId IS UNIQUE;

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

// ============================================================================
// PART 2: PERFORMANCE INDEXES
// ============================================================================

// --- Player Indexes ---
CREATE INDEX player_active_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive);

CREATE INDEX player_age_group_idx IF NOT EXISTS
FOR (p:Player) ON (p.ageGroup);

CREATE INDEX player_pseudonym_idx IF NOT EXISTS
FOR (p:Player) ON (p.pseudonymId);

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

// --- Parent Indexes ---
CREATE INDEX parent_pseudonym_idx IF NOT EXISTS
FOR (p:Parent) ON (p.pseudonymId);

// --- Coach Indexes ---
CREATE INDEX coach_active_idx IF NOT EXISTS
FOR (c:Coach) ON (c.isActive);

// --- Admin Indexes ---
CREATE INDEX admin_active_idx IF NOT EXISTS
FOR (a:Admin) ON (a.isActive);

// ============================================================================
// PART 3: COMPOSITE INDEXES (For complex queries)
// ============================================================================

// Injury lookup by date range and status
CREATE INDEX injury_date_status_composite_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryDate, i.status);

// Active players in specific age group
CREATE INDEX player_active_age_composite_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive, p.ageGroup);

// Session lookup by date and type
CREATE INDEX session_date_type_composite_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate, s.sessionType);

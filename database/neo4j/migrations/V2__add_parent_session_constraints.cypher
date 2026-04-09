// ============================================================================
// Add Parent and Session Schema Constraints
// ============================================================================
// Purpose:     Add uniqueness constraints and indexes for Parent & Session nodes
// Note:        Transitional compatibility migration. Some statements may already
//              exist from V1 baseline; IF NOT EXISTS makes this safe.
// Created:     2026
// Idempotent:  Yes (uses IF NOT EXISTS)
// Environment: All
// Dependencies: V1__schema_setup.cypher
// ============================================================================

// Neo4j migration: add uniqueness constraints for Parent and Session identifiers
CREATE CONSTRAINT parent_id_unique IF NOT EXISTS
FOR (p:Parent) REQUIRE p.parentId IS UNIQUE;

CREATE CONSTRAINT session_id_unique IF NOT EXISTS
FOR (s:Session) REQUIRE s.sessionId IS UNIQUE;

// Optional indexes for faster lookups
CREATE INDEX parent_pseudonym_idx IF NOT EXISTS
FOR (p:Parent) ON (p.pseudonymId);

CREATE INDEX session_date_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate);

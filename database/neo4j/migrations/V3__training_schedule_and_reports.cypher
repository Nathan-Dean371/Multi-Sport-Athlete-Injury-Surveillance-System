// ============================================================================
// Training Schedule + Post-Session Reports
// ============================================================================
// Purpose:     Persist player training schedule definitions and post-session
//              reports for admin reporting.
// Created:     2026
// Idempotent:  Yes (uses IF NOT EXISTS)
// Environment: All
// Dependencies: V1__schema_setup.cypher
// ============================================================================

// ---------------------------------------------------------------------------
// Constraints (Uniqueness)
// ---------------------------------------------------------------------------

CREATE CONSTRAINT training_session_definition_id_unique IF NOT EXISTS
FOR (d:TrainingSessionDefinition) REQUIRE d.trainingSessionId IS UNIQUE;

CREATE CONSTRAINT training_session_report_key_unique IF NOT EXISTS
FOR (r:TrainingSessionReport) REQUIRE r.reportKey IS UNIQUE;

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

CREATE INDEX training_session_definition_start_datetime_idx IF NOT EXISTS
FOR (d:TrainingSessionDefinition) ON (d.startDateTime);

CREATE INDEX training_session_definition_type_idx IF NOT EXISTS
FOR (d:TrainingSessionDefinition) ON (d.sessionType);

CREATE INDEX training_session_report_player_pseudonym_idx IF NOT EXISTS
FOR (r:TrainingSessionReport) ON (r.playerPseudonymId);

CREATE INDEX training_session_report_report_date_idx IF NOT EXISTS
FOR (r:TrainingSessionReport) ON (r.reportDate);

CREATE INDEX training_session_report_occurrence_date_idx IF NOT EXISTS
FOR (r:TrainingSessionReport) ON (r.occurrenceDate);

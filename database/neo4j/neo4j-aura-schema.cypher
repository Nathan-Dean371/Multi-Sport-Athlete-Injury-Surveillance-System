// PART 1: UNIQUE CONSTRAINTS

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

// PART 2: PERFORMANCE INDEXES

CREATE INDEX player_active_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive);

CREATE INDEX player_age_group_idx IF NOT EXISTS
FOR (p:Player) ON (p.ageGroup);

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

CREATE INDEX session_date_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate);

CREATE INDEX session_type_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionType);

CREATE INDEX team_active_idx IF NOT EXISTS
FOR (t:Team) ON (t.isActive);

CREATE INDEX team_season_idx IF NOT EXISTS
FOR (t:Team) ON (t.season);

CREATE INDEX audit_timestamp_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.timestamp);

CREATE INDEX audit_action_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.action);

CREATE INDEX audit_entity_idx IF NOT EXISTS
FOR (al:AuditLog) ON (al.entityType);

CREATE INDEX org_type_idx IF NOT EXISTS
FOR (o:Organization) ON (o.type);

CREATE INDEX org_region_idx IF NOT EXISTS
FOR (o:Organization) ON (o.region);

CREATE INDEX status_date_idx IF NOT EXISTS
FOR (su:StatusUpdate) ON (su.updateDate);

CREATE INDEX status_level_idx IF NOT EXISTS
FOR (su:StatusUpdate) ON (su.painLevel);

// PART 3: COMPOSITE INDEXES

CREATE INDEX injury_date_status_composite_idx IF NOT EXISTS
FOR (i:Injury) ON (i.injuryDate, i.status);

CREATE INDEX player_active_age_composite_idx IF NOT EXISTS
FOR (p:Player) ON (p.isActive, p.ageGroup);

CREATE INDEX session_date_type_composite_idx IF NOT EXISTS
FOR (s:Session) ON (s.sessionDate, s.sessionType);

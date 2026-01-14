// ============================================================================
// Link Existing Injuries to Players and Add Additional Sample Data
// ============================================================================

// ----------------------------------------------------------------------------
// PART 1: Link Existing Injuries to Players (if not already linked)
// ----------------------------------------------------------------------------

MATCH (p:Player {playerId: 'PLAYER-001'})
MATCH (i:Injury {injuryId: 'INJ-2024-001'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-08-15T10:30:00'),
    reportedBy: 'COACH-001'
}]->(i);

MATCH (p:Player {playerId: 'PLAYER-002'})
MATCH (i:Injury {injuryId: 'INJ-2024-002'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-09-03T14:15:00'),
    reportedBy: 'COACH-001'
}]->(i);

MATCH (p:Player {playerId: 'PLAYER-003'})
MATCH (i:Injury {injuryId: 'INJ-2024-003'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-09-20T16:45:00'),
    reportedBy: 'COACH-001'
}]->(i);

// ----------------------------------------------------------------------------
// PART 2: Add New Injuries (using MERGE to avoid duplicates)
// ----------------------------------------------------------------------------

MERGE (i:Injury {injuryId: 'INJ-2024-004'})
ON CREATE SET
    i.injuryType = 'Knee Pain',
    i.bodyPart = 'Knee',
    i.side = 'Right',
    i.severity = 'Minor',
    i.status = 'Recovering',
    i.injuryDate = datetime('2024-10-05T11:20:00'),
    i.expectedReturnDate = date('2024-10-20'),
    i.mechanism = 'Overuse',
    i.diagnosis = 'Patellofemoral Pain Syndrome',
    i.treatmentPlan = 'Physiotherapy, strengthening exercises',
    i.notes = 'Pain during running and jumping',
    i.createdAt = datetime(),
    i.updatedAt = datetime();

MATCH (p:Player {playerId: 'PLAYER-004'})
MATCH (i:Injury {injuryId: 'INJ-2024-004'})
MERGE (p)-[:HAS_INJURY {diagnosedDate: datetime('2024-10-05T11:20:00'), reportedBy: 'COACH-001'}]->(i);

MERGE (i:Injury {injuryId: 'INJ-2024-005'})
ON CREATE SET
    i.injuryType = 'Groin Strain',
    i.bodyPart = 'Groin',
    i.side = 'Left',
    i.severity = 'Moderate',
    i.status = 'Active',
    i.injuryDate = datetime('2024-10-12T15:30:00'),
    i.expectedReturnDate = date('2024-11-10'),
    i.mechanism = 'Sudden acceleration',
    i.diagnosis = 'Grade 2 Adductor Strain',
    i.treatmentPlan = 'Rest, gradual return protocol',
    i.notes = 'Sprint drill injury',
    i.createdAt = datetime(),
    i.updatedAt = datetime();

MATCH (p:Player {playerId: 'PLAYER-005'})
MATCH (i:Injury {injuryId: 'INJ-2024-005'})
MERGE (p)-[:HAS_INJURY {diagnosedDate: datetime('2024-10-12T15:30:00'), reportedBy: 'COACH-001'}]->(i);

MERGE (i:Injury {injuryId: 'INJ-2024-006'})
ON CREATE SET
    i.injuryType = 'Shoulder Injury',
    i.bodyPart = 'Shoulder',
    i.side = 'Right',
    i.severity = 'Minor',
    i.status = 'Recovered',
    i.injuryDate = datetime('2024-08-01T10:00:00'),
    i.expectedReturnDate = date('2024-08-20'),
    i.actualReturnDate = date('2024-08-18'),
    i.mechanism = 'Contact during tackle',
    i.diagnosis = 'AC Joint Sprain',
    i.treatmentPlan = 'Rest, mobility exercises',
    i.notes = 'Full recovery',
    i.createdAt = datetime(),
    i.updatedAt = datetime();

MATCH (p:Player {playerId: 'PLAYER-006'})
MATCH (i:Injury {injuryId: 'INJ-2024-006'})
MERGE (p)-[:HAS_INJURY {diagnosedDate: datetime('2024-08-01T10:00:00'), reportedBy: 'COACH-002'}]->(i);

// ----------------------------------------------------------------------------
// PART 3: Add Training Sessions
// ----------------------------------------------------------------------------

MERGE (s:Session {sessionId: 'SESS-2024-001'})
ON CREATE SET
    s.sessionDate = date('2024-10-01'),
    s.sessionType = 'Team Training',
    s.duration = 90,
    s.intensity = 'Moderate',
    s.focus = 'Tactical drills',
    s.attendance = 15,
    s.notes = 'Good defensive shape work',
    s.createdAt = datetime();

MATCH (s:Session {sessionId: 'SESS-2024-001'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

MERGE (s:Session {sessionId: 'SESS-2024-002'})
ON CREATE SET
    s.sessionDate = date('2024-10-03'),
    s.sessionType = 'Recovery',
    s.duration = 45,
    s.intensity = 'Light',
    s.focus = 'Active recovery',
    s.attendance = 12,
    s.notes = 'Post-match recovery',
    s.createdAt = datetime();

MATCH (s:Session {sessionId: 'SESS-2024-002'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

MERGE (s:Session {sessionId: 'SESS-2024-003'})
ON CREATE SET
    s.sessionDate = date('2024-10-05'),
    s.sessionType = 'Match',
    s.duration = 90,
    s.intensity = 'High',
    s.focus = 'Competitive match',
    s.attendance = 16,
    s.opponent = 'Sligo Rovers U21',
    s.result = 'Win 2-1',
    s.notes = 'Good team performance',
    s.createdAt = datetime();

MATCH (s:Session {sessionId: 'SESS-2024-003'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

// Link players to sessions
MATCH (p:Player) WHERE p.playerId IN ['PLAYER-001', 'PLAYER-002', 'PLAYER-003', 'PLAYER-004', 'PLAYER-005']
MATCH (s:Session {sessionId: 'SESS-2024-001'})
MERGE (p)-[:ATTENDED {participated: true, minutesPlayed: 90}]->(s);

// ----------------------------------------------------------------------------
// PART 4: Add Status Updates
// ----------------------------------------------------------------------------

MERGE (su:StatusUpdate {statusUpdateId: 'STATUS-004'})
ON CREATE SET
    su.updateDate = date('2024-10-19'),
    su.status = 'Active',
    su.painLevel = 4,
    su.mobilityRating = 6,
    su.notes = 'Continuing rehab protocol',
    su.updatedBy = 'COACH-001',
    su.createdAt = datetime();

MATCH (i:Injury {injuryId: 'INJ-2024-005'})
MATCH (su:StatusUpdate {statusUpdateId: 'STATUS-004'})
MERGE (i)-[:HAS_STATUS_UPDATE]->(su);

MERGE (su:StatusUpdate {statusUpdateId: 'STATUS-005'})
ON CREATE SET
    su.updateDate = date('2024-10-15'),
    su.status = 'Improving',
    su.painLevel = 2,
    su.mobilityRating = 8,
    su.notes = 'Gradual progression, starting running drills',
    su.updatedBy = 'COACH-001',
    su.createdAt = datetime();

MATCH (i:Injury {injuryId: 'INJ-2024-004'})
MATCH (su:StatusUpdate {statusUpdateId: 'STATUS-005'})
MERGE (i)-[:HAS_STATUS_UPDATE]->(su);

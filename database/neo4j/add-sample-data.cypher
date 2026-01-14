// ============================================================================
// Link Existing Injuries to Players and Add More Sample Data
// ============================================================================
// This script:
// 1. Links existing injuries to players
// 2. Adds more injury records
// 3. Adds training sessions
// 4. Creates status updates for injuries
// ============================================================================

:begin;

// ----------------------------------------------------------------------------
// PART 1: Link Existing Injuries to Players
// ----------------------------------------------------------------------------

// Link injury 1 (Hamstring Strain) to Liam Murphy (PLAYER-001)
MATCH (p:Player {playerId: 'PLAYER-001'})
MATCH (i:Injury {injuryId: 'INJ-2024-001'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-08-15T10:30:00'),
    reportedBy: 'COACH-001'
}]->(i);

// Link injury 2 (Ankle Sprain) to Cian O'Brien (PLAYER-002)
MATCH (p:Player {playerId: 'PLAYER-002'})
MATCH (i:Injury {injuryId: 'INJ-2024-002'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-09-03T14:15:00'),
    reportedBy: 'COACH-001'
}]->(i);

// Link injury 3 (Concussion) to Seán Kelly (PLAYER-003)
MATCH (p:Player {playerId: 'PLAYER-003'})
MATCH (i:Injury {injuryId: 'INJ-2024-003'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-09-20T16:45:00'),
    reportedBy: 'COACH-001'
}]->(i);

:commit;

:begin;

// ----------------------------------------------------------------------------
// PART 2: Add More Injury Records
// ----------------------------------------------------------------------------

// Injury 4: Conor Walsh - Knee Pain
CREATE (i:Injury {
    injuryId: 'INJ-2024-004',
    injuryType: 'Knee Pain',
    bodyPart: 'Knee',
    side: 'Right',
    severity: 'Minor',
    status: 'Recovering',
    injuryDate: datetime('2024-10-05T11:20:00'),
    expectedReturnDate: date('2024-10-20'),
    mechanism: 'Overuse',
    diagnosis: 'Patellofemoral Pain Syndrome',
    treatmentPlan: 'Physiotherapy, strengthening exercises, reduced training load',
    notes: 'Player reports pain during running and jumping activities',
    createdAt: datetime(),
    updatedAt: datetime()
});

MATCH (p:Player {playerId: 'PLAYER-004'})
MATCH (i:Injury {injuryId: 'INJ-2024-004'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-10-05T11:20:00'),
    reportedBy: 'COACH-001'
}]->(i);

// Injury 5: Oisín Ryan - Groin Strain
CREATE (i:Injury {
    injuryId: 'INJ-2024-005',
    injuryType: 'Groin Strain',
    bodyPart: 'Groin',
    side: 'Left',
    severity: 'Moderate',
    status: 'Active',
    injuryDate: datetime('2024-10-12T15:30:00'),
    expectedReturnDate: date('2024-11-10'),
    mechanism: 'Sudden acceleration',
    diagnosis: 'Grade 2 Adductor Strain',
    treatmentPlan: 'Rest, ice, compression, gradual return to training protocol',
    notes: 'Occurred during sprint drill in training',
    createdAt: datetime(),
    updatedAt: datetime()
});

MATCH (p:Player {playerId: 'PLAYER-005'})
MATCH (i:Injury {injuryId: 'INJ-2024-005'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-10-12T15:30:00'),
    reportedBy: 'COACH-001'
}]->(i);

// Injury 6: Darragh Brennan - Shoulder Injury (Recovered)
CREATE (i:Injury {
    injuryId: 'INJ-2024-006',
    injuryType: 'Shoulder Injury',
    bodyPart: 'Shoulder',
    side: 'Right',
    severity: 'Minor',
    status: 'Recovered',
    injuryDate: datetime('2024-08-01T10:00:00'),
    expectedReturnDate: date('2024-08-20'),
    actualReturnDate: date('2024-08-18'),
    mechanism: 'Contact during tackle',
    diagnosis: 'AC Joint Sprain',
    treatmentPlan: 'Rest, anti-inflammatory medication, mobility exercises',
    notes: 'Full recovery ahead of schedule',
    createdAt: datetime(),
    updatedAt: datetime()
});

MATCH (p:Player {playerId: 'PLAYER-006'})
MATCH (i:Injury {injuryId: 'INJ-2024-006'})
MERGE (p)-[:HAS_INJURY {
    diagnosedDate: datetime('2024-08-01T10:00:00'),
    reportedBy: 'COACH-002'
}]->(i);

:commit;

:begin;

// ----------------------------------------------------------------------------
// PART 3: Add Training Sessions
// ----------------------------------------------------------------------------

// Session 1: Team Training - Oct 1
CREATE (s:Session {
    sessionId: 'SESS-2024-001',
    sessionDate: date('2024-10-01'),
    sessionType: 'Team Training',
    duration: 90,
    intensity: 'Moderate',
    focus: 'Tactical drills and conditioning',
    attendance: 15,
    notes: 'Good intensity, focus on defensive shape',
    createdAt: datetime()
});

// Link players to session
MATCH (s:Session {sessionId: 'SESS-2024-001'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

// Session 2: Recovery Session - Oct 3
CREATE (s:Session {
    sessionId: 'SESS-2024-002',
    sessionDate: date('2024-10-03'),
    sessionType: 'Recovery',
    duration: 45,
    intensity: 'Light',
    focus: 'Active recovery and mobility work',
    attendance: 12,
    notes: 'Light session after weekend match',
    createdAt: datetime()
});

MATCH (s:Session {sessionId: 'SESS-2024-002'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

// Session 3: Match Day - Oct 5
CREATE (s:Session {
    sessionId: 'SESS-2024-003',
    sessionDate: date('2024-10-05'),
    sessionType: 'Match',
    duration: 90,
    intensity: 'High',
    focus: 'Competitive match',
    attendance: 16,
    opponent: 'Sligo Rovers U21',
    result: 'Win 2-1',
    notes: 'Good team performance, Conor Walsh felt knee discomfort',
    createdAt: datetime()
});

MATCH (s:Session {sessionId: 'SESS-2024-003'})
MATCH (t:Team {teamId: 'TEAM-GU-U21'})
MERGE (t)-[:CONDUCTED_SESSION]->(s);

// Link players to sessions they attended
MATCH (p:Player) WHERE p.playerId IN ['PLAYER-001', 'PLAYER-002', 'PLAYER-003', 'PLAYER-004', 'PLAYER-005']
MATCH (s:Session {sessionId: 'SESS-2024-001'})
MERGE (p)-[:ATTENDED {
    participated: true,
    minutesPlayed: 90
}]->(s);

:commit;

:begin;

// ----------------------------------------------------------------------------
// PART 4: Add Status Updates for Injuries
// ----------------------------------------------------------------------------

// Status update for Hamstring Strain (INJ-2024-001)
CREATE (su:StatusUpdate {
    statusUpdateId: 'STATUS-001',
    updateDate: date('2024-09-01'),
    status: 'Improving',
    painLevel: 3,
    mobilityRating: 7,
    notes: 'Significant improvement, starting light jogging',
    updatedBy: 'COACH-001',
    createdAt: datetime()
});

MATCH (i:Injury {injuryId: 'INJ-2024-001'})
MATCH (su:StatusUpdate {statusUpdateId: 'STATUS-001'})
MERGE (i)-[:HAS_STATUS_UPDATE]->(su);

// Status update for Ankle Sprain (INJ-2024-002)
CREATE (su:StatusUpdate {
    statusUpdateId: 'STATUS-002',
    updateDate: date('2024-09-15'),
    status: 'Recovering',
    painLevel: 2,
    mobilityRating: 8,
    notes: 'Almost full range of motion restored, cleared for training',
    updatedBy: 'COACH-001',
    createdAt: datetime()
});

MATCH (i:Injury {injuryId: 'INJ-2024-002'})
MATCH (su:StatusUpdate {statusUpdateId: 'STATUS-002'})
MERGE (i)-[:HAS_STATUS_UPDATE]->(su);

// Status update for Groin Strain (INJ-2024-005)
CREATE (su:StatusUpdate {
    statusUpdateId: 'STATUS-003',
    updateDate: date('2024-10-19'),
    status: 'Active',
    painLevel: 4,
    mobilityRating: 6,
    notes: 'Still experiencing discomfort, continuing rehab protocol',
    updatedBy: 'COACH-001',
    createdAt: datetime()
});

MATCH (i:Injury {injuryId: 'INJ-2024-005'})
MATCH (su:StatusUpdate {statusUpdateId: 'STATUS-003'})
MERGE (i)-[:HAS_STATUS_UPDATE]->(su);

:commit;

// ----------------------------------------------------------------------------
// Verification Queries
// ----------------------------------------------------------------------------

// Show all players with their injuries
MATCH (p:Player)-[:HAS_INJURY]->(i:Injury)
RETURN p.playerId, p.name, i.injuryType, i.status, i.severity
ORDER BY i.injuryDate DESC;

// Count injuries by status
MATCH (i:Injury)
RETURN i.status, count(i) as count
ORDER BY count DESC;

// Show recent training sessions
MATCH (t:Team)-[:CONDUCTED_SESSION]->(s:Session)
RETURN t.name, s.sessionType, s.sessionDate, s.intensity
ORDER BY s.sessionDate DESC
LIMIT 5;

// Show injury recovery progress
MATCH (i:Injury)-[:HAS_STATUS_UPDATE]->(su:StatusUpdate)
RETURN i.injuryId, i.injuryType, su.updateDate, su.status, su.painLevel
ORDER BY su.updateDate DESC;

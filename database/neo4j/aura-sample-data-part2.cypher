// ============================================================================
// PART 5: RELATIONSHIPS - Connect Everything
// ============================================================================

MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
MATCH (team3:Team {teamId: 'TEAM-ATU-SOCCER-001'})
MATCH (team4:Team {teamId: 'TEAM-ATU-RUGBY-001'})
MATCH (org1:Organization {orgId: 'ORG-GALWAY-FC-001'})
MATCH (org2:Organization {orgId: 'ORG-ATU-001'})
MATCH (soccer:Sport {sportId: 'SPORT-SOCCER-001'})
MATCH (rugby:Sport {sportId: 'SPORT-RUGBY-001'})
CREATE (team1)-[:BELONGS_TO]->(org1)
CREATE (team2)-[:BELONGS_TO]->(org1)
CREATE (team3)-[:BELONGS_TO]->(org2)
CREATE (team4)-[:BELONGS_TO]->(org2)
CREATE (team1)-[:PLAYS]->(soccer)
CREATE (team2)-[:PLAYS]->(soccer)
CREATE (team3)-[:PLAYS]->(soccer)
CREATE (team4)-[:PLAYS]->(rugby);

MATCH (coach1:Coach {coachId: 'COACH-001'})
MATCH (coach2:Coach {coachId: 'COACH-002'})
MATCH (coach3:Coach {coachId: 'COACH-003'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
MATCH (team3:Team {teamId: 'TEAM-ATU-SOCCER-001'})
CREATE (coach1)-[:MANAGES]->(team1)
CREATE (coach2)-[:MANAGES]->(team2)
CREATE (coach3)-[:MANAGES]->(team3);

MATCH (player1:Player {playerId: 'PLAYER-001'})
MATCH (player2:Player {playerId: 'PLAYER-002'})
MATCH (player3:Player {playerId: 'PLAYER-003'})
MATCH (player4:Player {playerId: 'PLAYER-004'})
MATCH (player5:Player {playerId: 'PLAYER-005'})
MATCH (player6:Player {playerId: 'PLAYER-006'})
MATCH (player7:Player {playerId: 'PLAYER-007'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
CREATE (player1)-[:PLAYS_FOR]->(team1)
CREATE (player2)-[:PLAYS_FOR]->(team1)
CREATE (player3)-[:PLAYS_FOR]->(team1)
CREATE (player4)-[:PLAYS_FOR]->(team1)
CREATE (player5)-[:PLAYS_FOR]->(team1)
CREATE (player6)-[:PLAYS_FOR]->(team2)
CREATE (player7)-[:PLAYS_FOR]->(team2);

// ============================================================================
// PART 6: TRAINING SESSIONS
// ============================================================================

CREATE (session1:Session {
  sessionId: 'SESSION-001',
  sessionDate: date('2025-01-02'),
  sessionType: 'Training',
  duration: 90,
  intensity: 'Medium',
  notes: 'Pre-season fitness training',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (session2:Session {
  sessionId: 'SESSION-002',
  sessionDate: date('2025-01-03'),
  sessionType: 'Match',
  duration: 90,
  intensity: 'High',
  notes: 'Friendly match vs local team',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (session3:Session {
  sessionId: 'SESSION-003',
  sessionDate: date('2025-01-07'),
  sessionType: 'Training',
  duration: 60,
  intensity: 'Low',
  notes: 'Recovery session post-match',
  createdAt: datetime(),
  updatedAt: datetime()
});

MATCH (session1:Session {sessionId: 'SESSION-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
MATCH (session3:Session {sessionId: 'SESSION-003'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
CREATE (session1)-[:FOR_TEAM]->(team1)
CREATE (session2)-[:FOR_TEAM]->(team1)
CREATE (session3)-[:FOR_TEAM]->(team1);

// ============================================================================
// PART 7: INJURIES
// ============================================================================

CREATE (injury1:Injury {
  injuryId: 'INJ-2025-001',
  injuryType: 'Ankle Sprain',
  bodyPart: 'Ankle',
  side: 'Right',
  severity: 'Moderate',
  injuryDate: date('2025-01-03'),
  mechanism: 'Contact during tackle',
  status: 'Recovering',
  estimatedRecovery: 14,
  actualRecoveryDays: null,
  returnToPlayDate: null,
  requiresSurgery: false,
  notes: 'Grade 2 lateral ankle sprain during match',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (injury2:Injury {
  injuryId: 'INJ-2024-045',
  injuryType: 'Hamstring Strain',
  bodyPart: 'Hamstring',
  side: 'Left',
  severity: 'Mild',
  injuryDate: date('2024-12-15'),
  mechanism: 'Non-contact sprint',
  status: 'Resolved',
  estimatedRecovery: 7,
  actualRecoveryDays: 9,
  returnToPlayDate: date('2024-12-24'),
  requiresSurgery: false,
  notes: 'Grade 1 strain, full recovery',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (injury3:Injury {
  injuryId: 'INJ-2025-002',
  injuryType: 'Concussion',
  bodyPart: 'Head',
  side: 'N/A',
  severity: 'Moderate',
  injuryDate: date('2024-12-28'),
  mechanism: 'Head collision',
  status: 'Under Assessment',
  estimatedRecovery: 21,
  actualRecoveryDays: null,
  returnToPlayDate: null,
  requiresSurgery: false,
  notes: 'Following return-to-play protocol',
  createdAt: datetime(),
  updatedAt: datetime()
});

MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury2:Injury {injuryId: 'INJ-2024-045'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
CREATE (p1)-[:SUSTAINED]->(injury1)
CREATE (p2)-[:SUSTAINED]->(injury2)
CREATE (p3)-[:SUSTAINED]->(injury3);

MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
CREATE (injury1)-[:OCCURRED_DURING]->(session2);

// ============================================================================
// PART 8: STATUS UPDATES
// ============================================================================

CREATE (status1:StatusUpdate {
  statusUpdateId: 'STATUS-001',
  updateDate: date('2025-01-04'),
  painLevel: 6,
  swelling: 'Moderate',
  rangeOfMotion: 40,
  functionalStatus: 'Limited weight bearing',
  treatment: 'RICE protocol, anti-inflammatories',
  nextSteps: 'Reassess in 3 days',
  canTrain: false,
  canCompete: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (status2:StatusUpdate {
  statusUpdateId: 'STATUS-002',
  updateDate: date('2025-01-07'),
  painLevel: 3,
  swelling: 'Mild',
  rangeOfMotion: 70,
  functionalStatus: 'Walking normally',
  treatment: 'Physiotherapy, strengthening exercises',
  nextSteps: 'Begin light jogging next week',
  canTrain: false,
  canCompete: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (status3:StatusUpdate {
  statusUpdateId: 'STATUS-003',
  updateDate: date('2025-01-05'),
  painLevel: 4,
  swelling: 'None',
  rangeOfMotion: 90,
  functionalStatus: 'Headache persisting',
  treatment: 'Rest, no screens, gradual return protocol',
  nextSteps: 'Neurological assessment',
  canTrain: false,
  canCompete: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
MATCH (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
MATCH (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
MATCH (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
CREATE (injury1)-[:HAS_UPDATE]->(status1)
CREATE (injury1)-[:HAS_UPDATE]->(status2)
CREATE (injury3)-[:HAS_UPDATE]->(status3);

// ============================================================================
// PART 9: AUDIT LOGS
// ============================================================================

CREATE (audit1:AuditLog {
  auditId: 'AUDIT-001',
  timestamp: datetime('2025-01-03T16:30:00Z'),
  action: 'CREATE',
  entityType: 'Injury',
  entityId: 'INJ-2025-001',
  changes: 'New injury reported after match',
  ipAddress: '10.0.0.20',
  userAgent: 'Mobile App v1.0',
  createdAt: datetime()
});

CREATE (audit2:AuditLog {
  auditId: 'AUDIT-002',
  timestamp: datetime('2025-01-04T09:15:00Z'),
  action: 'CREATE',
  entityType: 'StatusUpdate',
  entityId: 'STATUS-001',
  changes: 'Added status update for INJ-2025-001',
  ipAddress: '10.0.0.20',
  userAgent: 'Web Dashboard v1.0',
  createdAt: datetime()
});

CREATE (audit3:AuditLog {
  auditId: 'AUDIT-003',
  timestamp: datetime('2025-01-07T10:00:00Z'),
  action: 'UPDATE',
  entityType: 'StatusUpdate',
  entityId: 'STATUS-002',
  changes: 'Added follow-up status update',
  ipAddress: '10.0.0.20',
  userAgent: 'Web Dashboard v1.0',
  createdAt: datetime()
});

MATCH (audit1:AuditLog {auditId: 'AUDIT-001'})
MATCH (audit2:AuditLog {auditId: 'AUDIT-002'})
MATCH (audit3:AuditLog {auditId: 'AUDIT-003'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
CREATE (coach1)-[:PERFORMED]->(audit1)
CREATE (coach1)-[:PERFORMED]->(audit2)
CREATE (coach1)-[:PERFORMED]->(audit3);

// ============================================================================
// SENIOR TEAM INJURIES (from add-senior-team-injuries.cypher)
// ============================================================================

CREATE (injury4:Injury {
  injuryId: 'INJ-2026-001',
  injuryType: 'Shoulder Dislocation',
  bodyPart: 'Shoulder',
  side: 'Right',
  severity: 'Severe',
  status: 'Active',
  injuryDate: datetime('2026-02-10T14:30:00'),
  expectedReturnDate: date('2026-03-25'),
  mechanism: 'Contact',
  diagnosis: 'Anterior shoulder dislocation with labral tear',
  treatmentPlan: 'Rest, ice, physiotherapy 3x/week, consider arthroscopic surgery',
  notes: 'Occurred during tackle in training session.',
  isResolved: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (injury5:Injury {
  injuryId: 'INJ-2026-002',
  injuryType: 'Knee Sprain',
  bodyPart: 'Knee',
  side: 'Left',
  severity: 'Moderate',
  status: 'Recovering',
  injuryDate: datetime('2026-01-28T16:00:00'),
  expectedReturnDate: date('2026-02-20'),
  mechanism: 'Overuse',
  diagnosis: 'MCL Grade 2 sprain',
  treatmentPlan: 'RICE protocol, gradual return to training, strengthening exercises',
  notes: 'Good progress shown. Player able to complete light training.',
  isResolved: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (injury6:Injury {
  injuryId: 'INJ-2025-078',
  injuryType: 'Calf Strain',
  bodyPart: 'Calf',
  side: 'Left',
  severity: 'Minor',
  status: 'Recovered',
  injuryDate: datetime('2025-12-18T10:00:00'),
  expectedReturnDate: date('2025-12-28'),
  mechanism: 'Acute',
  diagnosis: 'Grade 1 gastrocnemius strain',
  treatmentPlan: 'Rest, physiotherapy, gradual return to running',
  notes: 'Full recovery achieved. Cleared for match play.',
  isResolved: true,
  createdAt: datetime(),
  updatedAt: datetime()
});

MATCH (p6:Player {playerId: 'PLAYER-006'})
MATCH (p7:Player {playerId: 'PLAYER-007'})
MATCH (injury4:Injury {injuryId: 'INJ-2026-001'})
MATCH (injury5:Injury {injuryId: 'INJ-2026-002'})
MATCH (injury6:Injury {injuryId: 'INJ-2025-078'})
CREATE (p6)-[:SUSTAINED]->(injury4)
CREATE (p7)-[:SUSTAINED]->(injury5)
CREATE (p6)-[:SUSTAINED]->(injury6);

// Verify
MATCH (n)
RETURN labels(n)[0] AS NodeType, count(*) AS Count
ORDER BY Count DESC;

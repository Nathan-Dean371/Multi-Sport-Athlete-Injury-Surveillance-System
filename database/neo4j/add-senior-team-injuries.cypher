// ============================================================================
// Add Sample Injuries for Senior Team Players
// ============================================================================
// This script adds injuries for Galway United Senior Team players
// (Darragh Brennan and Eoin McCarthy) so Coach 2 can see injury data
// ============================================================================

:begin;

// --- Create Injuries for Senior Team Players ---

// Injury for Darragh Brennan (PLAYER-006) - Active shoulder injury
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
  notes: 'Occurred during tackle in training session. Player reported immediate pain and loss of range of motion.',
  isResolved: false,
  createdAt: datetime(),
  updatedAt: datetime()
});

// Injury for Eoin McCarthy (PLAYER-007) - Recovering knee injury
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

// Injury for Darragh Brennan (PLAYER-006) - Resolved calf strain
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

:commit;

:begin;

// --- Link Injuries to Players ---
MATCH (injury4:Injury {injuryId: 'INJ-2026-001'})
MATCH (injury5:Injury {injuryId: 'INJ-2026-002'})
MATCH (injury6:Injury {injuryId: 'INJ-2025-078'})
MATCH (p6:Player {playerId: 'PLAYER-006'})
MATCH (p7:Player {playerId: 'PLAYER-007'})
CREATE (p6)-[:SUSTAINED {diagnosedDate: datetime('2026-02-10T15:00:00'), reportedBy: 'COACH-002'}]->(injury4)
CREATE (p7)-[:SUSTAINED {diagnosedDate: datetime('2026-01-28T16:30:00'), reportedBy: 'COACH-002'}]->(injury5)
CREATE (p6)-[:SUSTAINED {diagnosedDate: datetime('2025-12-18T10:30:00'), reportedBy: 'COACH-002'}]->(injury6);

:commit;

:begin;

// --- Add Status Updates for Active/Recovering Injuries ---

// Status updates for injury4 (Darragh's shoulder)
MATCH (injury4:Injury {injuryId: 'INJ-2026-001'})
CREATE (status1:StatusUpdate {
  updateId: 'STATUS-INJ4-001',
  status: 'Active',
  notes: 'Initial diagnosis confirmed. Starting conservative treatment.',
  recordedBy: 'COACH-001',
  recordedAt: datetime('2026-02-10T16:00:00')
})
CREATE (injury4)-[:HAS_STATUS_UPDATE]->(status1);

// Status updates for injury5 (Eoin's knee)
MATCH (injury5:Injury {injuryId: 'INJ-2026-002'})
CREATE (status2:StatusUpdate {
  updateId: 'STATUS-INJ5-001',
  status: 'Active',
  notes: 'Player commenced physiotherapy program.',
  recordedBy: 'COACH-001',
  recordedAt: datetime('2026-01-29T09:00:00')
})
CREATE (status3:StatusUpdate {
  updateId: 'STATUS-INJ5-002',
  status: 'Recovering',
  notes: 'Good progress. Player completed light training without pain.',
  recordedBy: 'COACH-001',
  recordedAt: datetime('2026-02-05T10:30:00')
})
CREATE (status4:StatusUpdate {
  updateId: 'STATUS-INJ5-003',
  status: 'Recovering',
  notes: 'Progressing to moderate intensity training.',
  recordedBy: 'COACH-001',
  recordedAt: datetime('2026-02-12T11:00:00')
})
CREATE (injury5)-[:HAS_STATUS_UPDATE]->(status2)
CREATE (injury5)-[:HAS_STATUS_UPDATE]->(status3)
CREATE (injury5)-[:HAS_STATUS_UPDATE]->(status4);

:commit;

// ============================================================================
// Verification Queries
// ============================================================================

// Check injuries for Senior Team players
MATCH (p:Player)-[r:SUSTAINED]->(i:Injury)
WHERE p.playerId IN ['PLAYER-006', 'PLAYER-007']
RETURN p.playerId AS playerId, 
       i.injuryId AS injuryId,
       i.injuryType AS type,
       i.status AS status,
       i.severity AS severity,
       i.injuryDate AS injuryDate;

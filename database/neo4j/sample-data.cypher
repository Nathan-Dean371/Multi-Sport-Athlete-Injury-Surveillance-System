// ============================================================================
// Multi-Sport Athlete Injury Surveillance System
// Sample Data Creation Script
// ============================================================================
// 
// This script creates comprehensive sample data for development and testing.
// It includes multiple sports, organizations, teams, players, and injuries
// with realistic relationships.
//
// IMPORTANT: Run schema-setup.cypher BEFORE running this script!
//
// Execution: Copy and paste sections into Neo4j Browser, or run:
//   cat sample-data.cypher | cypher-shell -u neo4j -p <password>
//
// ============================================================================

// ============================================================================
// CLEANUP (Optional - only if you want to start fresh)
// ============================================================================
// WARNING: This deletes ALL data in the database!
// Uncomment the following line only if you want to clear everything:

// MATCH (n) DETACH DELETE n;

// ============================================================================
// PART 1: CORE REFERENCE DATA
// ============================================================================

:begin;

// --- Create Sports ---
CREATE (soccer:Sport {
  sportId: 'SPORT-SOCCER-001',
  name: 'Soccer',
  category: 'Team Sport',
  riskLevel: 'Medium',
  commonInjuries: ['Ankle Sprain', 'Hamstring Strain', 'ACL Tear', 'Groin Strain'],
  requiredEquipment: ['Boots', 'Shin Guards', 'Ball'],
  playerCount: 11,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (gaa:Sport {
  sportId: 'SPORT-GAA-001',
  name: 'Gaelic Football',
  category: 'Team Sport',
  riskLevel: 'Medium-High',
  commonInjuries: ['Shoulder Injury', 'Ankle Sprain', 'Hamstring Strain', 'Concussion'],
  requiredEquipment: ['Boots', 'Helmet (optional)', 'Ball'],
  playerCount: 15,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (rugby:Sport {
  sportId: 'SPORT-RUGBY-001',
  name: 'Rugby Union',
  category: 'Team Sport',
  riskLevel: 'High',
  commonInjuries: ['Concussion', 'Shoulder Dislocation', 'ACL Tear', 'Broken Bones'],
  requiredEquipment: ['Boots', 'Mouthguard', 'Scrum Cap', 'Ball'],
  playerCount: 15,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (athletics:Sport {
  sportId: 'SPORT-ATH-001',
  name: 'Athletics',
  category: 'Individual Sport',
  riskLevel: 'Low-Medium',
  commonInjuries: ['Stress Fracture', 'Achilles Tendinitis', 'Shin Splints', 'Runner\'s Knee'],
  requiredEquipment: ['Running Shoes', 'Spikes (track)'],
  playerCount: 1,
  createdAt: datetime(),
  updatedAt: datetime()
});

// --- Create Organizations ---
CREATE (club1:Organization {
  orgId: 'ORG-GALWAY-FC-001',
  name: 'Galway United FC',
  type: 'Club',
  region: 'Connacht',
  country: 'Ireland',
  established: 1924,
  isActive: true,
  contactEmail: 'info@galwayunitedfc.ie',
  website: 'https://galwayunitedfc.ie',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (club2:Organization {
  orgId: 'ORG-ATU-001',
  name: 'Atlantic Technological University Sports',
  type: 'Academy',
  region: 'Connacht',
  country: 'Ireland',
  established: 2022,
  isActive: true,
  contactEmail: 'sports@atu.ie',
  website: 'https://atu.ie',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (fed1:Organization {
  orgId: 'ORG-FAI-001',
  name: 'Football Association of Ireland',
  type: 'Federation',
  region: 'National',
  country: 'Ireland',
  established: 1921,
  isActive: true,
  contactEmail: 'info@fai.ie',
  website: 'https://fai.ie',
  createdAt: datetime(),
  updatedAt: datetime()
});

// --- Create Roles ---
CREATE (adminRole:Role {
  name: 'System Administrator',
  permissions: ['VIEW_ALL', 'EDIT_ALL', 'DELETE_ALL', 'MANAGE_USERS', 'VIEW_REPORTS'],
  description: 'Full system access',
  createdAt: datetime()
});

CREATE (coachRole:Role {
  name: 'Head Coach',
  permissions: ['VIEW_TEAM', 'VIEW_PLAYERS', 'VIEW_INJURIES', 'ADD_SESSIONS'],
  description: 'Team management and player viewing',
  createdAt: datetime()
});

CREATE (physioRole:Role {
  name: 'Physiotherapist',
  permissions: ['VIEW_INJURIES', 'EDIT_INJURIES', 'ADD_STATUS_UPDATES', 'VIEW_MEDICAL'],
  description: 'Medical staff with injury management access',
  createdAt: datetime()
});

CREATE (playerRole:Role {
  name: 'Player',
  permissions: ['VIEW_OWN', 'EDIT_OWN_STATUS', 'VIEW_OWN_INJURIES'],
  description: 'Limited access to own data',
  createdAt: datetime()
});

:commit;

// ============================================================================
// PART 2: TEAMS
// ============================================================================

:begin;

// --- Create Teams ---
CREATE (team1:Team {
  teamId: 'TEAM-GU-U21-001',
  name: 'Galway United U21',
  ageGroup: 'U21',
  competitionLevel: 'Development',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 18:00', 'Wednesday 18:00', 'Friday 17:00'],
  homeVenue: 'Eamonn Deacy Park',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (team2:Team {
  teamId: 'TEAM-GU-SENIOR-001',
  name: 'Galway United Senior',
  ageGroup: 'Senior',
  competitionLevel: 'Professional',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 10:00', 'Tuesday 10:00', 'Wednesday 10:00', 'Thursday 10:00'],
  homeVenue: 'Eamonn Deacy Park',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (team3:Team {
  teamId: 'TEAM-ATU-SOCCER-001',
  name: 'ATU Soccer Team',
  ageGroup: 'U23',
  competitionLevel: 'College',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Tuesday 19:00', 'Thursday 19:00'],
  homeVenue: 'ATU Sports Grounds',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (team4:Team {
  teamId: 'TEAM-ATU-RUGBY-001',
  name: 'ATU Rugby Team',
  ageGroup: 'U23',
  competitionLevel: 'College',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 18:00', 'Wednesday 18:00'],
  homeVenue: 'ATU Rugby Pitch',
  createdAt: datetime(),
  updatedAt: datetime()
});

:commit;

// ============================================================================
// PART 3: STAFF (Coaches and Admins)
// ============================================================================

:begin;

// --- Create Coaches ---
CREATE (coach1:Coach {
  coachId: 'COACH-001',
  pseudonymId: 'PSY-COACH-8F2A9D1B',
  specialization: 'Physiotherapy',
  certifications: ['Chartered Physiotherapist', 'Sports Injury Specialist'],
  yearsExperience: 8,
  isActive: true,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (coach2:Coach {
  coachId: 'COACH-002',
  pseudonymId: 'PSY-COACH-3B7E4C9A',
  specialization: 'Head Coach',
  certifications: ['UEFA A License', 'Sports Science Degree'],
  yearsExperience: 12,
  isActive: true,
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (coach3:Coach {
  coachId: 'COACH-003',
  pseudonymId: 'PSY-COACH-6D1F8E2C',
  specialization: 'Strength and Conditioning',
  certifications: ['CSCS', 'Exercise Science MSc'],
  yearsExperience: 6,
  isActive: true,
  createdAt: datetime(),
  updatedAt: datetime()
});

// --- Create Admin ---
CREATE (admin1:Admin {
  adminId: 'ADMIN-001',
  pseudonymId: 'PSY-ADMIN-9A3C5E7D',
  isActive: true,
  lastLogin: datetime(),
  createdAt: datetime(),
  updatedAt: datetime()
});

:commit;

// ============================================================================
// PART 4: PLAYERS
// ============================================================================

:begin;

// --- Create Players for U21 Team ---
CREATE (player1:Player {
  playerId: 'PLAYER-001',
  pseudonymId: 'PSY-PLAYER-A1B2C3D4',
  ageGroup: '18-21',
  position: 'Forward',
  height: 178.0,
  weight: 75.0,
  dominantSide: 'Right',
  medicalConditions: [],
  allergies: [],
  isActive: true,
  joinDate: date('2024-01-15'),
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (player2:Player {
  playerId: 'PLAYER-002',
  pseudonymId: 'PSY-PLAYER-E5F6G7H8',
  ageGroup: '18-21',
  position: 'Midfielder',
  height: 175.0,
  weight: 72.0,
  dominantSide: 'Left',
  medicalConditions: [],
  allergies: ['Penicillin'],
  isActive: true,
  joinDate: date('2024-01-15'),
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (player3:Player {
  playerId: 'PLAYER-003',
  pseudonymId: 'PSY-PLAYER-I9J0K1L2',
  ageGroup: '18-21',
  position: 'Defender',
  height: 182.0,
  weight: 78.0,
  dominantSide: 'Right',
  medicalConditions: ['Asthma'],
  allergies: [],
  isActive: true,
  joinDate: date('2024-02-01'),
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (player4:Player {
  playerId: 'PLAYER-004',
  pseudonymId: 'PSY-PLAYER-M3N4O5P6',
  ageGroup: '18-21',
  position: 'Goalkeeper',
  height: 188.0,
  weight: 85.0,
  dominantSide: 'Right',
  medicalConditions: [],
  allergies: [],
  isActive: true,
  joinDate: date('2023-09-01'),
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (player5:Player {
  playerId: 'PLAYER-005',
  pseudonymId: 'PSY-PLAYER-Q7R8S9T0',
  ageGroup: '18-21',
  position: 'Midfielder',
  height: 176.0,
  weight: 73.0,
  dominantSide: 'Right',
  medicalConditions: [],
  allergies: [],
  isActive: true,
  joinDate: date('2024-01-15'),
  createdAt: datetime(),
  updatedAt: datetime()
});

// --- Create Players for Senior Team ---
CREATE (player6:Player {
  playerId: 'PLAYER-006',
  pseudonymId: 'PSY-PLAYER-U1V2W3X4',
  ageGroup: '22-25',
  position: 'Forward',
  height: 180.0,
  weight: 77.0,
  dominantSide: 'Right',
  medicalConditions: [],
  allergies: [],
  isActive: true,
  joinDate: date('2022-07-01'),
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (player7:Player {
  playerId: 'PLAYER-007',
  pseudonymId: 'PSY-PLAYER-Y5Z6A7B8',
  ageGroup: '26-30',
  position: 'Defender',
  height: 185.0,
  weight: 82.0,
  dominantSide: 'Left',
  medicalConditions: [],
  allergies: [],
  isActive: true,
  joinDate: date('2021-01-15'),
  createdAt: datetime(),
  updatedAt: datetime()
});

:commit;

// ============================================================================
// PART 5: RELATIONSHIPS - Connect Everything
// ============================================================================

:begin;

// --- Team Relationships ---
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
MATCH (team3:Team {teamId: 'TEAM-ATU-SOCCER-001'})
MATCH (team4:Team {teamId: 'TEAM-ATU-RUGBY-001'})
MATCH (club1:Organization {orgId: 'ORG-GALWAY-FC-001'})
MATCH (club2:Organization {orgId: 'ORG-ATU-001'})
MATCH (soccer:Sport {sportId: 'SPORT-SOCCER-001'})
MATCH (rugby:Sport {sportId: 'SPORT-RUGBY-001'})
CREATE (team1)-[:BELONGS_TO]->(club1)
CREATE (team2)-[:BELONGS_TO]->(club1)
CREATE (team3)-[:BELONGS_TO]->(club2)
CREATE (team4)-[:BELONGS_TO]->(club2)
CREATE (team1)-[:PLAYS]->(soccer)
CREATE (team2)-[:PLAYS]->(soccer)
CREATE (team3)-[:PLAYS]->(soccer)
CREATE (team4)-[:PLAYS]->(rugby);

// --- Player-Team Relationships ---
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
MATCH (p4:Player {playerId: 'PLAYER-004'})
MATCH (p5:Player {playerId: 'PLAYER-005'})
MATCH (p6:Player {playerId: 'PLAYER-006'})
MATCH (p7:Player {playerId: 'PLAYER-007'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
CREATE (p1)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Forward', isActive: true}]->(team1)
CREATE (p2)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Midfielder', isActive: true}]->(team1)
CREATE (p3)-[:PLAYS_FOR {joinedDate: date('2024-02-01'), position: 'Defender', isActive: true}]->(team1)
CREATE (p4)-[:PLAYS_FOR {joinedDate: date('2023-09-01'), position: 'Goalkeeper', isActive: true}]->(team1)
CREATE (p5)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Midfielder', isActive: true}]->(team1)
CREATE (p6)-[:PLAYS_FOR {joinedDate: date('2022-07-01'), position: 'Forward', isActive: true}]->(team2)
CREATE (p7)-[:PLAYS_FOR {joinedDate: date('2021-01-15'), position: 'Defender', isActive: true}]->(team2);

// --- Coach-Team Relationships ---
MATCH (coach1:Coach {coachId: 'COACH-001'})
MATCH (coach2:Coach {coachId: 'COACH-002'})
MATCH (coach3:Coach {coachId: 'COACH-003'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
CREATE (coach1)-[:MANAGES {role: 'Physiotherapist', startDate: date('2023-08-01')}]->(team1)
CREATE (coach1)-[:MANAGES {role: 'Physiotherapist', startDate: date('2023-08-01')}]->(team2)
CREATE (coach2)-[:MANAGES {role: 'Head Coach', startDate: date('2023-06-01')}]->(team2)
CREATE (coach3)-[:MANAGES {role: 'Strength Coach', startDate: date('2024-01-01')}]->(team1);

// --- Role Assignments ---
MATCH (admin1:Admin {adminId: 'ADMIN-001'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
MATCH (coach2:Coach {coachId: 'COACH-002'})
MATCH (adminRole:Role {name: 'System Administrator'})
MATCH (physioRole:Role {name: 'Physiotherapist'})
MATCH (coachRole:Role {name: 'Head Coach'})
CREATE (admin1)-[:HAS_ROLE {assignedDate: date('2024-01-01')}]->(adminRole)
CREATE (coach1)-[:HAS_ROLE {assignedDate: date('2023-08-01')}]->(physioRole)
CREATE (coach2)-[:HAS_ROLE {assignedDate: date('2023-06-01')}]->(coachRole);

:commit;

// ============================================================================
// PART 6: TRAINING SESSIONS
// ============================================================================

:begin;

// --- Create Training Sessions ---
CREATE (session1:Session {
  sessionId: 'SESSION-001',
  sessionType: 'Training',
  sessionDate: date('2025-01-06'),
  duration: 90,
  intensity: 'High',
  location: 'Eamonn Deacy Park',
  weatherConditions: 'Clear, 8°C',
  attendance: 18,
  notes: 'Focus on attacking drills and set pieces',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (session2:Session {
  sessionId: 'SESSION-002',
  sessionType: 'Match',
  sessionDate: date('2025-01-03'),
  duration: 90,
  intensity: 'Very High',
  location: 'Away - Cork City',
  weatherConditions: 'Rainy, 6°C',
  attendance: 16,
  notes: 'League match - Won 2-1',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (session3:Session {
  sessionId: 'SESSION-003',
  sessionType: 'Recovery',
  sessionDate: date('2025-01-04'),
  duration: 60,
  intensity: 'Low',
  location: 'Indoor Facility',
  weatherConditions: 'N/A - Indoor',
  attendance: 20,
  notes: 'Light recovery session post-match',
  createdAt: datetime(),
  updatedAt: datetime()
});

// --- Link Sessions to Teams ---
MATCH (session1:Session {sessionId: 'SESSION-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
MATCH (session3:Session {sessionId: 'SESSION-003'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
CREATE (session1)-[:FOR_TEAM]->(team1)
CREATE (session2)-[:FOR_TEAM]->(team1)
CREATE (session3)-[:FOR_TEAM]->(team1);

:commit;

// ============================================================================
// PART 7: INJURIES AND STATUS UPDATES
// ============================================================================

:begin;

// --- Create Injuries ---
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

// --- Link Injuries to Players ---
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury2:Injury {injuryId: 'INJ-2024-045'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
CREATE (p1)-[:SUSTAINED]->(injury1)
CREATE (p2)-[:SUSTAINED]->(injury2)
CREATE (p3)-[:SUSTAINED]->(injury3);

// --- Link Injuries to Sessions (where applicable) ---
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
CREATE (injury1)-[:OCCURRED_DURING]->(session2);

// --- Create Status Updates ---
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
  notes: 'Significant swelling present, started physio',
  createdAt: datetime()
});

CREATE (status2:StatusUpdate {
  statusUpdateId: 'STATUS-002',
  updateDate: date('2025-01-07'),
  painLevel: 4,
  swelling: 'Mild',
  rangeOfMotion: 65,
  functionalStatus: 'Walking without crutches',
  treatment: 'Physiotherapy, strengthening exercises',
  nextSteps: 'Progress to proprioception training',
  canTrain: false,
  canCompete: false,
  notes: 'Good progress, swelling reducing',
  createdAt: datetime()
});

CREATE (status3:StatusUpdate {
  statusUpdateId: 'STATUS-003',
  updateDate: date('2024-12-29'),
  painLevel: 7,
  swelling: 'N/A',
  rangeOfMotion: null,
  functionalStatus: 'Headaches, sensitivity to light',
  treatment: 'Rest, no screen time',
  nextSteps: 'Follow concussion protocol stage 1',
  canTrain: false,
  canCompete: false,
  notes: 'Baseline cognitive assessment completed',
  createdAt: datetime()
});

// --- Link Status Updates to Injuries ---
MATCH (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
MATCH (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
MATCH (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
CREATE (injury1)-[:HAS_UPDATE]->(status1)
CREATE (injury1)-[:HAS_UPDATE]->(status2)
CREATE (injury3)-[:HAS_UPDATE]->(status3);

// --- Link Status Updates to Coaches (who created them) ---
MATCH (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
MATCH (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
MATCH (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
CREATE (coach1)-[:CREATED_UPDATE]->(status1)
CREATE (coach1)-[:CREATED_UPDATE]->(status2)
CREATE (coach1)-[:CREATED_UPDATE]->(status3);

:commit;

// ============================================================================
// PART 8: AUDIT LOGS
// ============================================================================

:begin;

// --- Create Audit Logs ---
CREATE (audit1:AuditLog {
  auditId: 'AUDIT-001',
  timestamp: datetime('2025-01-03T15:30:00Z'),
  action: 'CREATE',
  entityType: 'Injury',
  entityId: 'INJ-2025-001',
  changes: 'Created new injury record',
  ipAddress: '10.0.0.15',
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

// --- Link Audit Logs to Users ---
MATCH (audit1:AuditLog {auditId: 'AUDIT-001'})
MATCH (audit2:AuditLog {auditId: 'AUDIT-002'})
MATCH (audit3:AuditLog {auditId: 'AUDIT-003'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
CREATE (coach1)-[:PERFORMED]->(audit1)
CREATE (coach1)-[:PERFORMED]->(audit2)
CREATE (coach1)-[:PERFORMED]->(audit3);

:commit;

// ============================================================================
// VERIFICATION QUERIES
// ============================================================================

// --- Count all nodes by type ---
MATCH (n)
RETURN labels(n)[0] AS NodeType, count(*) AS Count
ORDER BY Count DESC;

// --- Verify team structure ---
MATCH (t:Team)-[:BELONGS_TO]->(o:Organization)
MATCH (t)-[:PLAYS]->(s:Sport)
RETURN t.name AS Team, o.name AS Organization, s.name AS Sport;

// --- Check player assignments ---
MATCH (p:Player)-[:PLAYS_FOR]->(t:Team)
RETURN t.name AS Team, count(p) AS PlayerCount;

// --- Review current injuries ---
MATCH (p:Player)-[:SUSTAINED]->(i:Injury)
WHERE i.status IN ['Recovering', 'Under Assessment']
RETURN p.pseudonymId AS Player, i.injuryType AS Injury, 
       i.injuryDate AS Date, i.status AS Status;

// --- Check injury status updates ---
MATCH (i:Injury)-[:HAS_UPDATE]->(s:StatusUpdate)
RETURN i.injuryId, i.injuryType, 
       s.updateDate, s.painLevel, s.functionalStatus
ORDER BY s.updateDate;

// --- Verify coach assignments ---
MATCH (c:Coach)-[:MANAGES]->(t:Team)
RETURN c.pseudonymId AS Coach, c.specialization AS Role, 
       collect(t.name) AS Teams;

// ============================================================================
// SUCCESS MESSAGE
// ============================================================================

RETURN "Sample data creation complete! " + 
       "Run the verification queries above to explore the data." AS message;

// ============================================================================
// WHAT'S BEEN CREATED:
// ============================================================================
// - 4 Sports (Soccer, GAA, Rugby, Athletics)
// - 3 Organizations (Galway United, ATU, FAI)
// - 4 Roles (Admin, Coach, Physio, Player)
// - 4 Teams (2 Galway United, 2 ATU)
// - 7 Players across teams
// - 3 Coaches with different specializations
// - 1 Admin
// - 3 Training Sessions
// - 3 Injuries with varying severities
// - 3 Status Updates tracking recovery
// - 3 Audit Log entries
// - All necessary relationships connecting the data
// ============================================================================

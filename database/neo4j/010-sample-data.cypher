// ============================================================================
// Comprehensive Sample Data
// ============================================================================
// Purpose:     Create sample sports, organizations, teams, players, coaches,
//              parents, sessions, injuries, and all relationships for dev/test
// Created:     2026
// Modified:    2026-03-09 (fixed Parent relationship ordering)
// Idempotent:  Yes (uses MERGE for uniquely-keyed nodes and key relationships)
// Environment: Dev/Test only
// Dependencies: 001-schema-setup.cypher, 004-add-parent-session-constraints.cypher
// Usage:       docker exec -i injury-surveillance-neo4j cypher-shell \
//                -u neo4j -p injury-surveillance-password -d neo4j \
//                < database/neo4j/010-sample-data.cypher
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
MERGE (soccer:Sport {sportId: 'SPORT-SOCCER-001'})
ON CREATE SET soccer.createdAt = datetime()
SET soccer += {
  name: 'Soccer',
  category: 'Team Sport',
  riskLevel: 'Medium',
  commonInjuries: ['Ankle Sprain', 'Hamstring Strain', 'ACL Tear', 'Groin Strain'],
  requiredEquipment: ['Boots', 'Shin Guards', 'Ball'],
  playerCount: 11,
  updatedAt: datetime()
};

MERGE (gaa:Sport {sportId: 'SPORT-GAA-001'})
ON CREATE SET gaa.createdAt = datetime()
SET gaa += {
  name: 'Gaelic Football',
  category: 'Team Sport',
  riskLevel: 'Medium-High',
  commonInjuries: ['Shoulder Injury', 'Ankle Sprain', 'Hamstring Strain', 'Concussion'],
  requiredEquipment: ['Boots', 'Helmet (optional)', 'Ball'],
  playerCount: 15,
  updatedAt: datetime()
};

MERGE (rugby:Sport {sportId: 'SPORT-RUGBY-001'})
ON CREATE SET rugby.createdAt = datetime()
SET rugby += {
  name: 'Rugby Union',
  category: 'Team Sport',
  riskLevel: 'High',
  commonInjuries: ['Concussion', 'Shoulder Dislocation', 'ACL Tear', 'Broken Bones'],
  requiredEquipment: ['Boots', 'Mouthguard', 'Scrum Cap', 'Ball'],
  playerCount: 15,
  updatedAt: datetime()
};

MERGE (athletics:Sport {sportId: 'SPORT-ATH-001'})
ON CREATE SET athletics.createdAt = datetime()
SET athletics += {
  name: 'Athletics',
  category: 'Individual Sport',
  riskLevel: 'Low-Medium',
  commonInjuries: ['Stress Fracture', 'Achilles Tendinitis', 'Shin Splints', 'Runner\'s Knee'],
  requiredEquipment: ['Running Shoes', 'Spikes (track)'],
  playerCount: 1,
  updatedAt: datetime()
};

// --- Create Organizations ---
MERGE (club1:Organization {orgId: 'ORG-GALWAY-FC-001'})
ON CREATE SET club1.createdAt = datetime()
SET club1 += {
  name: 'Galway United FC',
  type: 'Club',
  region: 'Connacht',
  country: 'Ireland',
  established: 1924,
  isActive: true,
  contactEmail: 'info@galwayunitedfc.ie',
  website: 'https://galwayunitedfc.ie',
  updatedAt: datetime()
};

MERGE (club2:Organization {orgId: 'ORG-ATU-001'})
ON CREATE SET club2.createdAt = datetime()
SET club2 += {
  name: 'Atlantic Technological University Sports',
  type: 'Academy',
  region: 'Connacht',
  country: 'Ireland',
  established: 2022,
  isActive: true,
  contactEmail: 'sports@atu.ie',
  website: 'https://atu.ie',
  updatedAt: datetime()
};

MERGE (fed1:Organization {orgId: 'ORG-FAI-001'})
ON CREATE SET fed1.createdAt = datetime()
SET fed1 += {
  name: 'Football Association of Ireland',
  type: 'Federation',
  region: 'National',
  country: 'Ireland',
  established: 1921,
  isActive: true,
  contactEmail: 'info@fai.ie',
  website: 'https://fai.ie',
  updatedAt: datetime()
};

// --- Create Roles ---
MERGE (adminRole:Role {name: 'System Administrator'})
ON CREATE SET adminRole.createdAt = datetime()
SET adminRole += {
  permissions: ['VIEW_ALL', 'EDIT_ALL', 'DELETE_ALL', 'MANAGE_USERS', 'VIEW_REPORTS'],
  description: 'Full system access'
};

MERGE (coachRole:Role {name: 'Head Coach'})
ON CREATE SET coachRole.createdAt = datetime()
SET coachRole += {
  permissions: ['VIEW_TEAM', 'VIEW_PLAYERS', 'VIEW_INJURIES', 'ADD_SESSIONS'],
  description: 'Team management and player viewing'
};

MERGE (physioRole:Role {name: 'Physiotherapist'})
ON CREATE SET physioRole.createdAt = datetime()
SET physioRole += {
  permissions: ['VIEW_INJURIES', 'EDIT_INJURIES', 'ADD_STATUS_UPDATES', 'VIEW_MEDICAL'],
  description: 'Medical staff with injury management access'
};

MERGE (playerRole:Role {name: 'Player'})
ON CREATE SET playerRole.createdAt = datetime()
SET playerRole += {
  permissions: ['VIEW_OWN', 'EDIT_OWN_STATUS', 'VIEW_OWN_INJURIES'],
  description: 'Limited access to own data'
};

:commit;

// ============================================================================
// PART 2: TEAMS
// ============================================================================

:begin;

// --- Create Teams ---
MERGE (team1:Team {teamId: 'TEAM-GU-U21-001'})
ON CREATE SET team1.createdAt = datetime()
SET team1 += {
  name: 'Galway United U21',
  ageGroup: 'U21',
  competitionLevel: 'Development',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 18:00', 'Wednesday 18:00', 'Friday 17:00'],
  homeVenue: 'Eamonn Deacy Park',
  updatedAt: datetime()
};

MERGE (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
ON CREATE SET team2.createdAt = datetime()
SET team2 += {
  name: 'Galway United Senior',
  ageGroup: 'Senior',
  competitionLevel: 'Professional',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 10:00', 'Tuesday 10:00', 'Wednesday 10:00', 'Thursday 10:00'],
  homeVenue: 'Eamonn Deacy Park',
  updatedAt: datetime()
};

MERGE (team3:Team {teamId: 'TEAM-ATU-SOCCER-001'})
ON CREATE SET team3.createdAt = datetime()
SET team3 += {
  name: 'ATU Soccer Team',
  ageGroup: 'U23',
  competitionLevel: 'College',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Tuesday 19:00', 'Thursday 19:00'],
  homeVenue: 'ATU Sports Grounds',
  updatedAt: datetime()
};

MERGE (team4:Team {teamId: 'TEAM-ATU-RUGBY-001'})
ON CREATE SET team4.createdAt = datetime()
SET team4 += {
  name: 'ATU Rugby Team',
  ageGroup: 'U23',
  competitionLevel: 'College',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 18:00', 'Wednesday 18:00'],
  homeVenue: 'ATU Rugby Pitch',
  updatedAt: datetime()
};

:commit;

// ============================================================================
// PART 3: STAFF (Coaches and Admins)
// ============================================================================

:begin;

// --- Create Coaches ---
MERGE (coach1:Coach {coachId: 'COACH-001'})
ON CREATE SET coach1.createdAt = datetime()
SET coach1 += {
  pseudonymId: 'PSY-COACH-8F2A9D1B',
  certifications: ['Chartered Physiotherapist', 'Sports Injury Specialist'],
  yearsExperience: 8,
  isActive: true,
  updatedAt: datetime()
};

MERGE (coach2:Coach {coachId: 'COACH-002'})
ON CREATE SET coach2.createdAt = datetime()
SET coach2 += {
  pseudonymId: 'PSY-COACH-3B7E4C9A',
  certifications: ['UEFA A License', 'Sports Science Degree'],
  yearsExperience: 12,
  isActive: true,
  updatedAt: datetime()
};

MERGE (coach3:Coach {coachId: 'COACH-003'})
ON CREATE SET coach3.createdAt = datetime()
SET coach3 += {
  pseudonymId: 'PSY-COACH-6D1F8E2C',
  certifications: ['CSCS', 'Exercise Science MSc'],
  yearsExperience: 6,
  isActive: true,
  updatedAt: datetime()
};

// --- Create Admin ---
MERGE (admin1:Admin {adminId: 'ADMIN-001'})
ON CREATE SET admin1.createdAt = datetime()
SET admin1 += {
  pseudonymId: 'PSY-ADMIN-9A3C5E7D',
  isActive: true,
  lastLogin: datetime(),
  updatedAt: datetime()
};

:commit;

// ============================================================================
// PART 4: PLAYERS
// ============================================================================

:begin;

// --- Create Players for U21 Team ---
MERGE (player1:Player {playerId: 'PLAYER-001'})
ON CREATE SET player1.createdAt = datetime()
SET player1 += {
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
  updatedAt: datetime()
};

MERGE (player2:Player {playerId: 'PLAYER-002'})
ON CREATE SET player2.createdAt = datetime()
SET player2 += {
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
  updatedAt: datetime()
};

MERGE (player3:Player {playerId: 'PLAYER-003'})
ON CREATE SET player3.createdAt = datetime()
SET player3 += {
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
  updatedAt: datetime()
};

MERGE (player4:Player {playerId: 'PLAYER-004'})
ON CREATE SET player4.createdAt = datetime()
SET player4 += {
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
  updatedAt: datetime()
};

MERGE (player5:Player {playerId: 'PLAYER-005'})
ON CREATE SET player5.createdAt = datetime()
SET player5 += {
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
  updatedAt: datetime()
};

// --- Create Players for Senior Team ---
MERGE (player6:Player {playerId: 'PLAYER-006'})
ON CREATE SET player6.createdAt = datetime()
SET player6 += {
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
  updatedAt: datetime()
};

MERGE (player7:Player {playerId: 'PLAYER-007'})
ON CREATE SET player7.createdAt = datetime()
SET player7 += {
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
  updatedAt: datetime()
};

:commit;

// ============================================================================
// PART 5: PARENTS (Guardians)
// ---------------------------------------------------------------------------
// Create sample Parent nodes and link them to players using :PARENT_OF
// ============================================================================

:begin;

// --- Create Parent Nodes ---
MERGE (parent1:Parent {parentId: 'PARENT-001'})
ON CREATE SET parent1.createdAt = datetime()
SET parent1 += {
  pseudonymId: 'PSY-PARENT-001',
  firstName: 'Mary',
  lastName: 'Murphy',
  email: 'mary.murphy@example.com',
  phone: '087-1234567',
  relationship: 'Mother',
  updatedAt: datetime()
};

MERGE (parent2:Parent {parentId: 'PARENT-002'})
ON CREATE SET parent2.createdAt = datetime()
SET parent2 += {
  pseudonymId: 'PSY-PARENT-002',
  firstName: 'John',
  lastName: 'O\'Connor',
  email: 'john.oconnor@example.com',
  phone: '087-7654321',
  relationship: 'Father',
  updatedAt: datetime()
};

// --- Additional Parents to mirror Postgres seed ---
MERGE (parent3:Parent {parentId: 'PARENT-003'})
ON CREATE SET
  parent3.pseudonymId = 'PSY-PARENT-003',
  parent3.firstName = 'Anne',
  parent3.lastName = 'Kelly',
  parent3.email = 'anne.kelly@example.com',
  parent3.phone = '085-7776666',
  parent3.relationship = 'Mother',
  parent3.createdAt = datetime(),
  parent3.updatedAt = datetime();

MERGE (parent4:Parent {parentId: 'PARENT-004'})
ON CREATE SET
  parent4.pseudonymId = 'PSY-PARENT-004',
  parent4.firstName = 'Patrick',
  parent4.lastName = 'Walsh',
  parent4.email = 'patrick.walsh@example.com',
  parent4.phone = '087-6665555',
  parent4.relationship = 'Father',
  parent4.createdAt = datetime(),
  parent4.updatedAt = datetime();

MERGE (parent5:Parent {parentId: 'PARENT-005'})
ON CREATE SET
  parent5.pseudonymId = 'PSY-PARENT-005',
  parent5.firstName = 'Siobhan',
  parent5.lastName = 'Ryan',
  parent5.email = 'siobhan.ryan@example.com',
  parent5.phone = '086-5554444',
  parent5.relationship = 'Mother',
  parent5.createdAt = datetime(),
  parent5.updatedAt = datetime();

MERGE (parent6:Parent {parentId: 'PARENT-006'})
ON CREATE SET
  parent6.pseudonymId = 'PSY-PARENT-006',
  parent6.firstName = 'Eileen',
  parent6.lastName = 'Brennan',
  parent6.email = 'eileen.brennan@example.com',
  parent6.phone = '085-4443333',
  parent6.relationship = 'Mother',
  parent6.createdAt = datetime(),
  parent6.updatedAt = datetime();

MERGE (parent7:Parent {parentId: 'PARENT-007'})
ON CREATE SET
  parent7.pseudonymId = 'PSY-PARENT-007',
  parent7.firstName = 'Michael',
  parent7.lastName = 'McCarthy',
  parent7.email = 'michael.mccarthy@example.com',
  parent7.phone = '087-3332222',
  parent7.relationship = 'Father',
  parent7.createdAt = datetime(),
  parent7.updatedAt = datetime();

:commit;

// ============================================================================
// PART 6: RELATIONSHIPS - Connect Everything
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
MERGE (team1)-[:BELONGS_TO]->(club1)
MERGE (team2)-[:BELONGS_TO]->(club1)
MERGE (team3)-[:BELONGS_TO]->(club2)
MERGE (team4)-[:BELONGS_TO]->(club2)
MERGE (team1)-[:PLAYS]->(soccer)
MERGE (team2)-[:PLAYS]->(soccer)
MERGE (team3)-[:PLAYS]->(soccer)
MERGE (team4)-[:PLAYS]->(rugby);

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
MERGE (p1)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Forward', isActive: true}]->(team1)
MERGE (p2)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Midfielder', isActive: true}]->(team1)
MERGE (p3)-[:PLAYS_FOR {joinedDate: date('2024-02-01'), position: 'Defender', isActive: true}]->(team1)
MERGE (p4)-[:PLAYS_FOR {joinedDate: date('2023-09-01'), position: 'Goalkeeper', isActive: true}]->(team1)
MERGE (p5)-[:PLAYS_FOR {joinedDate: date('2024-01-15'), position: 'Midfielder', isActive: true}]->(team1)
MERGE (p6)-[:PLAYS_FOR {joinedDate: date('2022-07-01'), position: 'Forward', isActive: true}]->(team2)
MERGE (p7)-[:PLAYS_FOR {joinedDate: date('2021-01-15'), position: 'Defender', isActive: true}]->(team2);

// --- Coach-Team Relationships ---
MATCH (coach1:Coach {coachId: 'COACH-001'})
MATCH (coach2:Coach {coachId: 'COACH-002'})
MATCH (coach3:Coach {coachId: 'COACH-003'})
MATCH (team1:Team {teamId: 'TEAM-GU-U21-001'})
MATCH (team2:Team {teamId: 'TEAM-GU-SENIOR-001'})
MERGE (coach1)-[:MANAGES {role: 'Physiotherapist', startDate: date('2023-08-01')}]->(team1)
MERGE (coach1)-[:MANAGES {role: 'Physiotherapist', startDate: date('2023-08-01')}]->(team2)
MERGE (coach2)-[:MANAGES {role: 'Head Coach', startDate: date('2023-06-01')}]->(team2)
MERGE (coach3)-[:MANAGES {role: 'Strength Coach', startDate: date('2024-01-01')}]->(team1);

// --- Role Assignments ---
MATCH (admin1:Admin {adminId: 'ADMIN-001'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
MATCH (coach2:Coach {coachId: 'COACH-002'})
MATCH (adminRole:Role {name: 'System Administrator'})
MATCH (physioRole:Role {name: 'Physiotherapist'})
MATCH (coachRole:Role {name: 'Head Coach'})
MERGE (admin1)-[:HAS_ROLE {assignedDate: date('2024-01-01')}]->(adminRole)
MERGE (coach1)-[:HAS_ROLE {assignedDate: date('2023-08-01')}]->(physioRole)
MERGE (coach2)-[:HAS_ROLE {assignedDate: date('2023-06-01')}]->(coachRole);

// --- Parent-Player Relationships ---
MATCH (parent1:Parent {parentId: 'PARENT-001'})
MATCH (parent2:Parent {parentId: 'PARENT-002'})
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MERGE (parent1)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(p1)
MERGE (parent2)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(p2);

// --- Link remaining parents to players (idempotent) ---
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
MATCH (p4:Player {playerId: 'PLAYER-004'})
MATCH (p5:Player {playerId: 'PLAYER-005'})
MATCH (p6:Player {playerId: 'PLAYER-006'})
MATCH (p7:Player {playerId: 'PLAYER-007'})
MATCH (parent1:Parent {parentId: 'PARENT-001'})
MATCH (parent2:Parent {parentId: 'PARENT-002'})
MATCH (parent3:Parent {parentId: 'PARENT-003'})
MATCH (parent4:Parent {parentId: 'PARENT-004'})
MATCH (parent5:Parent {parentId: 'PARENT-005'})
MATCH (parent6:Parent {parentId: 'PARENT-006'})
MATCH (parent7:Parent {parentId: 'PARENT-007'})
MERGE (parent1)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(p1)
MERGE (parent2)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(p2)
MERGE (parent3)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(p3)
MERGE (parent4)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(p4)
MERGE (parent5)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(p5)
MERGE (parent6)-[:PARENT_OF {relationship: 'Mother', isPrimaryContact: true, consentGiven: true}]->(p6)
MERGE (parent7)-[:PARENT_OF {relationship: 'Father', isPrimaryContact: true, consentGiven: true}]->(p7);

:commit;

// ============================================================================
// PART 6: TRAINING SESSIONS
// ============================================================================

:begin;

// --- Create Training Sessions ---
MERGE (session1:Session {sessionId: 'SESSION-001'})
ON CREATE SET session1.createdAt = datetime()
SET session1 += {
  sessionType: 'Training',
  sessionDate: date('2025-01-06'),
  duration: 90,
  intensity: 'High',
  location: 'Eamonn Deacy Park',
  weatherConditions: 'Clear, 8°C',
  attendance: 18,
  notes: 'Focus on attacking drills and set pieces',
  updatedAt: datetime()
};

MERGE (session2:Session {sessionId: 'SESSION-002'})
ON CREATE SET session2.createdAt = datetime()
SET session2 += {
  sessionType: 'Match',
  sessionDate: date('2025-01-03'),
  duration: 90,
  intensity: 'Very High',
  location: 'Away - Cork City',
  weatherConditions: 'Rainy, 6°C',
  attendance: 16,
  notes: 'League match - Won 2-1',
  updatedAt: datetime()
};

MERGE (session3:Session {sessionId: 'SESSION-003'})
ON CREATE SET session3.createdAt = datetime()
SET session3 += {
  sessionType: 'Recovery',
  sessionDate: date('2025-01-04'),
  duration: 60,
  intensity: 'Low',
  location: 'Indoor Facility',
  weatherConditions: 'N/A - Indoor',
  attendance: 20,
  notes: 'Light recovery session post-match',
  updatedAt: datetime()
};

// --- Link Sessions to Player Schedules ---
MATCH (session1:Session {sessionId: 'SESSION-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
MATCH (session3:Session {sessionId: 'SESSION-003'})
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
MERGE (p1)-[:OWNS_SESSION]->(session1)
MERGE (p1)-[:OWNS_SESSION]->(session2)
MERGE (p3)-[:OWNS_SESSION]->(session3);

:commit;

// ============================================================================
// PART 7: INJURIES AND STATUS UPDATES
// ============================================================================

:begin;

// --- Create Injuries ---
MERGE (injury1:Injury {injuryId: 'INJ-2025-001'})
ON CREATE SET injury1.createdAt = datetime()
SET injury1 += {
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
  updatedAt: datetime()
};

MERGE (injury2:Injury {injuryId: 'INJ-2024-045'})
ON CREATE SET injury2.createdAt = datetime()
SET injury2 += {
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
  updatedAt: datetime()
};

MERGE (injury3:Injury {injuryId: 'INJ-2025-002'})
ON CREATE SET injury3.createdAt = datetime()
SET injury3 += {
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
  updatedAt: datetime()
};

// --- Link Injuries to Players ---
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury2:Injury {injuryId: 'INJ-2024-045'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
MATCH (p1:Player {playerId: 'PLAYER-001'})
MATCH (p2:Player {playerId: 'PLAYER-002'})
MATCH (p3:Player {playerId: 'PLAYER-003'})
MERGE (p1)-[:SUSTAINED]->(injury1)
MERGE (p2)-[:SUSTAINED]->(injury2)
MERGE (p3)-[:SUSTAINED]->(injury3);

// --- Link Injuries to Sessions (where applicable) ---
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (session2:Session {sessionId: 'SESSION-002'})
MERGE (injury1)-[:OCCURRED_DURING]->(session2);

// --- Create Status Updates ---
MERGE (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
ON CREATE SET status1.createdAt = datetime()
SET status1 += {
  updateDate: date('2025-01-04'),
  painLevel: 6,
  swelling: 'Moderate',
  rangeOfMotion: 40,
  functionalStatus: 'Limited weight bearing',
  treatment: 'RICE protocol, anti-inflammatories',
  nextSteps: 'Reassess in 3 days',
  canTrain: false,
  canCompete: false,
  notes: 'Significant swelling present, started physio'
};

MERGE (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
ON CREATE SET status2.createdAt = datetime()
SET status2 += {
  updateDate: date('2025-01-07'),
  painLevel: 4,
  swelling: 'Mild',
  rangeOfMotion: 65,
  functionalStatus: 'Walking without crutches',
  treatment: 'Physiotherapy, strengthening exercises',
  nextSteps: 'Progress to proprioception training',
  canTrain: false,
  canCompete: false,
  notes: 'Good progress, swelling reducing'
};

MERGE (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
ON CREATE SET status3.createdAt = datetime()
SET status3 += {
  updateDate: date('2024-12-29'),
  painLevel: 7,
  swelling: 'N/A',
  rangeOfMotion: null,
  functionalStatus: 'Headaches, sensitivity to light',
  treatment: 'Rest, no screen time',
  nextSteps: 'Follow concussion protocol stage 1',
  canTrain: false,
  canCompete: false,
  notes: 'Baseline cognitive assessment completed'
};

// --- Link Status Updates to Injuries ---
MATCH (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
MATCH (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
MATCH (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
MATCH (injury1:Injury {injuryId: 'INJ-2025-001'})
MATCH (injury3:Injury {injuryId: 'INJ-2025-002'})
MERGE (injury1)-[:HAS_UPDATE]->(status1)
MERGE (injury1)-[:HAS_UPDATE]->(status2)
MERGE (injury3)-[:HAS_UPDATE]->(status3);

// --- Link Status Updates to Coaches (who created them) ---
MATCH (status1:StatusUpdate {statusUpdateId: 'STATUS-001'})
MATCH (status2:StatusUpdate {statusUpdateId: 'STATUS-002'})
MATCH (status3:StatusUpdate {statusUpdateId: 'STATUS-003'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
MERGE (coach1)-[:CREATED_UPDATE]->(status1)
MERGE (coach1)-[:CREATED_UPDATE]->(status2)
MERGE (coach1)-[:CREATED_UPDATE]->(status3);

:commit;

// ============================================================================
// PART 8: AUDIT LOGS
// ============================================================================

:begin;

// --- Create Audit Logs ---
MERGE (audit1:AuditLog {auditId: 'AUDIT-001'})
ON CREATE SET audit1.createdAt = datetime()
SET audit1 += {
  timestamp: datetime('2025-01-03T15:30:00Z'),
  action: 'CREATE',
  entityType: 'Injury',
  entityId: 'INJ-2025-001',
  changes: 'Created new injury record',
  ipAddress: '10.0.0.15',
  userAgent: 'Mobile App v1.0'
};

MERGE (audit2:AuditLog {auditId: 'AUDIT-002'})
ON CREATE SET audit2.createdAt = datetime()
SET audit2 += {
  timestamp: datetime('2025-01-04T09:15:00Z'),
  action: 'CREATE',
  entityType: 'StatusUpdate',
  entityId: 'STATUS-001',
  changes: 'Added status update for INJ-2025-001',
  ipAddress: '10.0.0.20',
  userAgent: 'Web Dashboard v1.0'
};

MERGE (audit3:AuditLog {auditId: 'AUDIT-003'})
ON CREATE SET audit3.createdAt = datetime()
SET audit3 += {
  timestamp: datetime('2025-01-07T10:00:00Z'),
  action: 'UPDATE',
  entityType: 'StatusUpdate',
  entityId: 'STATUS-002',
  changes: 'Added follow-up status update',
  ipAddress: '10.0.0.20',
  userAgent: 'Web Dashboard v1.0'
};

// --- Link Audit Logs to Users ---
MATCH (audit1:AuditLog {auditId: 'AUDIT-001'})
MATCH (audit2:AuditLog {auditId: 'AUDIT-002'})
MATCH (audit3:AuditLog {auditId: 'AUDIT-003'})
MATCH (coach1:Coach {coachId: 'COACH-001'})
MERGE (coach1)-[:PERFORMED]->(audit1)
MERGE (coach1)-[:PERFORMED]->(audit2)
MERGE (coach1)-[:PERFORMED]->(audit3);

:commit;

// ============================================================================
// PART 9: DEDUPE RELATIONSHIPS (cleanup for prior CREATE-based runs)
// ============================================================================

:begin;

// --- Remove duplicate MANAGES relationships ---
MATCH (c:Coach)-[r:MANAGES]->(t:Team)
WITH c, t, r.role AS role, r.startDate AS startDate, collect(r) AS rels
WHERE size(rels) > 1
FOREACH (rel IN tail(rels) | DELETE rel);

// --- Remove duplicate HAS_ROLE relationships ---
MATCH (a:Admin)-[r:HAS_ROLE]->(role:Role)
WITH a, role, r.assignedDate AS assignedDate, collect(r) AS rels
WHERE size(rels) > 1
FOREACH (rel IN tail(rels) | DELETE rel);

MATCH (c:Coach)-[r:HAS_ROLE]->(role:Role)
WITH c, role, r.assignedDate AS assignedDate, collect(r) AS rels
WHERE size(rels) > 1
FOREACH (rel IN tail(rels) | DELETE rel);

// --- Remove duplicate PARENT_OF relationships ---
MATCH (p:Parent)-[r:PARENT_OF]->(pl:Player)
WITH p, pl,
  r.relationship AS relationship,
  r.isPrimaryContact AS isPrimaryContact,
  r.consentGiven AS consentGiven,
  collect(r) AS rels
WHERE size(rels) > 1
FOREACH (rel IN tail(rels) | DELETE rel);

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
RETURN c.pseudonymId AS Coach, 
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
// - 3 Coaches
// - 1 Admin
// - 3 Training Sessions
// - 3 Injuries with varying severities
// - 3 Status Updates tracking recovery
// - 3 Audit Log entries
// - All necessary relationships connecting the data
// ============================================================================

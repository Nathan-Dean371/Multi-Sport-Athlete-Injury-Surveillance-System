// ============================================================================
// PART 1: CORE REFERENCE DATA - Sports & Organizations
// ============================================================================

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

CREATE (role1:Role { name: 'Admin', permissions: ['all'], createdAt: datetime() });
CREATE (role2:Role { name: 'Coach', permissions: ['view_team', 'manage_injuries'], createdAt: datetime() });
CREATE (role3:Role { name: 'Physio', permissions: ['view_injuries', 'update_status'], createdAt: datetime() });
CREATE (role4:Role { name: 'Player', permissions: ['view_own', 'update_own_status'], createdAt: datetime() });

// ============================================================================
// PART 2: TEAMS
// ============================================================================

CREATE (team1:Team {
  teamId: 'TEAM-GU-U21-001',
  name: 'Galway United U21',
  ageGroup: 'U21',
  competitionLevel: 'League',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Tuesday 19:00', 'Thursday 19:00'],
  homeVenue: 'Eamonn Deacy Park',
  createdAt: datetime(),
  updatedAt: datetime()
});

CREATE (team2:Team {
  teamId: 'TEAM-GU-SENIOR-001',
  name: 'Galway United Senior',
  ageGroup: 'Senior',
  competitionLevel: 'League of Ireland',
  season: '2025',
  isActive: true,
  trainingSchedule: ['Monday 10:00', 'Wednesday 10:00', 'Friday 10:00'],
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
  trainingSchedule: ['Wednesday 17:00', 'Friday 17:00'],
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

// ============================================================================
// PART 3: STAFF
// ============================================================================

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

CREATE (admin1:Admin {
  adminId: 'ADMIN-001',
  pseudonymId: 'PSY-ADMIN-9A3C5E7D',
  isActive: true,
  lastLogin: datetime(),
  createdAt: datetime(),
  updatedAt: datetime()
});

// ============================================================================
// PART 4: PLAYERS
// ============================================================================

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

export interface User {
  id: string;
  email: string;
  identityType: 'player' | 'coach' | 'medical_staff' | 'admin';
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Player {
  playerId: string;
  position: string;
  ageGroup: string;
  isActive: boolean;
  teamId: string;
  teamName: string;
}

export interface Injury {
  injuryId: string;
  injuryType: string;
  bodyPart: string;
  side: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  status: 'Active' | 'Recovering' | 'Recovered';
  injuryDate: string;
  expectedReturnDate?: string;
  mechanism: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  player: {
    playerId: string;
    diagnosedDate: string;
    reportedBy: string;
  };
  statusUpdates: StatusUpdate[];
}

export interface StatusUpdate {
  updateId: string;
  status: string;
  notes: string;
  recordedAt: string;
  recordedBy: string;
}

export interface CreateInjuryDto {
  playerId: string;
  injuryType: string;
  bodyPart: string;
  side: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical';
  injuryDate: string;
  expectedReturnDate?: string;
  mechanism: string;
  diagnosis: string;
  treatmentPlan: string;
  notes: string;
}

export interface UpdateInjuryDto {
  status?: 'Active' | 'Recovering' | 'Recovered';
  statusNote?: string;
}
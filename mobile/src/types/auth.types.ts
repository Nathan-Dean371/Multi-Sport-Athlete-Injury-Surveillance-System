export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'player' | 'coach';
  // Add other fields as needed
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'player' | 'coach' | 'admin';
  playerId?: string; // For players
  coachId?: string; // For coaches
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  identityType: 'player' | 'coach' | 'admin';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  identityType: 'player' | 'coach' | 'admin';
  pseudonymId: string;
}

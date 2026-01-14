export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  identityType: 'player' | 'coach' | 'admin';
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    identityType: string;
    pseudonymId: string;
  };
}

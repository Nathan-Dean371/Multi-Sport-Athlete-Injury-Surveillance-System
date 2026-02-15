/**
 * Shared TypeScript types for authentication and authorization
 * Used across mobile, web, and backend applications
 */

// ===========================
// Enums
// ===========================

export enum IdentityType {
  PLAYER = 'player',
  COACH = 'coach',
  ADMIN = 'admin',
}

// ===========================
// Auth DTOs
// ===========================

/**
 * Login credentials
 */
export interface LoginDto {
  username: string;
  password: string;
}

/**
 * Login response with JWT token
 */
export interface LoginResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserDto;
}

/**
 * User information
 */
export interface UserDto {
  userId: string;
  username: string;
  identityType: IdentityType | string;
  pseudonym: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  active: boolean;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  sub: string; // user ID
  username: string;
  identityType: IdentityType | string;
  pseudonym: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  username: string;
  password: string;
  identityType: IdentityType | string;
  pseudonym: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  active?: boolean;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

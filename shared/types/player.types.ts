/**
 * Shared TypeScript types for player management
 * Used across mobile, web, and backend applications
 */

// ===========================
// Enums
// ===========================

export enum PlayerStatus {
  GREEN = 'GREEN',
  ORANGE = 'ORANGE',
  RED = 'RED',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

// ===========================
// Player DTOs
// ===========================

/**
 * Basic player information
 */
export interface PlayerDto {
  playerId: string;
  pseudonymId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO 8601 date string
  gender?: Gender | string;
  position?: string;
  jerseyNumber?: string;
  currentStatus?: PlayerStatus;
  activeInjuryCount?: number;
}

/**
 * Detailed player information
 */
export interface PlayerDetailDto extends PlayerDto {
  teamId?: string;
  teamName?: string;
  sport?: string;
  height?: number; // cm
  weight?: number; // kg
  dominantSide?: 'Left' | 'Right' | 'Both';
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
}

/**
 * Roster player information (team context)
 */
export interface RosterPlayerDto {
  playerId: string;
  pseudonymId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  position: string;
  currentStatus?: PlayerStatus;
  activeInjuryCount: number;
  dateOfBirth?: string;
  gender?: Gender | string;
}

/**
 * Create player DTO
 */
export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO 8601 date string
  gender?: Gender | string;
  position?: string;
  jerseyNumber?: string;
  height?: number; // cm
  weight?: number; // kg
  dominantSide?: 'Left' | 'Right' | 'Both';
}

/**
 * Update player DTO
 */
export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  position?: string;
  jerseyNumber?: string;
  height?: number; // cm
  weight?: number; // kg
  dominantSide?: 'Left' | 'Right' | 'Both';
}

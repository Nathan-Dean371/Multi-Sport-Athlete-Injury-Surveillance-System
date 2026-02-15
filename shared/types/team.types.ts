/**
 * Shared TypeScript types for team management
 * Used across mobile, web, and backend applications
 */

import { RosterPlayerDto } from './player.types';

// ===========================
// Team DTOs
// ===========================

/**
 * Basic team information
 */
export interface TeamDto {
  teamId: string;
  name: string;
  sport: string;
  ageGroup?: string;
  gender?: string;
  season?: string;
  active: boolean;
}

/**
 * Detailed team information
 */
export interface TeamDetailsDto extends TeamDto {
  playerCount: number;
  activeInjuryCount?: number;
  coachCount?: number;
  createdAt?: string; // ISO 8601 timestamp
  updatedAt?: string; // ISO 8601 timestamp
}

/**
 * Team roster with players
 */
export interface TeamRosterDto {
  teamId: string;
  teamName: string;
  sport: string;
  players: RosterPlayerDto[];
  totalPlayers: number;
}

/**
 * Create team DTO
 */
export interface CreateTeamDto {
  name: string;
  sport: string;
  ageGroup?: string;
  gender?: string;
  season?: string;
}

/**
 * Update team DTO
 */
export interface UpdateTeamDto {
  name?: string;
  sport?: string;
  ageGroup?: string;
  gender?: string;
  season?: string;
  active?: boolean;
}

/**
 * Team statistics
 */
export interface TeamStatsDto {
  teamId: string;
  teamName: string;
  totalPlayers: number;
  activeInjuries: number;
  totalInjuries: number;
  playersGreen: number;
  playersOrange: number;
  playersRed: number;
}

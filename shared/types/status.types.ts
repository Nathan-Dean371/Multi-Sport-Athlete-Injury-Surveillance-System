/**
 * Shared TypeScript types for player status management
 * Used across mobile, web, and backend applications
 */

import { PlayerStatus } from './player.types';

// ===========================
// Status DTOs
// ===========================

/**
 * Create status update DTO
 */
export interface CreateStatusDto {
  status: PlayerStatus;
  notes?: string;
  recordedAt?: string; // ISO 8601 timestamp
}

/**
 * Status history entry
 */
export interface StatusHistoryDto {
  statusId: string;
  playerId: string;
  status: PlayerStatus;
  notes?: string;
  recordedAt: string; // ISO 8601 timestamp
  recordedBy?: string;
}

/**
 * Player status with history
 */
export interface PlayerStatusDto {
  playerId: string;
  currentStatus: PlayerStatus;
  lastUpdated: string; // ISO 8601 timestamp
  history: StatusHistoryDto[];
}

/**
 * Query status history parameters
 */
export interface QueryStatusHistoryDto {
  playerId?: string;
  status?: PlayerStatus;
  fromDate?: string; // ISO 8601 date string
  toDate?: string; // ISO 8601 date string
  limit?: number;
  offset?: number;
}

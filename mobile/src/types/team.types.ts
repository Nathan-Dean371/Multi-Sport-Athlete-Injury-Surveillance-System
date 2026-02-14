import { PlayerStatus } from './status.types';

export interface Team {
  teamId: string;
  name: string;
  sport: string;
  season?: string;
  isActive: boolean;
}

export interface RosterPlayerDto {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: string;
  currentStatus?: PlayerStatus;
  statusNotes?: string;
  activeInjuryCount: number;
  lastStatusUpdate?: string;
}

export interface TeamRosterDto {
  teamId: string;
  teamName: string;
  sport: string;
  players: RosterPlayerDto[];
  totalPlayers: number;
  playersReportedToday: number;
  retrievedAt: string;
}

export interface CoachDto {
  coachId: string;
  pseudonymId: string;
  specialization?: string;
}

export interface TeamDetailsDto {
  teamId: string;
  name: string;
  sport: string;
  ageGroup?: string;
  gender?: string;
  organizationId: string;
  organizationName: string;
  coaches: CoachDto[];
  playerCount: number;
  seasonStart?: string;
  seasonEnd?: string;
}

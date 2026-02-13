export enum PlayerStatus {
  GREEN = 'GREEN',
  ORANGE = 'ORANGE',
  RED = 'RED',
  UNKNOWN = 'UNKNOWN',
}

export interface UpdateStatusDto {
  status: PlayerStatus;
  notes?: string;
}

export interface StatusUpdate {
  id: string;
  status: PlayerStatus;
  date: string;
  timestamp: string;
  notes?: string;
}

export interface PlayerStatusDto {
  playerId: string;
  firstName: string;
  lastName: string;
  currentStatus: PlayerStatus;
  statusNotes?: string;
  lastUpdated: string;
  activeInjuryCount: number;
}

export interface LatestStatusResponseDto {
  teams: TeamStatusDto[];
  lastUpdated: string;
}

export interface TeamStatusDto {
  teamId: string;
  teamName: string;
  sport: string;
  players: PlayerStatusDto[];
  statusCounts: {
    green: number;
    orange: number;
    red: number;
    noStatus: number;
  };
}

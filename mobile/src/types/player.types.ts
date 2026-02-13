export interface Player {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: string;
  dateOfBirth?: string;
  ageGroup?: string;
  isActive: boolean;
  teamId?: string;
  teamName?: string;
  sport?: string;
}

export interface PlayerDto {
  playerId: string;
  name: string;
  position: string;
  jerseyNumber: string;
  ageGroup?: string;
  isActive: boolean;
  team?: {
    teamId: string;
    teamName: string;
    sport: string;
  };
}

export interface PlayerListDto {
  players: PlayerDto[];
  total: number;
}

import { ApiProperty } from "@nestjs/swagger";

export interface PlayerAdminDto {
  playerId: string;
  pseudonymId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: string;
  position: string | null;
  teamName: string | null;
  injuryCount: number;
  isActive: boolean;
}

export class PlayerAdminListDto {
  @ApiProperty({
    type: [Object],
    description: "List of players with their identity details",
  })
  players: PlayerAdminDto[];

  @ApiProperty({ description: "Total number of players" })
  total: number;
}

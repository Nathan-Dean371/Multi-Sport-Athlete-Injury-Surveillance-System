import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerStatus } from './update-status.dto';

export class PlayerStatusDto {
  @ApiProperty({ example: 'PLAYER-001' })
  playerId: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: PlayerStatus, example: PlayerStatus.GREEN })
  currentStatus: PlayerStatus;

  @ApiPropertyOptional({ example: 'Feeling good today' })
  statusNotes?: string;

  @ApiProperty({ example: '2026-01-14' })
  lastUpdated: string;

  @ApiProperty({ example: 2 })
  activeInjuryCount: number;
}

export class TeamStatusDto {
  @ApiProperty({ example: 'TEAM-001' })
  teamId: string;

  @ApiProperty({ example: 'Senior Gaelic Football' })
  teamName: string;

  @ApiProperty({ example: 'Gaelic Football' })
  sport: string;

  @ApiProperty({ type: [PlayerStatusDto] })
  players: PlayerStatusDto[];

  @ApiProperty({ example: 15 })
  totalPlayers: number;

  @ApiProperty({ example: 10 })
  greenCount: number;

  @ApiProperty({ example: 3 })
  orangeCount: number;

  @ApiProperty({ example: 2 })
  redCount: number;
}

export class LatestStatusResponseDto {
  @ApiProperty({ type: [TeamStatusDto] })
  teams: TeamStatusDto[];

  @ApiProperty({ example: '2026-01-14T10:30:00Z' })
  retrievedAt: string;
}

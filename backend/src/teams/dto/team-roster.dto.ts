import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerStatus } from '../../status/dto/update-status.dto';

export class RosterPlayerDto {
  @ApiProperty({ example: 'PLAYER-001', description: 'Player unique identifier' })
  playerId: string;

  @ApiProperty({ example: 'PSY-PLAYER-A1B2C3D4', description: 'Player pseudonym identifier for privacy' })
  pseudonymId: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'Forward' })
  position: string;

  @ApiProperty({ example: '23' })
  jerseyNumber: string;

  @ApiPropertyOptional({ 
    enum: PlayerStatus, 
    example: PlayerStatus.GREEN,
    description: 'Current daily status (if updated today)'
  })
  currentStatus?: PlayerStatus;

  @ApiPropertyOptional({ 
    example: 'Feeling great, ready to play',
    description: 'Status notes from today'
  })
  statusNotes?: string;

  @ApiProperty({ 
    example: 0,
    description: 'Number of active (unresolved) injuries'
  })
  activeInjuryCount: number;

  @ApiPropertyOptional({ 
    example: '2026-01-14',
    description: 'Date of last status update'
  })
  lastStatusUpdate?: string;
}

export class TeamRosterDto {
  @ApiProperty({ example: 'TEAM-001' })
  teamId: string;

  @ApiProperty({ example: 'Senior Gaelic Football' })
  teamName: string;

  @ApiProperty({ example: 'Gaelic Football' })
  sport: string;

  @ApiProperty({ type: [RosterPlayerDto] })
  players: RosterPlayerDto[];

  @ApiProperty({ example: 25 })
  totalPlayers: number;

  @ApiProperty({ 
    example: 18,
    description: 'Players who updated status today'
  })
  playersReportedToday: number;

  @ApiProperty({ example: '2026-01-14T10:30:00Z' })
  retrievedAt: string;
}

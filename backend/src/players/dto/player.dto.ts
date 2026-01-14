import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayerDto {
  @ApiProperty({ example: 'PLAYER-001', description: 'Player pseudonym identifier' })
  playerId: string;
  
  @ApiPropertyOptional({ example: 'John Smith', description: 'Player name (if available)' })
  name?: string;
  
  @ApiPropertyOptional({ example: 'Forward', description: 'Player position' })
  position?: string;
  
  @ApiPropertyOptional({ example: '1995-06-15', description: 'Date of birth' })
  dateOfBirth?: string;
  
  @ApiPropertyOptional({ example: 'U23', description: 'Age group' })
  ageGroup?: string;
  
  @ApiProperty({ example: true, description: 'Whether the player is currently active' })
  isActive: boolean;
  
  @ApiPropertyOptional({ example: 'TEAM-001', description: 'Team identifier' })
  teamId?: string;
  
  @ApiPropertyOptional({ example: 'Red Devils', description: 'Team name' })
  teamName?: string;
}

export class PlayerListDto {
  @ApiProperty({ type: [PlayerDto], description: 'Array of player objects' })
  players: PlayerDto[];
  
  @ApiProperty({ example: 25, description: 'Total number of players' })
  total: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PlayerStatus {
  GREEN = 'GREEN',   // Fully fit, ready to train/compete
  ORANGE = 'ORANGE', // Managing minor issue, can train with modifications
  RED = 'RED'        // Injured, cannot train
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: PlayerStatus,
    description: 'Player daily status indicator',
    example: PlayerStatus.GREEN,
  })
  @IsEnum(PlayerStatus)
  status: PlayerStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about current condition',
    example: 'Feeling good, slight tightness in hamstring but manageable',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  // NOTE: Keep structure simple for MVP, but design allows future expansion:
  // Future fields could include: painLevel, sleepQuality, fatigueLevel, etc.
}

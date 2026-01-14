import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InjuryDto {
  @ApiProperty({ example: 'INJ-2024-001', description: 'Unique injury identifier' })
  injuryId: string;
  
  @ApiProperty({ example: 'Hamstring Strain', description: 'Type of injury' })
  injuryType: string;
  
  @ApiProperty({ example: 'Hamstring', description: 'Body part affected' })
  bodyPart: string;
  
  @ApiPropertyOptional({ example: 'Left', description: 'Side of the body' })
  side?: string;
  
  @ApiProperty({ example: 'Moderate', description: 'Severity of the injury' })
  severity: string;
  
  @ApiProperty({ example: 'Recovering', description: 'Current status of the injury' })
  status: string;
  
  @ApiProperty({ example: '2024-01-10T00:00:00.000Z', description: 'Date when the injury occurred' })
  injuryDate: string;
  
  @ApiPropertyOptional({ example: '2024-02-15T00:00:00.000Z', description: 'Expected return date' })
  expectedReturnDate?: string;
  
  @ApiPropertyOptional({ example: '2024-02-10T00:00:00.000Z', description: 'Actual return date' })
  actualReturnDate?: string;
  
  @ApiPropertyOptional({ example: 'Overuse', description: 'Mechanism of injury' })
  mechanism?: string;
  
  @ApiPropertyOptional({ example: 'Grade 2 hamstring strain', description: 'Medical diagnosis' })
  diagnosis?: string;
  
  @ApiPropertyOptional({ example: 'RICE protocol, physical therapy', description: 'Treatment plan' })
  treatmentPlan?: string;
  
  @ApiPropertyOptional({ example: 'Player showing good progress', description: 'Additional notes' })
  notes?: string;
  
  @ApiPropertyOptional({ example: '2024-01-10T10:30:00.000Z', description: 'Date when injury was diagnosed' })
  diagnosedDate?: string;
  
  @ApiPropertyOptional({ example: 'COACH-001', description: 'Who reported the injury' })
  reportedBy?: string;
}

export class PlayerInjuriesDto {
  @ApiProperty({ example: 'PLAYER-001', description: 'Player pseudonym identifier' })
  playerId: string;
  
  @ApiPropertyOptional({ example: 'John Smith', description: 'Player name (if available)' })
  playerName?: string;
  
  @ApiProperty({ type: [InjuryDto], description: 'Array of injury objects' })
  injuries: InjuryDto[];
  
  @ApiProperty({ example: 5, description: 'Total number of injuries' })
  total: number;
}

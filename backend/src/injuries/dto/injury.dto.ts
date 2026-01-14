import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InjurySeverity {
  Minor = 'Minor',
  Moderate = 'Moderate',
  Severe = 'Severe',
  Critical = 'Critical',
}

export enum InjuryStatus {
  Active = 'Active',
  Recovering = 'Recovering',
  Recovered = 'Recovered',
  Chronic = 'Chronic',
  ReInjured = 'Re-injured',
}

export class CreateInjuryDto {
  @ApiProperty({ example: 'PLAYER-001', description: 'Pseudonym of the player' })
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({ example: 'Hamstring Strain', description: 'Type of injury' })
  @IsString()
  @IsNotEmpty()
  injuryType: string;

  @ApiProperty({ example: 'Hamstring', description: 'Body part affected' })
  @IsString()
  @IsNotEmpty()
  bodyPart: string;

  @ApiPropertyOptional({ example: 'Left', description: 'Side of the body (Left, Right, Both)', enum: ['Left', 'Right', 'Both'] })
  @IsString()
  @IsOptional()
  side?: string;

  @ApiProperty({ example: 'Moderate', description: 'Severity of the injury', enum: InjurySeverity })
  @IsEnum(InjurySeverity)
  @IsNotEmpty()
  severity: string;

  @ApiProperty({ example: '2024-01-10T00:00:00.000Z', description: 'Date when the injury occurred (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  injuryDate: string;

  @ApiPropertyOptional({ example: '2024-02-15T00:00:00.000Z', description: 'Expected return date (ISO 8601)' })
  @IsString()
  @IsOptional()
  expectedReturnDate?: string;

  @ApiPropertyOptional({ example: 'Overuse', description: 'Mechanism of injury', enum: ['Contact', 'Overuse', 'Acute'] })
  @IsString()
  @IsOptional()
  mechanism?: string;

  @ApiPropertyOptional({ example: 'Grade 2 hamstring strain', description: 'Medical diagnosis' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'RICE protocol, physical therapy 3x/week', description: 'Treatment plan' })
  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @ApiPropertyOptional({ example: 'Player reported pain during sprint training', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInjuryDto {
  @ApiPropertyOptional({ 
    example: 'Recovering', 
    description: 'Current status of the injury', 
    enum: InjuryStatus 
  })
  @IsEnum(InjuryStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Patient showing good progress', description: 'Status update note' })
  @IsString()
  @IsOptional()
  statusNote?: string;

  @ApiPropertyOptional({ example: '2024-02-20T00:00:00.000Z', description: 'Updated expected return date (ISO 8601)' })
  @IsString()
  @IsOptional()
  expectedReturnDate?: string;

  @ApiPropertyOptional({ example: 'Continue PT, add strengthening exercises', description: 'Updated treatment plan' })
  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @ApiPropertyOptional({ example: 'Player showing good progress, reduced pain', description: 'Update notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Confirmed Grade 2 strain via MRI', description: 'Updated diagnosis' })
  @IsString()
  @IsOptional()
  diagnosis?: string;
}

export class InjuryDetailDto {
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
  
  @ApiProperty({ example: 'Active', description: 'Current status' })
  status: string;
  
  @ApiProperty({ example: '2024-01-10T00:00:00.000Z', description: 'Date of injury' })
  injuryDate: string;
  
  @ApiPropertyOptional({ example: '2024-02-15T00:00:00.000Z', description: 'Expected return date' })
  expectedReturnDate?: string;
  
  @ApiPropertyOptional({ example: 'Overuse', description: 'Mechanism of injury' })
  mechanism?: string;
  
  @ApiPropertyOptional({ example: 'Grade 2 hamstring strain', description: 'Medical diagnosis' })
  diagnosis?: string;
  
  @ApiPropertyOptional({ example: 'RICE protocol, physical therapy', description: 'Treatment plan' })
  treatmentPlan?: string;
  
  @ApiPropertyOptional({ example: 'Player reported during training', description: 'Additional notes' })
  notes?: string;
  
  @ApiProperty({ example: '2024-01-10T10:30:00.000Z', description: 'Record creation timestamp' })
  createdAt: string;
  
  @ApiProperty({ example: '2024-01-12T15:45:00.000Z', description: 'Last update timestamp' })
  updatedAt: string;
  
  @ApiPropertyOptional({
    description: 'Player information',
    example: {
      playerId: 'PLAYER-001',
      diagnosedDate: '2024-01-10T10:30:00.000Z',
      reportedBy: 'COACH-001'
    }
  })
  player?: {
    playerId: string;
    diagnosedDate: string;
    reportedBy: string;
  };
  
  @ApiPropertyOptional({
    description: 'History of status updates',
    example: [{
      updateId: 'UPDATE-001',
      status: 'Recovering',
      notes: 'Showing improvement',
      recordedBy: 'COACH-001',
      recordedAt: '2024-01-12T15:45:00.000Z'
    }]
  })
  statusUpdates?: Array<{
    updateId: string;
    status: string;
    notes?: string;
    recordedBy: string;
    recordedAt: string;
  }>;
}

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
      pseudonymId: 'PSY-PLAYER-A1B2C3D4',
      diagnosedDate: '2024-01-10T10:30:00.000Z',
      reportedBy: 'COACH-001'
    }
  })
  player?: {
    playerId: string;
    pseudonymId: string;
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

export class QueryInjuriesDto {
  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Page number (1-indexed)', 
    default: 1,
    minimum: 1
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ 
    example: 20, 
    description: 'Number of items per page', 
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ 
    example: 'Active', 
    description: 'Filter by injury status',
    enum: InjuryStatus
  })
  @IsEnum(InjuryStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ 
    example: 'Moderate', 
    description: 'Filter by severity',
    enum: InjurySeverity
  })
  @IsEnum(InjurySeverity)
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({ 
    example: 'PLAYER-001', 
    description: 'Filter by player ID (pseudonym)'
  })
  @IsString()
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({ 
    example: 'Hamstring', 
    description: 'Filter by body part'
  })
  @IsString()
  @IsOptional()
  bodyPart?: string;

  @ApiPropertyOptional({ 
    example: '2024-01-01T00:00:00.000Z', 
    description: 'Filter injuries after this date (ISO 8601)'
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-12-31T23:59:59.999Z', 
    description: 'Filter injuries before this date (ISO 8601)'
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ 
    example: 'injuryDate', 
    description: 'Sort by field',
    enum: ['injuryDate', 'createdAt', 'severity', 'status']
  })
  @IsIn(['injuryDate', 'createdAt', 'severity', 'status'])
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ 
    example: 'DESC', 
    description: 'Sort order',
    enum: ['ASC', 'DESC']
  })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}

export class PaginatedInjuriesDto {
  @ApiProperty({ 
    description: 'Array of injuries',
    type: [InjuryDetailDto]
  })
  data: InjuryDetailDto[];

  @ApiProperty({ 
    description: 'Pagination metadata',
    example: {
      total: 45,
      page: 1,
      limit: 20,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false
    }
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ResolveInjuryDto {
  @ApiProperty({ 
    example: '2024-02-15T00:00:00.000Z', 
    description: 'Date when the player returned to play (ISO 8601)'
  })
  @IsDateString()
  @IsNotEmpty()
  returnToPlayDate: string;

  @ApiPropertyOptional({ 
    example: 'Player completed full training session without issues', 
    description: 'Notes about the resolution'
  })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;

  @ApiPropertyOptional({ 
    example: 'Full clearance from medical staff', 
    description: 'Final medical clearance notes'
  })
  @IsString()
  @IsOptional()
  medicalClearance?: string;
}


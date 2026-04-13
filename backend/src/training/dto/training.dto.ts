import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UpsertTrainingSessionDefinitionDto {
  @ApiProperty({ example: "Strength Training", description: "Session name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "gym", description: "Session type" })
  @IsString()
  @IsNotEmpty()
  sessionType: string;

  @ApiProperty({
    example: "2026-04-13T18:30:00.000Z",
    description: "Start date/time (ISO 8601)",
  })
  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @ApiProperty({ example: false, description: "Whether this session repeats" })
  @IsBoolean()
  isRepeatable: boolean;

  @ApiPropertyOptional({
    example: 7,
    description: "Repeat interval in days (required when isRepeatable=true)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  @ValidateIf((o) => o.isRepeatable === true)
  repeatIntervalDays?: number;
}

export class TrainingSessionDefinitionDto {
  @ApiProperty({ example: "TRN-1713038400000-ab12cd" })
  trainingSessionId: string;

  @ApiProperty({ example: "Strength Training" })
  name: string;

  @ApiProperty({ example: "gym" })
  sessionType: string;

  @ApiProperty({ example: "2026-04-13T18:30:00.000Z" })
  startDateTime: string;

  @ApiProperty({ example: true })
  isRepeatable: boolean;

  @ApiPropertyOptional({ example: 7 })
  repeatIntervalDays?: number | null;

  @ApiProperty({ example: "2026-04-13T10:00:00.000Z" })
  createdAt: string;

  @ApiProperty({ example: "2026-04-13T10:00:00.000Z" })
  updatedAt: string;
}

export class TrainingScheduleDto {
  @ApiProperty({ type: [TrainingSessionDefinitionDto] })
  sessions: TrainingSessionDefinitionDto[];
}

export class UpsertTrainingSessionReportDto {
  @ApiProperty({
    example: "2026-04-13",
    description: "Report date (ISO 8601 date-only)",
  })
  @IsDateString()
  reportDate: string;

  @ApiProperty({ example: 6, description: "Effort expended (1-10)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  effortExpended: number;

  @ApiProperty({ example: "Tired" })
  @IsString()
  @IsNotEmpty()
  physicalFeeling: string;

  @ApiProperty({ example: "Focused" })
  @IsString()
  @IsNotEmpty()
  mentalFeeling: string;

  @ApiPropertyOptional({ example: "Slight soreness after sprints" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TrainingSessionReportDto {
  @ApiProperty({ example: "TRN-1713038400000-ab12cd:2026-04-13" })
  reportKey: string;

  @ApiProperty({ example: "TRN-1713038400000-ab12cd" })
  trainingSessionId: string;

  @ApiProperty({ example: "PSY-PLAYER-A1B2C3D4" })
  playerPseudonymId: string;

  @ApiProperty({ example: "2026-04-13" })
  occurrenceDate: string;

  @ApiProperty({ example: "2026-04-13" })
  reportDate: string;

  @ApiProperty({ example: 6 })
  effortExpended: number;

  @ApiProperty({ example: "Tired" })
  physicalFeeling: string;

  @ApiProperty({ example: "Focused" })
  mentalFeeling: string;

  @ApiPropertyOptional({ example: "Slight soreness after sprints" })
  notes?: string | null;

  @ApiProperty({ example: "2026-04-13T10:00:00.000Z" })
  createdAt: string;

  @ApiProperty({ example: "2026-04-13T10:00:00.000Z" })
  updatedAt: string;
}

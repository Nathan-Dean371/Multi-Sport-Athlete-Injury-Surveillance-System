import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
} from "class-validator";

/**
 * Available metrics/columns for reports
 */
export enum ReportMetric {
  // Injury Counts
  INJURY_COUNT = "Injury Count",
  ACTIVE_INJURIES = "Active Injuries",
  RECOVERED_INJURIES = "Recovered Injuries",
  CHRONIC_INJURIES = "Chronic Injuries",

  // Time Metrics
  AVERAGE_RECOVERY_DAYS = "Average Recovery Days",
  TOTAL_RECOVERY_DAYS = "Total Recovery Days",
  MIN_RECOVERY_DAYS = "Minimum Recovery Days",
  MAX_RECOVERY_DAYS = "Maximum Recovery Days",

  // Severity Metrics
  MINOR_COUNT = "Minor Injuries Count",
  MODERATE_COUNT = "Moderate Injuries Count",
  SEVERE_COUNT = "Severe Injuries Count",
  CRITICAL_COUNT = "Critical Injuries Count",

  // Body Part Analysis
  INJURIES_BY_BODY_PART = "Injuries by Body Part",
  INJURIES_BY_TYPE = "Injuries by Type",

  // Player Metrics
  PLAYERS_AFFECTED = "Players Affected",
  REINJURY_RATE = "Re-injury Rate",

  // Treatment Metrics
  AVERAGE_TREATMENT_DURATION = "Average Treatment Duration",
  INJURIES_WITH_TREATMENT_PLAN = "Injuries with Treatment Plan",
}

/**
 * Aggregate functions that can be applied to metrics
 */
export enum AggregateFunction {
  COUNT = "Count",
  TOTAL = "Total",
  AVERAGE = "Average",
  MINIMUM = "Minimum",
  MAXIMUM = "Maximum",
}

/**
 * Report configuration - what to show and how
 */
export class ReportConfigDto {
  @ApiProperty({
    description: "Metrics to display in the report",
    enum: ReportMetric,
    isArray: true,
    example: [ReportMetric.INJURY_COUNT, ReportMetric.AVERAGE_RECOVERY_DAYS],
  })
  @IsArray()
  @IsEnum(ReportMetric, { each: true })
  metrics: ReportMetric[];

  @ApiProperty({
    description: "Aggregate function to apply",
    enum: AggregateFunction,
    example: AggregateFunction.COUNT,
  })
  @IsEnum(AggregateFunction)
  aggregateFunction: AggregateFunction;

  @ApiPropertyOptional({
    description: "Filter by injury status",
    isArray: true,
    example: ["Active", "Recovering"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statusFilter?: string[];

  @ApiPropertyOptional({
    description: "Filter by severity",
    isArray: true,
    example: ["Moderate", "Severe"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  severityFilter?: string[];

  @ApiPropertyOptional({
    description: "Filter by injury type",
    isArray: true,
    example: ["Muscle Strain", "Ligament Sprain"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  injuryTypeFilter?: string[];

  @ApiPropertyOptional({
    description: "Filter by body part",
    isArray: true,
    example: ["Knee", "Ankle"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyPartFilter?: string[];

  @ApiPropertyOptional({
    description: "Start date for date range filter (ISO 8601)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: "End date for date range filter (ISO 8601)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: "Filter by team ID",
    example: "team-123",
  })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    description: "Include test/demo data in report",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeTestData?: boolean;

  @ApiPropertyOptional({
    description: "Export format for the report",
    enum: ["json", "csv", "excel"],
    example: "json",
    default: "json",
  })
  @IsOptional()
  @IsEnum(["json", "csv", "excel"])
  exportFormat?: "json" | "csv" | "excel";
}

/**
 * DTO for saving a report configuration
 */
export class SaveReportDto extends ReportConfigDto {
  @ApiProperty({
    description: "Name for the saved report",
    example: "Monthly Injury Summary",
  })
  @IsString()
  reportName: string;

  @ApiPropertyOptional({
    description: "Description of the report",
    example: "Summary of all injuries for the current month",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Report data result
 */
export interface ReportDataResult {
  metric: string;
  value: number | string;
  breakdown?: Record<string, number>;
}

/**
 * Complete report response
 */
export interface ReportResponseDto {
  reportId?: string;
  reportName?: string;
  generatedAt: string;
  filters: {
    status?: string[];
    severity?: string[];
    injuryType?: string[];
    bodyPart?: string[];
    fromDate?: string;
    toDate?: string;
    teamId?: string;
  };
  aggregateFunction: AggregateFunction;
  data: ReportDataResult[];
  totalRecords: number;
  format: "json" | "csv" | "excel";
}

/**
 * Saved report configuration
 */
export interface SavedReportDto {
  reportId: string;
  reportName: string;
  description?: string;
  config: ReportConfigDto;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

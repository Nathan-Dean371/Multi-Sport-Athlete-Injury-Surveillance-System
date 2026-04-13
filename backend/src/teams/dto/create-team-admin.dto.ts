import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTeamAdminDto {
  @ApiProperty({ example: "ATU U23", description: "Team display name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "Rugby",
    description: "Sport baked into the team as a string",
  })
  @IsString()
  @IsNotEmpty()
  sport: string;

  @ApiProperty({
    example: "ORG-ATU-001",
    description: "Organization orgId that the team belongs to",
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    example: "PSY-COACH-8F2A9D1B",
    description: "Coach pseudonym ID to assign as manager",
  })
  @IsString()
  @IsNotEmpty()
  coachPseudonymId: string;

  @ApiPropertyOptional({ example: "U23", description: "Age group label" })
  @IsString()
  @IsOptional()
  ageGroup?: string;

  @ApiPropertyOptional({
    example: "Male",
    description: "Team gender category",
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    example: "2026-08-01",
    description: "Season start date (stored as string)",
  })
  @IsString()
  @IsOptional()
  seasonStart?: string;

  @ApiPropertyOptional({
    example: "2027-05-31",
    description: "Season end date (stored as string)",
  })
  @IsString()
  @IsOptional()
  seasonEnd?: string;

  @ApiPropertyOptional({
    example: "TEAM-ATU-U23-001",
    description: "Optional team ID override; auto-generated if omitted",
  })
  @IsString()
  @IsOptional()
  teamId?: string;
}

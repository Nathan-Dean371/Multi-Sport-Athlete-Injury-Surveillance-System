import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePlayerAdminParentDto {
  @ApiProperty({ example: "Mary", description: "Parent first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Murphy", description: "Parent last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: "parent@example.com",
    description: "Parent account email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "ParentPassword123!",
    description: "Initial password for the parent account",
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: "085-7776666",
    description: "Parent phone number",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: "PSY-PARENT-ABC12345",
    description: "Optional pseudonym ID override; auto-generated if omitted",
  })
  @IsString()
  @IsOptional()
  pseudonymId?: string;
}

export class CreatePlayerAdminDto {
  @ApiProperty({ example: "Liam", description: "Player first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Murphy", description: "Player last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: "player@example.com",
    description: "Player account email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "PlayerPassword123!",
    description: "Initial password set by admin",
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: "2008-05-10",
    description: "Player date of birth (YYYY-MM-DD)",
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    example: "PSY-COACH-8F2A9D1B",
    description: "Coach pseudonym ID that manages the team",
  })
  @IsString()
  @IsNotEmpty()
  coachPseudonymId: string;

  @ApiProperty({
    example: "TEAM-GU-U21-001",
    description: "Team ID that the player will be assigned to",
  })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiPropertyOptional({
    example: "PSY-PARENT-ABC12345",
    description: "Existing parent pseudonym ID to link",
  })
  @IsString()
  @IsOptional()
  parentPseudonymId?: string;

  @ApiPropertyOptional({
    description:
      "Inline parent creation (if provided, parentPseudonymId should be omitted)",
    type: CreatePlayerAdminParentDto,
  })
  @ValidateNested()
  @Type(() => CreatePlayerAdminParentDto)
  @IsOptional()
  parent?: CreatePlayerAdminParentDto;

  @ApiPropertyOptional({
    example: "PSY-PLAYER-ABC12345",
    description: "Optional pseudonym ID override; auto-generated if omitted",
  })
  @IsString()
  @IsOptional()
  pseudonymId?: string;
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptPlayerInvitationDto {
  @ApiProperty({
    description: "Unique invitation token received via email",
    example: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      "Pseudonym ID for the player (will be auto-generated if not provided)",
    example: "PSY-PLAYER-A1B2C3D4",
    required: false,
  })
  @IsString()
  @IsOptional()
  pseudonymId?: string;

  @ApiProperty({
    description: "Player date of birth in ISO 8601 format",
    example: "2010-06-15",
  })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({
    description: "Password for the player account (minimum 8 characters)",
    example: "SecurePassword123!",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

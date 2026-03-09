import { IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptCoachInvitationDto {
  @ApiProperty({
    description: "Unique invitation token received via email",
    example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      "Pseudonym ID for the coach (will be auto-generated if not provided)",
    example: "coach-abc123",
    required: false,
  })
  @IsString()
  @IsOptional()
  pseudonymId?: string;

  @ApiProperty({
    description:
      "Coach's first name (optional, will use invitation data if not provided)",
    example: "John",
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description:
      "Coach's last name (optional, will use invitation data if not provided)",
    example: "Smith",
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: "Password for the coach account (minimum 8 characters)",
    example: "SecurePassword123!",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

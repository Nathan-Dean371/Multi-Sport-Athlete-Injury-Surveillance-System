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
    description: "Coach's first name",
    example: "John",
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Coach's last name",
    example: "Smith",
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description:
      "Coach's specialization (e.g., 'Football', 'Basketball', etc.)",
    example: "Football",
    required: false,
  })
  @IsString()
  @IsOptional()
  specialization?: string;

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

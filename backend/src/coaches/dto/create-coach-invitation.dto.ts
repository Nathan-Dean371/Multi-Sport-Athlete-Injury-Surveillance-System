import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCoachInvitationDto {
  @ApiProperty({
    description: "Email address of the coach being invited",
    example: "coach@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  coachEmail: string;

  @ApiProperty({
    description:
      "First name of the coach (optional, can be provided during acceptance)",
    example: "John",
    required: false,
  })
  @IsString()
  @IsOptional()
  coachFirstName?: string;

  @ApiProperty({
    description:
      "Last name of the coach (optional, can be provided during acceptance)",
    example: "Smith",
    required: false,
  })
  @IsString()
  @IsOptional()
  coachLastName?: string;

  @IsString()
  @IsOptional()
  adminPseudonymId?: string; // Set by controller from JWT
}

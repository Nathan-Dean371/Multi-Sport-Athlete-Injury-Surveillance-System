import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateParentInvitationDto {
  @IsString()
  @IsOptional()
  coachPseudonymId?: string; // Set by controller from JWT

  @IsEmail()
  @IsNotEmpty()
  parentEmail: string;

  @IsString()
  @IsOptional()
  parentPhone?: string;
}

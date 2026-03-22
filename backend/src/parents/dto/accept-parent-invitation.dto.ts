import { IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator";

export class AcceptParentInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  pseudonymId?: string; // will be auto-generated if not provided

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

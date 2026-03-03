import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class AcceptParentInvitationDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  pseudonymId: string; // the parent will be assigned a pseudonymId on accept

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

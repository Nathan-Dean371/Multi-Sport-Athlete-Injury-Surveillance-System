import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdatePlayerAdminDto {
  @ApiPropertyOptional({ example: "Liam", description: "Player first name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: "Murphy", description: "Player last name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: "player@example.com",
    description: "Player account email address",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the account is active",
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateCoachAdminDto {
  @ApiPropertyOptional({ example: "John", description: "Coach first name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: "Smith", description: "Coach last name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: "john.smith@example.com",
    description: "Coach account email address",
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

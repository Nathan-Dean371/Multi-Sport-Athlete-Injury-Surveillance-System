import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateParentAdminDto {
  @ApiPropertyOptional({ example: "Mary", description: "Parent first name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: "Murphy", description: "Parent last name" })
  @IsString()
  @MinLength(1)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    example: "parent@example.com",
    description: "Parent account email address",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: "085-7776666",
    description: "Parent phone number",
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the account is active",
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

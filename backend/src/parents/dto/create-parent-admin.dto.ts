import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateParentAdminDto {
  @ApiProperty({ example: "Mary", description: "Parent first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Murphy", description: "Parent last name" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: "parent@example.com",
    description: "Parent account email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "ParentPassword123!",
    description: "Initial password set by admin",
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    example: "085-7776666",
    description: "Parent phone number",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: "PSY-PARENT-ABC12345",
    description: "Optional pseudonym ID override; auto-generated if omitted",
  })
  @IsString()
  @IsOptional()
  pseudonymId?: string;
}

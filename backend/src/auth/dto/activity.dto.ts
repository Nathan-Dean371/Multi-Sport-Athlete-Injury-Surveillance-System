import { ApiProperty } from "@nestjs/swagger";

export class UserActivityDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  id: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  userAccountId: string;

  @ApiProperty({ example: "2026-03-16T12:34:56.000Z" })
  occurredAt: Date;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "203.0.113.5" })
  ipAddress?: string;
}

export class UserActivityQueryDto {
  userId: string;
  limit?: number;
  offset?: number;
}

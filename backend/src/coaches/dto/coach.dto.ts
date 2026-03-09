import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CoachDto {
  @ApiProperty({
    example: "COACH-001",
    description: "Unique coach identifier from Neo4j",
  })
  coachId: string;

  @ApiProperty({
    example: "PSY-COACH-8F2A9D1B",
    description: "Pseudonymized identifier",
  })
  pseudonymId: string;

  @ApiPropertyOptional({
    example: "John",
    description: "Coach first name",
  })
  firstName?: string;

  @ApiPropertyOptional({
    example: "Smith",
    description: "Coach last name",
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: "john.smith@example.com",
    description: "Coach email address",
  })
  email?: string;

  @ApiPropertyOptional({
    example: "Physiotherapy",
    description: "Coach specialization",
  })
  specialization?: string;

  @ApiProperty({
    example: 2,
    description: "Number of teams managed by this coach",
  })
  teamCount: number;

  @ApiProperty({
    example: true,
    description: "Whether the coach account is active",
  })
  isActive: boolean;
}

export class CoachListDto {
  @ApiProperty({
    type: [CoachDto],
    description: "List of all coaches",
  })
  coaches: CoachDto[];

  @ApiProperty({
    example: 15,
    description: "Total number of coaches",
  })
  total: number;
}

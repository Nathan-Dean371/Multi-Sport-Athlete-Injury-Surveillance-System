import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoachInfoDto {
  @ApiProperty({ example: 'COACH-001' })
  coachId: string;

  @ApiProperty({ example: 'PSY-COACH-8F2A9D1B' })
  pseudonymId: string;

  @ApiPropertyOptional({ example: 'Physiotherapy' })
  specialization?: string;
}

export class TeamDetailsDto {
  @ApiProperty({ example: 'TEAM-001' })
  teamId: string;

  @ApiProperty({ example: 'Senior Gaelic Football' })
  name: string;

  @ApiProperty({ example: 'Gaelic Football' })
  sport: string;

  @ApiPropertyOptional({ example: 'Senior' })
  ageGroup?: string;

  @ApiPropertyOptional({ example: 'Male' })
  gender?: string;

  @ApiProperty({ example: 'ORG-001' })
  organizationId: string;

  @ApiProperty({ example: 'Dublin GAA' })
  organizationName: string;

  @ApiProperty({ type: [CoachInfoDto] })
  coaches: CoachInfoDto[];

  @ApiProperty({ example: 25 })
  playerCount: number;

  @ApiPropertyOptional({ example: '2024-09-01' })
  seasonStart?: string;

  @ApiPropertyOptional({ example: '2025-05-31' })
  seasonEnd?: string;
}

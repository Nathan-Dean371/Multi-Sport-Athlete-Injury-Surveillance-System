import { ApiProperty } from "@nestjs/swagger";

export class OrganizationDto {
  @ApiProperty({ example: "ORG-ATU-001" })
  organizationId: string;

  @ApiProperty({ example: "Atlantic Technological University Sports" })
  organizationName: string;
}

export class OrganizationListDto {
  @ApiProperty({ type: [OrganizationDto] })
  organizations: OrganizationDto[];

  @ApiProperty({ example: 2 })
  total: number;
}

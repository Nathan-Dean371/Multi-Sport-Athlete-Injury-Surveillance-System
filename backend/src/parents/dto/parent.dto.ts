import { ApiProperty } from "@nestjs/swagger";

export interface ParentDto {
  parentId: string;
  pseudonymId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  childrenCount: number;
  isActive: boolean;
}

export class ParentListDto {
  @ApiProperty({
    type: [Object],
    description: "List of parents with their details",
  })
  parents: ParentDto[];

  @ApiProperty({ description: "Total number of parents" })
  total: number;
}

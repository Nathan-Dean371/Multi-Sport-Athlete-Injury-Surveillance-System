import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ReferenceService } from "./reference.service";
import { OrganizationListDto } from "./dto/organization.dto";

@ApiTags("reference")
@ApiBearerAuth("JWT-auth")
@Controller("reference")
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("organizations")
  async listOrganizations(): Promise<OrganizationListDto> {
    return this.referenceService.listOrganizations();
  }
}

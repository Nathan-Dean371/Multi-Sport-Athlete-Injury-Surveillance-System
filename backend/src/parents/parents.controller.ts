import { Controller, Post, Body, UseGuards, Req, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { ParentsService } from "./parents.service";
import { CreateParentInvitationDto } from "./dto/create-parent-invitation.dto";
import { AcceptParentInvitationDto } from "./dto/accept-parent-invitation.dto";
import { ParentListDto } from "./dto/parent.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@ApiTags("parents")
@ApiBearerAuth("JWT-auth")
@Controller("parents")
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get()
  @ApiOperation({
    summary: "Get all parents (Admin only)",
    description:
      "Retrieve a list of all parents with their identity information including names, emails, and linked children. This endpoint is restricted to administrators only.",
  })
  @ApiResponse({
    status: 200,
    description: "List of parents retrieved successfully",
    type: ParentListDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findAllForAdmin(): Promise<ParentListDto> {
    return this.parentsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("coach")
  @Post("invite")
  async inviteParent(@Body() dto: CreateParentInvitationDto, @Req() req: any) {
    // coach initiates invite
    const coachPseudonymId = req.user.pseudonymId;
    return this.parentsService.createInvitation({ ...dto, coachPseudonymId });
  }

  @Post("accept")
  async acceptInvitation(@Body() dto: AcceptParentInvitationDto) {
    return this.parentsService.acceptInvitation(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("parent")
  @Get("me")
  async getMyProfile(@Req() req: any) {
    const pseudonymId = req.user.pseudonymId;
    return this.parentsService.getProfile(pseudonymId);
  }
}

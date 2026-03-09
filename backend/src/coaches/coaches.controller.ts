import {
  Controller,
  Get,
  Param,
  UseGuards,
  Post,
  Body,
  Req,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { CoachesService } from "./coaches.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CoachDto, CoachListDto } from "./dto/coach.dto";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Public } from "../auth/public.decorator";
import { CreateCoachInvitationDto } from "./dto/create-coach-invitation.dto";
import { AcceptCoachInvitationDto } from "./dto/accept-coach-invitation.dto";

@ApiTags("coaches")
@ApiBearerAuth("JWT-auth")
@Controller("coaches")
@UseGuards(JwtAuthGuard)
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Get all coaches",
    description:
      "Retrieve a list of all coaches with their personal information, team counts and active status. Only accessible by admins.",
  })
  @ApiResponse({
    status: 200,
    description: "List of coaches retrieved successfully",
    type: CoachListDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findAll(): Promise<CoachListDto> {
    return this.coachesService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get coach details",
    description:
      "Retrieve detailed information about a specific coach including their team count.",
  })
  @ApiParam({
    name: "id",
    description: "Coach ID or pseudonym ID",
    example: "COACH-001",
  })
  @ApiResponse({
    status: 200,
    description: "Coach details retrieved successfully",
    type: CoachDto,
  })
  @ApiResponse({
    status: 404,
    description: "Coach not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async findOne(@Param("id") id: string): Promise<CoachDto> {
    return this.coachesService.findOne(id);
  }

  @Post("invite")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Invite a coach to the platform",
    description:
      "Create an invitation for a coach by providing their email address. The coach will receive an invitation token that allows them to create an account. Only accessible by admins.",
  })
  @ApiResponse({
    status: 201,
    description:
      "Coach invitation created successfully. Returns the invitation token for development purposes.",
    schema: {
      properties: {
        token: { type: "string", example: "a1b2c3d4..." },
        message: { type: "string" },
        invitationLink: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - Email already has pending invitation or existing account",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async inviteCoach(@Body() dto: CreateCoachInvitationDto, @Req() req: any) {
    const adminPseudonymId = req.user.pseudonymId;
    return this.coachesService.createInvitation({ ...dto, adminPseudonymId });
  }

  @Public()
  @Post("accept-invitation")
  @ApiOperation({
    summary: "Accept a coach invitation",
    description:
      "Accept a coach invitation by providing the invitation token and creating account credentials. This endpoint is public and does not require authentication.",
  })
  @ApiResponse({
    status: 201,
    description: "Coach invitation accepted and account created successfully",
    schema: {
      properties: {
        message: { type: "string" },
        coach: {
          type: "object",
          properties: {
            coachId: { type: "string" },
            pseudonymId: { type: "string" },
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Invitation not found, already accepted, or expired",
  })
  async acceptInvitation(@Body() dto: AcceptCoachInvitationDto) {
    return this.coachesService.acceptInvitation(dto);
  }

  @Get("invitations/pending")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Get all pending coach invitations",
    description:
      "Retrieve a list of all pending (not yet accepted) coach invitations. Only accessible by admins.",
  })
  @ApiResponse({
    status: 200,
    description: "List of pending coach invitations",
    schema: {
      properties: {
        invitations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              invitationId: { type: "string" },
              coachEmail: { type: "string" },
              coachFirstName: { type: "string" },
              coachLastName: { type: "string" },
              createdAt: { type: "string" },
              expiresAt: { type: "string" },
              adminPseudonymId: { type: "string" },
            },
          },
        },
        total: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getPendingInvitations() {
    return this.coachesService.getPendingInvitations();
  }

  @Delete("invitations/:invitationId")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Cancel a pending coach invitation",
    description:
      "Cancel a pending (not yet accepted) coach invitation. Only accessible by admins.",
  })
  @ApiParam({
    name: "invitationId",
    description: "UUID of the invitation to cancel",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Invitation cancelled successfully",
    schema: {
      properties: {
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invitation already accepted",
  })
  @ApiResponse({
    status: 404,
    description: "Invitation not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async cancelInvitation(@Param("invitationId") invitationId: string) {
    return this.coachesService.cancelInvitation(invitationId);
  }

  @Get("invitations/accepted")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Get all accepted coach invitations",
    description:
      "Retrieve a list of all accepted coach invitations. Only accessible by admins.",
  })
  @ApiResponse({
    status: 200,
    description: "List of accepted coach invitations",
    schema: {
      properties: {
        invitations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              invitationId: { type: "string" },
              coachEmail: { type: "string" },
              coachFirstName: { type: "string" },
              coachLastName: { type: "string" },
              createdAt: { type: "string" },
              acceptedAt: { type: "string" },
              adminPseudonymId: { type: "string" },
            },
          },
        },
        total: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getAcceptedInvitations() {
    return this.coachesService.getAcceptedInvitations();
  }
}

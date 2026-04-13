import {
  Controller,
  Get,
  Param,
  UseGuards,
  Post,
  Body,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { PlayersService } from "./players.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { PlayerDto, PlayerListDto } from "./dto/player.dto";
import { PlayerAdminListDto } from "./dto/player-admin.dto";
import { PlayerInjuriesDto } from "./dto/injury.dto";
import { AcceptPlayerInvitationDto } from "./dto/accept-player-invitation.dto";
import { UpdatePlayerAdminDto } from "./dto/update-player-admin.dto";

@ApiTags("players")
@ApiBearerAuth("JWT-auth")
@Controller("players")
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Public()
  @Post("accept-invite")
  async acceptInvite(@Body() dto: AcceptPlayerInvitationDto) {
    return this.playersService.acceptInvite(dto);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("admin")
  @ApiOperation({
    summary: "Get all players with identity data (Admin only)",
    description:
      "Retrieve a list of all players with their identity information including names, emails, date of birth, and injury history. This endpoint is restricted to administrators only.",
  })
  @ApiResponse({
    status: 200,
    description: "List of players with identity data retrieved successfully",
    type: PlayerAdminListDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findAllForAdmin(): Promise<PlayerAdminListDto> {
    return this.playersService.findAllForAdmin();
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("admin/:pseudonymId")
  async getPlayerAdminProfile(@Param("pseudonymId") pseudonymId: string) {
    return this.playersService.getAdminProfile(pseudonymId);
  }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Patch("admin/:pseudonymId")
  async updatePlayerAdminProfile(
    @Param("pseudonymId") pseudonymId: string,
    @Body() dto: UpdatePlayerAdminDto,
  ) {
    return this.playersService.updateAdminProfile(pseudonymId, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all players",
    description:
      "Retrieve a comprehensive list of all players registered in the injury surveillance system. Returns player pseudonym IDs, basic information, and team associations.",
  })
  @ApiResponse({
    status: 200,
    description: "List of players retrieved successfully",
    type: PlayerListDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async findAll(): Promise<PlayerListDto> {
    return this.playersService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get player details",
    description:
      "Retrieve detailed information about a specific player including their pseudonym ID, position, age group, team affiliation, and active status. Player data is anonymized using pseudonym identifiers to protect privacy.",
  })
  @ApiParam({
    name: "id",
    description: "Player pseudonym ID (e.g., PSY-PLAYER-A1B2C3D4)",
    example: "PSY-PLAYER-A1B2C3D4",
  })
  @ApiResponse({
    status: 200,
    description: "Player details retrieved successfully",
    type: PlayerDto,
  })
  @ApiResponse({ status: 404, description: "Player not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async findOne(@Param("id") id: string): Promise<PlayerDto> {
    return this.playersService.findOne(id);
  }

  @Get(":id/injuries")
  @ApiOperation({
    summary: "Get player injuries",
    description:
      "Retrieve the complete injury history for a specific player, including injury type, severity, status, treatment plans, and recovery dates. Useful for tracking player health trends and rehabilitation progress.",
  })
  @ApiParam({
    name: "id",
    description: "Player pseudonym ID (e.g., PSY-PLAYER-A1B2C3D4)",
    example: "PSY-PLAYER-A1B2C3D4",
  })
  @ApiResponse({
    status: 200,
    description: "Player injuries retrieved successfully",
    type: PlayerInjuriesDto,
  })
  @ApiResponse({ status: 404, description: "Player not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token required",
  })
  async findPlayerInjuries(
    @Param("id") id: string,
  ): Promise<PlayerInjuriesDto> {
    return this.playersService.findPlayerInjuries(id);
  }
}

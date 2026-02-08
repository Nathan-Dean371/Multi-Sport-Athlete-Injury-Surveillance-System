import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { StatusService } from './status.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { LatestStatusResponseDto } from './dto/status-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PlayerOwnershipGuard } from '../common/guards/player-ownership.guard';

@ApiTags('status')
@ApiBearerAuth('JWT-auth')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Patch('players/:playerId/status')
  @UseGuards(JwtAuthGuard, PlayerOwnershipGuard)
  @ApiOperation({ 
    summary: 'Update player daily status',
    description: 'Players can update their own daily status. Coaches and admins can update any player status.'
  })
  @ApiParam({ 
    name: 'playerId', 
    description: 'Player ID',
    example: 'PLAYER-001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status updated successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed or player not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - cannot update another player\'s status' 
  })
  async updateStatus(
    @Param('playerId') playerId: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.statusService.updatePlayerStatus(playerId, updateStatusDto);
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('coach', 'admin')
  @ApiOperation({ 
    summary: 'Get latest player statuses grouped by team',
    description: 'Returns current status for all players on teams managed by the coach. Shows today\'s status updates with active injury counts.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Team statuses retrieved successfully',
    type: LatestStatusResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - requires coach or admin role' 
  })
  async getLatestStatuses(@Request() req) {
    const coachPseudoId = req.user.pseudoId;
    return this.statusService.getLatestTeamStatuses(coachPseudoId);
  }
}

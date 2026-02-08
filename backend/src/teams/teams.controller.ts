import { 
  Controller, 
  Get, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { TeamRosterDto } from './dto/team-roster.dto';
import { TeamDetailsDto } from './dto/team-details.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachTeamAccessGuard } from '../common/guards/coach-team-access.guard';

@ApiTags('teams')
@ApiBearerAuth('JWT-auth')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':teamId/players')
  @UseGuards(JwtAuthGuard, CoachTeamAccessGuard)
  @ApiOperation({ 
    summary: 'Get team roster with current player statuses',
    description: 'Returns all players on the team with their latest status updates and active injury counts. Only accessible by coaches who manage this team.'
  })
  @ApiParam({ 
    name: 'teamId', 
    description: 'Team unique identifier',
    example: 'TEAM-001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Team roster retrieved successfully',
    type: TeamRosterDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - You do not have access to this team' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Team not found' 
  })
  async getTeamRoster(@Param('teamId') teamId: string): Promise<TeamRosterDto> {
    return this.teamsService.getTeamRoster(teamId);
  }

  @Get(':teamId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get team details',
    description: 'Returns team information including coaches and player count. Accessible to authenticated users who belong to the team.'
  })
  @ApiParam({ 
    name: 'teamId', 
    description: 'Team unique identifier',
    example: 'TEAM-001'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Team details retrieved successfully',
    type: TeamDetailsDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Team not found' 
  })
  async getTeamDetails(@Param('teamId') teamId: string): Promise<TeamDetailsDto> {
    return this.teamsService.getTeamDetails(teamId);
  }
}

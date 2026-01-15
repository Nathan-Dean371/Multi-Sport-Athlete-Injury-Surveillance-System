import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayerDto, PlayerListDto } from './dto/player.dto';
import { PlayerInjuriesDto } from './dto/injury.dto';

@ApiTags('players')
@ApiBearerAuth('JWT-auth')
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all players', 
    description: 'Retrieve a comprehensive list of all players registered in the injury surveillance system. Returns player pseudonym IDs, basic information, and team associations.' 
  })
  @ApiResponse({ status: 200, description: 'List of players retrieved successfully', type: PlayerListDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAll(): Promise<PlayerListDto> {
    return this.playersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get player details', 
    description: 'Retrieve detailed information about a specific player including their pseudonym ID, position, age group, team affiliation, and active status. Player data is anonymized using pseudonym identifiers to protect privacy.' 
  })
  @ApiParam({ name: 'id', description: 'Player pseudonym ID (e.g., PLAYER-001)', example: 'PLAYER-001' })
  @ApiResponse({ status: 200, description: 'Player details retrieved successfully', type: PlayerDto })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findOne(@Param('id') id: string): Promise<PlayerDto> {
    return this.playersService.findOne(id);
  }

  @Get(':id/injuries')
  @ApiOperation({ 
    summary: 'Get player injuries', 
    description: 'Retrieve the complete injury history for a specific player, including injury type, severity, status, treatment plans, and recovery dates. Useful for tracking player health trends and rehabilitation progress.' 
  })
  @ApiParam({ name: 'id', description: 'Player pseudonym ID (e.g., PLAYER-001)', example: 'PLAYER-001' })
  @ApiResponse({ status: 200, description: 'Player injuries retrieved successfully', type: PlayerInjuriesDto })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findPlayerInjuries(@Param('id') id: string): Promise<PlayerInjuriesDto> {
    return this.playersService.findPlayerInjuries(id);
  }
}

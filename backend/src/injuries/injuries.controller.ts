import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InjuriesService } from './injuries.service';
import { CreateInjuryDto, UpdateInjuryDto, InjuryDetailDto, QueryInjuriesDto, PaginatedInjuriesDto, ResolveInjuryDto } from './dto/injury.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('injuries')
@ApiBearerAuth('JWT-auth')
@Controller('injuries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InjuriesController {
  constructor(private readonly injuriesService: InjuriesService) {}

  @Post()
  @Roles('coach', 'admin')
  @ApiOperation({ 
    summary: 'Create new injury report', 
    description: 'Report a new injury for a player. Only coaches and admins can create injury reports.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Injury successfully created', 
    type: InjuryDetailDto 
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
    description: 'Forbidden - insufficient permissions (requires coach or admin role)' 
  })
  async create(
    @Body() createInjuryDto: CreateInjuryDto,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    try {
      const reportedBy = req.user.pseudonym;
      return await this.injuriesService.createInjury(createInjuryDto, reportedBy);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @Roles('player', 'coach', 'admin')
  @ApiOperation({ 
    summary: 'Get all injuries with filtering and pagination', 
    description: 'Retrieve a paginated list of injuries. Players see only their own injuries. Coaches and admins can see all injuries with optional filters.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injuries retrieved successfully', 
    type: PaginatedInjuriesDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid query parameters' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  async findAll(
    @Query() queryDto: QueryInjuriesDto,
    @Request() req,
  ): Promise<PaginatedInjuriesDto> {
    try {
      const userRole = req.user.identityType;
      const userPseudonym = req.user.pseudonym;
      return await this.injuriesService.findAll(queryDto, userRole, userPseudonym);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @Roles('player', 'coach', 'admin')
  @ApiOperation({ 
    summary: 'Get injury details by ID', 
    description: 'Retrieve detailed information about a specific injury including status updates. Players can only view their own injuries.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Injury ID (e.g., INJ-2024-001)', 
    example: 'INJ-2024-001' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury details retrieved successfully', 
    type: InjuryDetailDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - you can only access your own injury records' 
  })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    try {
      const injury = await this.injuriesService.findOne(id);
      
      // Role-based access control: players can only see their own injuries
      if (req.user.identityType === 'player' && injury.player?.playerId !== req.user.pseudonym) {
        throw new Error('You can only access your own injury records');
      }
      
      return injury;
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @Roles('coach', 'admin')
  @ApiOperation({ 
    summary: 'Update injury details', 
    description: 'Update injury status, treatment plan, or other details. Only coaches and admins can update injuries.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Injury ID (e.g., INJ-2024-001)', 
    example: 'INJ-2024-001' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury successfully updated', 
    type: InjuryDetailDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - insufficient permissions (requires coach or admin role)' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateInjuryDto: UpdateInjuryDto,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    try {
      const updatedBy = req.user.pseudonym;
      return await this.injuriesService.updateInjury(id, updateInjuryDto, updatedBy);
    } catch (error) {
      throw error;
    }
  }

  @Post(':id/resolve')
  @Roles('coach', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Resolve an injury (mark as recovered)', 
    description: 'Complete the injury lifecycle by marking it as recovered with return-to-play date. Only coaches and admins can resolve injuries.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Injury ID (e.g., INJ-2024-001)', 
    example: 'INJ-2024-001' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Injury successfully resolved and marked as recovered', 
    type: InjuryDetailDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Injury not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - injury already resolved or validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - JWT token required' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - insufficient permissions (requires coach or admin role)' 
  })
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveInjuryDto,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    try {
      const resolvedBy = req.user.pseudonym;
      return await this.injuriesService.resolveInjury(id, resolveDto, resolvedBy);
    } catch (error) {
      throw error;
    }
  }
}

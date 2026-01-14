import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InjuriesService } from './injuries.service';
import { CreateInjuryDto, UpdateInjuryDto, InjuryDetailDto } from './dto/injury.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('injuries')
@ApiBearerAuth('JWT-auth')
@Controller('injuries')
@UseGuards(JwtAuthGuard)
export class InjuriesController {
  constructor(private readonly injuriesService: InjuriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new injury', description: 'Report a new injury for a player' })
  @ApiResponse({ status: 201, description: 'Injury successfully created', type: InjuryDetailDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async create(
    @Body() createInjuryDto: CreateInjuryDto,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    // Use the authenticated user's pseudonym as the reporter
    const reportedBy = req.user.pseudonym;
    return this.injuriesService.createInjury(createInjuryDto, reportedBy);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get injury details', description: 'Retrieve detailed information about a specific injury' })
  @ApiParam({ name: 'id', description: 'Injury ID (e.g., INJ-2024-001)', example: 'INJ-2024-001' })
  @ApiResponse({ status: 200, description: 'Injury details retrieved successfully', type: InjuryDetailDto })
  @ApiResponse({ status: 404, description: 'Injury not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findOne(@Param('id') id: string): Promise<InjuryDetailDto> {
    return this.injuriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update injury', description: 'Update injury status, treatment plan, or other details' })
  @ApiParam({ name: 'id', description: 'Injury ID (e.g., INJ-2024-001)', example: 'INJ-2024-001' })
  @ApiResponse({ status: 200, description: 'Injury successfully updated', type: InjuryDetailDto })
  @ApiResponse({ status: 404, description: 'Injury not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async update(
    @Param('id') id: string,
    @Body() updateInjuryDto: UpdateInjuryDto,
    @Request() req,
  ): Promise<InjuryDetailDto> {
    // Use the authenticated user's pseudonym as the updater
    const updatedBy = req.user.pseudonym;
    return this.injuriesService.updateInjury(id, updateInjuryDto, updatedBy);
  }
}

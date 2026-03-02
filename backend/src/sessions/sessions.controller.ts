import { Controller, Post, UseGuards, Req, Body, Get, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('player','parent')
  @Post()
  async createSession(@Body() dto: CreateSessionDto, @Req() req: any) {
    const ownerPseudonym = req.user.pseudonymId;
    return this.sessionsService.createSession(ownerPseudonym, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('player','parent')
  @Get(':id')
  async getSession(@Param('id') sessionId: string, @Req() req: any) {
    const pseudo = req.user.pseudonymId;
    return this.sessionsService.getSession(sessionId, pseudo);
  }
}

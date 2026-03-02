import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentInvitationDto } from './dto/create-parent-invitation.dto';
import { AcceptParentInvitationDto } from './dto/accept-parent-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('coach')
  @Post('invite')
  async inviteParent(@Body() dto: CreateParentInvitationDto, @Req() req: any) {
    // coach initiates invite
    const coachPseudonymId = req.user.pseudonymId;
    return this.parentsService.createInvitation({ ...dto, coachPseudonymId });
  }

  @Post('accept')
  async acceptInvitation(@Body() dto: AcceptParentInvitationDto) {
    return this.parentsService.acceptInvitation(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('parent')
  @Get('me')
  async getMyProfile(@Req() req: any) {
    const pseudonymId = req.user.pseudonymId;
    return this.parentsService.getProfile(pseudonymId);
  }
}

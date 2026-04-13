import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { TrainingService } from "./training.service";
import {
  UpsertTrainingSessionDefinitionDto,
  UpsertTrainingSessionReportDto,
} from "./dto/training.dto";

@ApiTags("training")
@ApiBearerAuth("JWT-auth")
@Controller("players/:playerId")
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("player", "parent")
  @Get("training-schedule")
  async getTrainingSchedule(
    @Param("playerId") playerId: string,
    @Req() req: any,
  ) {
    return this.trainingService.getTrainingSchedule(
      playerId,
      req.user.pseudonymId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("player", "parent")
  @Put("training-schedule/sessions/:sessionId")
  async upsertTrainingSessionDefinition(
    @Param("playerId") playerId: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: UpsertTrainingSessionDefinitionDto,
    @Req() req: any,
  ) {
    return this.trainingService.upsertTrainingSessionDefinition(
      playerId,
      sessionId,
      dto,
      req.user.pseudonymId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("player", "parent")
  @Delete("training-schedule/sessions/:sessionId")
  async deleteTrainingSessionDefinition(
    @Param("playerId") playerId: string,
    @Param("sessionId") sessionId: string,
    @Req() req: any,
  ) {
    return this.trainingService.deleteTrainingSessionDefinition(
      playerId,
      sessionId,
      req.user.pseudonymId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("player", "parent")
  @Put("training-reports/:sessionId/:occurrenceDate")
  async upsertTrainingSessionReport(
    @Param("playerId") playerId: string,
    @Param("sessionId") sessionId: string,
    @Param("occurrenceDate") occurrenceDate: string,
    @Body() dto: UpsertTrainingSessionReportDto,
    @Req() req: any,
  ) {
    return this.trainingService.upsertTrainingSessionReport(
      playerId,
      sessionId,
      occurrenceDate,
      dto,
      req.user.pseudonymId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("player", "parent")
  @Get("training-reports")
  async listTrainingReports(
    @Param("playerId") playerId: string,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @Req() req: any,
  ) {
    return this.trainingService.listTrainingReports(
      playerId,
      req.user.pseudonymId,
      from,
      to,
    );
  }
}

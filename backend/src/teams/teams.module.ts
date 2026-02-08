import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Neo4jModule } from '../database/neo4j.module';
import { CoachTeamAccessGuard } from '../common/guards/coach-team-access.guard';

@Module({
  imports: [Neo4jModule],
  controllers: [TeamsController],
  providers: [TeamsService, CoachTeamAccessGuard],
  exports: [TeamsService],
})
export class TeamsModule {}

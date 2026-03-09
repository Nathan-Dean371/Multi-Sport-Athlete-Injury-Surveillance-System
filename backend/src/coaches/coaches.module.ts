import { Module } from "@nestjs/common";
import { CoachesController } from "./coaches.controller";
import { CoachesService } from "./coaches.service";
import { Neo4jModule } from "../database/neo4j.module";
import { PostgresModule } from "../database/postgres.module";
import { EmailService } from "../common/email.service";

@Module({
  imports: [Neo4jModule, PostgresModule],
  controllers: [CoachesController],
  providers: [CoachesService, EmailService],
  exports: [CoachesService],
})
export class CoachesModule {}

import { Module } from "@nestjs/common";
import { PlayersController } from "./players.controller";
import { PlayersService } from "./players.service";
import { Neo4jModule } from "../database/neo4j.module";
import { PostgresModule } from "../database/postgres.module";
import { ParentsModule } from "../parents/parents.module";

@Module({
  imports: [Neo4jModule, PostgresModule, ParentsModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}

import { Module } from "@nestjs/common";
import { ReferenceController } from "./reference.controller";
import { ReferenceService } from "./reference.service";
import { Neo4jModule } from "../database/neo4j.module";

@Module({
  imports: [Neo4jModule],
  controllers: [ReferenceController],
  providers: [ReferenceService],
})
export class ReferenceModule {}

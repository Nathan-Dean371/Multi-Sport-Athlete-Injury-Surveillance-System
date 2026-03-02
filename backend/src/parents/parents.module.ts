import { Module } from '@nestjs/common';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { PostgresModule } from '../database/postgres.module';
import { Neo4jModule } from '../database/neo4j.module';

@Module({
  imports: [PostgresModule, Neo4jModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}

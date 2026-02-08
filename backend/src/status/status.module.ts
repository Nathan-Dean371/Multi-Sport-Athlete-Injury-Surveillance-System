import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { Neo4jModule } from '../database/neo4j.module';
import { PostgresModule } from '../database/postgres.module';

@Module({
  imports: [Neo4jModule, PostgresModule],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}

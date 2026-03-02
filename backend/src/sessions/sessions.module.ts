import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Neo4jModule } from '../database/neo4j.module';
import { PostgresModule } from '../database/postgres.module';

@Module({
  imports: [Neo4jModule, PostgresModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

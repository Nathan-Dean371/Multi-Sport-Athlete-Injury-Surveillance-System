import { Module } from '@nestjs/common';
import { InjuriesController } from './injuries.controller';
import { InjuriesService } from './injuries.service';
import { Neo4jModule } from '../database/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [InjuriesController],
  providers: [InjuriesService],
})
export class InjuriesModule {}

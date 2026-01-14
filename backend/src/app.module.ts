import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jModule } from './database/neo4j.module';
import { PostgresModule } from './database/postgres.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { InjuriesModule } from './injuries/injuries.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    Neo4jModule,
    PostgresModule,
    AuthModule,
    PlayersModule,
    InjuriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

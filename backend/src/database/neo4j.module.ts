import { Module, Global, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

@Global()
@Module({
  providers: [
    {
      provide: 'NEO4J_DRIVER',
      useFactory: async (configService: ConfigService): Promise<Driver> => {
        const uri = configService.get<string>('neo4j.uri') || 'bolt://localhost:7687';
        const username = configService.get<string>('neo4j.user') || 'neo4j';
        const password = configService.get<string>('neo4j.password') || 'password';

        const driver = neo4j.driver(
          uri,
          neo4j.auth.basic(username, password)
        );

        // Verify connectivity
        await driver.verifyConnectivity();
        console.log('Neo4j connection established successfully');

        return driver;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['NEO4J_DRIVER'],
})
export class Neo4jModule implements OnApplicationShutdown {
  constructor(@Inject('NEO4J_DRIVER') private readonly driver: Driver) {}

  async onApplicationShutdown(): Promise<void> {
    await this.driver.close();
    console.log('Neo4j connection closed');
  }
}

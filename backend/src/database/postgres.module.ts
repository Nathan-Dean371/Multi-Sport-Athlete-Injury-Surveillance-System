import { Module, Global, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'POSTGRES_POOL',
      useFactory: async (configService: ConfigService): Promise<Pool> => {
        const pool = new Pool({
          host: configService.get<string>('POSTGRES_HOST') || 'localhost',
          port: configService.get<number>('POSTGRES_PORT') || 5432,
          database: configService.get<string>('POSTGRES_DB') || 'identity_service',
          user: configService.get<string>('POSTGRES_USER') || 'postgres',
          password: configService.get<string>('POSTGRES_PASSWORD') || 'password',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        // Verify connectivity
        const client = await pool.connect();
        console.log('PostgreSQL connection established successfully');
        client.release();

        return pool;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['POSTGRES_POOL'],
})
export class PostgresModule implements OnApplicationShutdown {
  constructor(@Inject('POSTGRES_POOL') private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    console.log('PostgreSQL connection closed');
  }
}

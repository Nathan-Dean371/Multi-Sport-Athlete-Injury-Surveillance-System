import { Module, Global, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'POSTGRES_POOL',
      useFactory: async (configService: ConfigService): Promise<Pool> => {
        // Determine if SSL should be enabled
        const useSsl =
          process.env.POSTGRES_SSL === 'true' ||
          configService.get<string>('postgres.ssl') === 'true';

        const poolConfig: any = {
          host: configService.get<string>('postgres.host') || 'localhost',
          port: configService.get<number>('postgres.port') || 5432,
          database: configService.get<string>('postgres.database') || 'identity_service',
          user: configService.get<string>('postgres.user') || 'postgres',
          password: configService.get<string>('postgres.password') || 'password',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        };
        if (useSsl) {
          poolConfig.ssl = { rejectUnauthorized: false };
        }

        const pool = new Pool(poolConfig);

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

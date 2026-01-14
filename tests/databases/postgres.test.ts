/**
 * PostgreSQL Database Connection Tests
 * 
 * Tests basic connectivity and query execution for the PostgreSQL database.
 */

import { Pool, PoolClient } from 'pg';

describe('PostgreSQL Database Connection', () => {
  let pool: Pool;
  let client: PoolClient;

  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'identity_service',
    user: process.env.POSTGRES_USER || 'identity_admin',
    password: process.env.POSTGRES_PASSWORD || 'identity-service-dev-password',
  };

  beforeAll(async () => {
    pool = new Pool(config);
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    client = await pool.connect();
  });

  afterEach(async () => {
    if (client) {
      client.release();
    }
  });

  test('should successfully connect to PostgreSQL', async () => {
    const result = await client.query('SELECT NOW()');
    
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].now).toBeDefined();
  });

  test('should verify database version', async () => {
    const result = await client.query('SELECT version()');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].version).toContain('PostgreSQL');
  });

  test('should execute a simple query', async () => {
    const result = await client.query('SELECT 1 + 1 AS result');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result).toBe(2);
  });

  test('should retrieve current database name', async () => {
    const result = await client.query('SELECT current_database()');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].current_database).toBe(config.database);
  });

  test('should list tables in database', async () => {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    expect(result).toBeDefined();
    expect(result.rows).toBeDefined();
    // Tables may or may not exist yet, so just check the query works
  });

  test('should handle parameterized queries', async () => {
    const result = await client.query(
      'SELECT $1::text AS name, $2::int AS age',
      ['Test User', 25]
    );
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Test User');
    expect(result.rows[0].age).toBe(25);
  });

  test('should verify connection pool size', async () => {
    expect(pool.totalCount).toBeGreaterThanOrEqual(0);
    expect(pool.idleCount).toBeGreaterThanOrEqual(0);
    expect(pool.waitingCount).toBeGreaterThanOrEqual(0);
  });
});

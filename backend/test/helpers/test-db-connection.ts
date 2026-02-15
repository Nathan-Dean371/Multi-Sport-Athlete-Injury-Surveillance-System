import { Pool } from "pg";
import { ConfigService } from "@nestjs/config";
import * as neo4j from "neo4j-driver";

/**
 * Create test database connections
 * Uses .env.test configuration
 */
export function createTestDatabaseConnections() {
  // Read from .env.test
  const postgresConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DB || "identity_service_test",
    user: process.env.POSTGRES_USER || "identity_admin",
    password: process.env.POSTGRES_PASSWORD,
  };

  const neo4jConfig = {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    username: process.env.NEO4J_USERNAME || "neo4j",
    password: process.env.NEO4J_PASSWORD,
  };

  const postgresPool = new Pool(postgresConfig);

  const neo4jDriver = neo4j.driver(
    neo4jConfig.uri,
    neo4j.auth.basic(neo4jConfig.username, neo4jConfig.password),
  );

  return {
    postgresPool,
    neo4jDriver,
    async close() {
      await postgresPool.end();
      await neo4jDriver.close();
    },
  };
}

/**
 * Verify test database connections
 */
export async function verifyTestDatabaseConnections(
  postgresPool: Pool,
  neo4jDriver: neo4j.Driver,
): Promise<void> {
  // Test PostgreSQL
  const pgClient = await postgresPool.connect();
  try {
    const result = await pgClient.query("SELECT NOW()");
    console.log("✅ PostgreSQL test database connected");
  } finally {
    pgClient.release();
  }

  // Test Neo4j
  const session = neo4jDriver.session();
  try {
    await session.run("RETURN 1");
    console.log("✅ Neo4j test database connected");
  } finally {
    await session.close();
  }
}

import { Pool } from "pg";
import { Driver } from "neo4j-driver";

/**
 * Clean PostgreSQL test database
 * Removes all data from tables while preserving schema
 */
export async function cleanPostgresTestDb(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete in order respecting foreign key constraints
    await client.query("DELETE FROM data_access_log");
    await client.query("DELETE FROM data_deletion_requests");
    await client.query("DELETE FROM data_export_requests");
    await client.query("DELETE FROM user_accounts");
    await client.query("DELETE FROM player_identities");
    await client.query("DELETE FROM coach_identities");
    await client.query("DELETE FROM admin_identities");

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clean Neo4j test database
 * Removes all nodes and relationships
 *
 * ✅ SAFE TO USE - Connected to dedicated test container!
 * .env.test points to bolt://localhost:7688 (injury-surveillance-neo4j-test)
 * This will NOT affect your development data.
 */
export async function cleanNeo4jTestDb(driver: Driver): Promise<void> {
  const session = driver.session();
  try {
    // Delete all nodes and relationships
    await session.run("MATCH (n) DETACH DELETE n");
  } finally {
    await session.close();
  }
}

/**
 * Clean all test databases
 */
export async function cleanAllTestDatabases(
  postgresPool: Pool,
  neo4jDriver: Driver,
): Promise<void> {
  await cleanPostgresTestDb(postgresPool);
  await cleanNeo4jTestDb(neo4jDriver);
}

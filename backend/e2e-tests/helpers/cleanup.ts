import { Pool } from "pg";
import { Driver } from "neo4j-driver";

/**
 * Clean PostgreSQL test database
 * Removes all data from tables while preserving schema
 */
export async function cleanPostgresTestDb(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Get all tables that currently exist in public schema
    const tableResult = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`,
    );
    const existingTables = tableResult.rows.map((row: any) => row.tablename);

    // Define the order we want to truncate (respecting FK constraints)
    const tablesToClean = [
      "parent_invitations",
      "parent_identities",
      "user_accounts",
      "player_identities",
      "coach_identities",
      "admin_identities",
      "data_access_log",
      "data_deletion_requests",
      "data_export_requests",
    ];

    // Only truncate tables that exist
    for (const table of tablesToClean) {
      if (existingTables.includes(table)) {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      }
    }
  } catch (error) {
    console.warn("Database cleanup warning:", (error as Error).message);
    // Don't throw - cleanup failures shouldn't fail tests
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

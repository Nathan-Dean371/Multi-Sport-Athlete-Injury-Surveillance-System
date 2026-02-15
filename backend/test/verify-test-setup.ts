/**
 * Verify Test Database Setup
 * Run this script to ensure test databases are configured correctly
 *
 * Usage: ts-node test/verify-test-setup.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { Pool } from "pg";
import * as neo4j from "neo4j-driver";

// Load test environment
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

async function verifySetup() {
  console.log("\n🔍 Verifying Test Database Setup...\n");

  // PostgreSQL connection
  const postgresConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DB || "identity_service_test",
    user: process.env.POSTGRES_USER || "identity_admin",
    password: process.env.POSTGRES_PASSWORD || "",
  };

  console.log("📊 PostgreSQL Configuration:");
  console.log(`   Host: ${postgresConfig.host}`);
  console.log(`   Port: ${postgresConfig.port}`);
  console.log(`   Database: ${postgresConfig.database}`);
  console.log(`   User: ${postgresConfig.user}\n`);

  const pool = new Pool(postgresConfig);

  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), version()");
    console.log("✅ PostgreSQL Connected");
    console.log(`   Database: ${result.rows[0].current_database}`);

    // Check tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`   Tables: ${tablesResult.rows.length} found`);
    tablesResult.rows.forEach((row: { table_name: string }) => {
      console.log(`     - ${row.table_name}`);
    });

    client.release();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ PostgreSQL Connection Failed:", message);
  }

  // Neo4j connection
  const neo4jConfig = {
    uri: process.env.NEO4J_URI || "bolt://localhost:7687",
    username: process.env.NEO4J_USERNAME || "neo4j",
    password: process.env.NEO4J_PASSWORD || "",
  };

  console.log("\n📊 Neo4j Configuration:");
  console.log(`   URI: ${neo4jConfig.uri}`);
  console.log(`   Username: ${neo4jConfig.username}\n`);

  const driver = neo4j.driver(
    neo4jConfig.uri,
    neo4j.auth.basic(neo4jConfig.username, neo4jConfig.password),
  );

  try {
    // Test Neo4j connection
    const session = driver.session();
    const result = await session.run(
      "CALL dbms.components() YIELD name, versions RETURN name, versions",
    );
    console.log("✅ Neo4j Connected");
    console.log(`   Version: ${result.records[0].get("versions")[0]}`);

    // Check node count
    const countResult = await session.run("MATCH (n) RETURN count(n) as count");
    console.log(
      `   Nodes: ${countResult.records[0].get("count").toNumber()} found`,
    );

    await session.close();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Neo4j Connection Failed:", message);
  }

  // Cleanup
  await pool.end();
  await driver.close();

  console.log("\n✅ Test database setup verification complete!\n");
  console.log("Next steps:");
  console.log("  1. Run: npm run test:e2e (when E2E tests are created)");
  console.log("  2. Or run individual test files\n");
}

verifySetup().catch(console.error);

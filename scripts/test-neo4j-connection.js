#!/usr/bin/env node

/**
 * Multi-Sport Athlete Injury Surveillance System
 * Neo4j Connection Test Script
 * 
 * This script tests the connection to your Neo4j database and runs
 * basic queries to verify everything is working correctly.
 * 
 * Usage:
 *   npm install neo4j-driver
 *   node test-neo4j-connection.js
 * 
 * Or with environment variables:
 *   NEO4J_URI=bolt://localhost:7687 NEO4J_USER=neo4j NEO4J_PASSWORD=your-password node test-neo4j-connection.js
 */

const neo4j = require('neo4j-driver');

// Configuration - can be overridden with environment variables
const config = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'injury-surveillance-dev-password',
  database: process.env.NEO4J_DATABASE || 'neo4j'
};

// Guardrails: fail fast if password placeholder is still in use
if (config.password === 'your-password-here') {
  console.error(`${colors.red}✗${colors.reset} NEO4J_PASSWORD is not set. Pass it via env or update the default.`);
  process.exit(1);
}

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function heading(message) {
  console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

// Main test function
async function testConnection() {
  let driver;
  
  try {
    heading('Neo4j Connection Test');
    info(`Connecting to: ${config.uri}`);
    info(`Database: ${config.database}`);
    info(`User: ${config.user}\n`);

    // Create driver
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    );

    // Verify connectivity
    await driver.verifyConnectivity();
    success('Successfully connected to Neo4j!');

    // Get session
    const session = driver.session({ database: config.database });

    try {
      // Test 1: Basic query
      heading('Test 1: Basic Query');
      const result1 = await session.run(
        'RETURN "Hello from Neo4j!" AS message, datetime() AS timestamp'
      );
      const record = result1.records[0];
      success(`Message: ${record.get('message')}`);
      info(`Server time: ${record.get('timestamp')}`);

      // Test 2: Database info
      heading('Test 2: Database Information');
      const result2 = await session.run(
        'CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] AS version, edition'
      );
      result2.records.forEach(rec => {
        info(`${rec.get('name')}: ${rec.get('version')} (${rec.get('edition')})`);
      });

      // Test 3: Check constraints
      heading('Test 3: Schema Constraints');
      const result3 = await session.run('SHOW CONSTRAINTS YIELD *');
      const constraintCount = result3.records.length;
      if (constraintCount > 0) {
        success(`Found ${constraintCount} constraints`);
        result3.records.slice(0, 3).forEach(rec => {
          info(`  - ${rec.get('name')}: ${rec.get('type')}`);
        });
        if (constraintCount > 3) {
          info(`  ... and ${constraintCount - 3} more`);
        }
      } else {
        warning('No constraints found. Run schema-setup.cypher first!');
      }

      // Test 4: Check indexes
      heading('Test 4: Database Indexes');
      const result4 = await session.run(
        `SHOW INDEXES YIELD * 
         WHERE type <> 'LOOKUP' 
         RETURN count(*) AS indexCount`
      );
      const indexCount = result4.records[0].get('indexCount').toNumber();
      if (indexCount > 0) {
        success(`Found ${indexCount} indexes`);
      } else {
        warning('No indexes found. Run schema-setup.cypher first!');
      }

      // Test 5: Count nodes
      heading('Test 5: Node Counts');
      const result5 = await session.run(
        `MATCH (n)
         RETURN labels(n)[0] AS label, count(*) AS count
         ORDER BY count DESC`
      );
      if (result5.records.length > 0) {
        success('Database contains data:');
        result5.records.forEach(rec => {
          const label = rec.get('label') || 'Unknown';
          const count = rec.get('count').toNumber();
          info(`  ${label}: ${count}`);
        });
      } else {
        warning('No data found. Run sample-data.cypher to add test data!');
      }

      // Test 6: Test a complex query
      heading('Test 6: Complex Query Test');
      const result6 = await session.run(
        `MATCH (p:Player)-[:PLAYS_FOR]->(t:Team)-[:BELONGS_TO]->(o:Organization)
         RETURN count(*) AS playerTeamCount`
      );
      const playerTeamCount = result6.records[0].get('playerTeamCount').toNumber();
      if (playerTeamCount > 0) {
        success(`Found ${playerTeamCount} player-team relationships`);
      } else {
        info('No player-team relationships found yet');
      }

      // Test 7: Check query performance
      heading('Test 7: Query Performance');
      const startTime = Date.now();
      await session.run(
        `MATCH (p:Player {playerId: 'PLAYER-001'})
         RETURN p`
      );
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      if (queryTime < 100) {
        success(`Query executed in ${queryTime}ms (excellent!)`);
      } else if (queryTime < 500) {
        success(`Query executed in ${queryTime}ms (good)`);
      } else {
        warning(`Query executed in ${queryTime}ms (consider optimizing indexes)`);
      }

      // Test 8: Write test (create and delete a test node)
      heading('Test 8: Write Operations');
      const testId = `TEST-${Date.now()}`;
      await session.run(
        `CREATE (t:TestNode {testId: $testId, createdAt: datetime()})
         RETURN t`,
        { testId }
      );
      success('Created test node');
      
      await session.run(
        `MATCH (t:TestNode {testId: $testId})
         DELETE t`,
        { testId }
      );
      success('Deleted test node');
      info('Write operations working correctly');

      // Summary
      heading('Connection Test Summary');
      success('All tests passed!');
      info('Your Neo4j database is ready for development.');
      
      // Next steps
      console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
      if (constraintCount === 0) {
        info('1. Run schema-setup.cypher to create constraints and indexes');
      }
      if (result5.records.length === 0) {
        info(`${constraintCount === 0 ? '2' : '1'}. Run sample-data.cypher to add test data`);
      }
      info(`${constraintCount === 0 ? (result5.records.length === 0 ? '3' : '2') : (result5.records.length === 0 ? '2' : '1')}. Configure your backend to use these connection details`);
      info(`${constraintCount === 0 ? (result5.records.length === 0 ? '4' : '3') : (result5.records.length === 0 ? '3' : '2')}. Start building your NestJS services!`);

    } finally {
      await session.close();
    }

  } catch (err) {
    error('\nConnection test failed!');
    
    if (err.code === 'ServiceUnavailable') {
      error('Cannot connect to Neo4j server');
      info('Troubleshooting:');
      info('  1. Check if Neo4j is running');
      info('  2. Verify the URI is correct: ' + config.uri);
      info('  3. Check if firewall is blocking port 7687');
    } else if (err.code === 'Neo.ClientError.Security.Unauthorized') {
      error('Authentication failed');
      info('Troubleshooting:');
      info('  1. Verify your username: ' + config.user);
      info('  2. Check your password');
      info('  3. For new installations, default is neo4j/neo4j (you\'ll be prompted to change)');
    } else if (err.code === 'Neo.ClientError.Database.DatabaseNotFound') {
      error('Database not found: ' + config.database);
      info('Use database: "neo4j" or create the specified database first');
    } else {
      error('Error: ' + err.message);
      if (err.code) {
        info('Error code: ' + err.code);
      }
    }
    
    console.error('\n' + colors.red + 'Full error details:' + colors.reset);
    console.error(err);
    process.exit(1);

  } finally {
    if (driver) {
      await driver.close();
      info('\nConnection closed.');
    }
  }
}

// Display help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Neo4j Connection Test Script${colors.reset}

${colors.bright}Usage:${colors.reset}
  node test-neo4j-connection.js

${colors.bright}Environment Variables:${colors.reset}
  NEO4J_URI       Database URI (default: bolt://localhost:7687)
  NEO4J_USER      Username (default: neo4j)
  NEO4J_PASSWORD  Password (required)
  NEO4J_DATABASE  Database name (default: neo4j)

${colors.bright}Example:${colors.reset}
  NEO4J_URI=bolt://localhost:7687 \\
  NEO4J_USER=neo4j \\
  NEO4J_PASSWORD=mypassword \\
  node test-neo4j-connection.js

${colors.bright}For Neo4j Aura (Cloud):${colors.reset}
  NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io \\
  NEO4J_USER=neo4j \\
  NEO4J_PASSWORD=your-aura-password \\
  node test-neo4j-connection.js
  `);
  process.exit(0);
}

// Run the test
testConnection();

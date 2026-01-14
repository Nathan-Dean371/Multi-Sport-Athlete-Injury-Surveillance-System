/**
 * Neo4j Database Connection Tests
 * 
 * Tests basic connectivity and query execution for the Neo4j graph database.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

describe('Neo4j Database Connection', () => {
  let driver: Driver;
  let session: Session;

  const config = {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'injury-surveillance-dev-password',
    database: process.env.NEO4J_DATABASE || 'neo4j'
  };

  beforeAll(async () => {
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password)
    );
  });

  afterAll(async () => {
    if (driver) {
      await driver.close();
    }
  });

  beforeEach(() => {
    session = driver.session({ database: config.database });
  });

  afterEach(async () => {
    if (session) {
      await session.close();
    }
  });

  test('should successfully connect to Neo4j', async () => {
    const serverInfo = await driver.getServerInfo();
    
    expect(serverInfo).toBeDefined();
    expect(serverInfo.address).toContain('localhost:7687');
  });

  test('should verify database is accessible', async () => {
    // verifyConnectivity throws on failure, succeeds (returns undefined) on success
    await expect(driver.verifyConnectivity()).resolves.not.toThrow();
  });

  test('should execute a simple query', async () => {
    const result = await session.run('RETURN 1 AS number');
    const record = result.records[0];
    
    expect(record).toBeDefined();
    const num = record.get('number');
    expect(typeof num === 'number' ? num : num.toNumber()).toBe(1);
  });

  test('should retrieve database version', async () => {
    const result = await session.run(
      'CALL dbms.components() YIELD name, versions, edition RETURN name, versions, edition'
    );
    
    expect(result.records.length).toBeGreaterThan(0);
    
    const record = result.records[0];
    expect(record.get('name')).toBe('Neo4j Kernel');
    expect(record.get('versions')).toBeDefined();
  });

  test('should count nodes in database', async () => {
    const result = await session.run('MATCH (n) RETURN count(n) AS nodeCount');
    const nodeCount = result.records[0].get('nodeCount');
    
    expect(nodeCount).toBeDefined();
    const count = typeof nodeCount === 'number' ? nodeCount : nodeCount.toNumber();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle query with parameters', async () => {
    const result = await session.run(
      'RETURN $name AS name, $age AS age',
      { name: 'Test User', age: 25 }
    );
    
    const record = result.records[0];
    expect(record.get('name')).toBe('Test User');
    // Neo4j returns numbers as JavaScript numbers for small integers
    const age = record.get('age');
    expect(typeof age === 'number' ? age : age.toNumber()).toBe(25);
  });
});

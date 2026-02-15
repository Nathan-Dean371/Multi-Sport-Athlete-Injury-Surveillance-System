import { Pool } from "pg";
import { Driver } from "neo4j-driver";
import * as bcrypt from "bcrypt";

/**
 * Seed test data for integration tests
 * Creates minimal data needed for E2E tests
 */

export interface TestDataIds {
  admin: {
    email: string;
    pseudonymId: string;
    password: string;
  };
  coach: {
    email: string;
    pseudonymId: string;
    password: string;
  };
  player: {
    email: string;
    pseudonymId: string;
    password: string;
  };
  team: {
    teamId: string;
    name: string;
  };
}

/**
 * Seed PostgreSQL test data
 */
export async function seedPostgresTestData(pool: Pool): Promise<TestDataIds> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

    // Create admin identity
    const adminResult = await client.query(
      `
      INSERT INTO admin_identities (pseudonym_id, first_name, last_name, email, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING pseudonym_id
    `,
      ["TEST-ADMIN-001", "Test", "Admin", "admin@test.com", "+1234567890"],
    );

    // Create admin user account
    await client.query(
      `
      INSERT INTO user_accounts (pseudonym_id, email, password_hash, role, account_status)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        adminResult.rows[0].pseudonym_id,
        "admin@test.com",
        hashedPassword,
        "admin",
        "active",
      ],
    );

    // Create coach identity
    const coachResult = await client.query(
      `
      INSERT INTO coach_identities (pseudonym_id, first_name, last_name, email, phone, specialization)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING pseudonym_id
    `,
      [
        "TEST-COACH-001",
        "Test",
        "Coach",
        "coach@test.com",
        "+1234567891",
        "Strength & Conditioning",
      ],
    );

    // Create coach user account
    await client.query(
      `
      INSERT INTO user_accounts (pseudonym_id, email, password_hash, role, account_status)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        coachResult.rows[0].pseudonym_id,
        "coach@test.com",
        hashedPassword,
        "coach",
        "active",
      ],
    );

    // Create player identity
    const playerResult = await client.query(
      `
      INSERT INTO player_identities (pseudonym_id, first_name, last_name, date_of_birth, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING pseudonym_id
    `,
      [
        "TEST-PLAYER-001",
        "Test",
        "Player",
        "2000-01-15",
        "player@test.com",
        "+1234567892",
      ],
    );

    // Create player user account
    await client.query(
      `
      INSERT INTO user_accounts (pseudonym_id, email, password_hash, role, account_status)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        playerResult.rows[0].pseudonym_id,
        "player@test.com",
        hashedPassword,
        "player",
        "active",
      ],
    );

    await client.query("COMMIT");

    return {
      admin: {
        email: "admin@test.com",
        pseudonymId: adminResult.rows[0].pseudonym_id,
        password: "TestPassword123!",
      },
      coach: {
        email: "coach@test.com",
        pseudonymId: coachResult.rows[0].pseudonym_id,
        password: "TestPassword123!",
      },
      player: {
        email: "player@test.com",
        pseudonymId: playerResult.rows[0].pseudonym_id,
        password: "TestPassword123!",
      },
      team: {
        teamId: "TEST-TEAM-001",
        name: "Test Team",
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed Neo4j test data
 */
export async function seedNeo4jTestData(
  driver: Driver,
  testIds: TestDataIds,
): Promise<void> {
  const session = driver.session();

  try {
    // Create Organization
    await session.run(`
      CREATE (o:Organization {
        orgId: 'TEST-ORG-001',
        name: 'Test Organization',
        type: 'GAA Club'
      })
    `);

    // Create Sport
    await session.run(`
      CREATE (s:Sport {
        sportId: 'SPORT-001',
        name: 'Gaelic Football',
        category: 'Field Sport'
      })
    `);

    // Create Team
    await session.run(
      `
      MATCH (o:Organization {orgId: 'TEST-ORG-001'})
      MATCH (s:Sport {sportId: 'SPORT-001'})
      CREATE (t:Team {
        teamId: $teamId,
        name: $teamName,
        ageGroup: 'Senior',
        gender: 'Male'
      })
      CREATE (t)-[:BELONGS_TO]->(o)
      CREATE (t)-[:PLAYS]->(s)
    `,
      { teamId: testIds.team.teamId, teamName: testIds.team.name },
    );

    // Create Coach node
    await session.run(
      `
      MATCH (t:Team {teamId: $teamId})
      CREATE (c:Coach {
        coachId: 'TEST-COACH-001',
        pseudonymId: $coachPseudonymId,
        specialization: 'Strength & Conditioning'
      })
      CREATE (c)-[:MANAGES]->(t)
    `,
      {
        teamId: testIds.team.teamId,
        coachPseudonymId: testIds.coach.pseudonymId,
      },
    );

    // Create Player node
    await session.run(
      `
      MATCH (t:Team {teamId: $teamId})
      CREATE (p:Player {
        playerId: 'TEST-PLAYER-001',
        pseudonymId: $playerPseudonymId,
        position: 'Forward',
        jerseyNumber: '10',
        dateOfBirth: date('2000-01-15'),
        ageGroup: 'Senior'
      })
      CREATE (p)-[:PLAYS_FOR]->(t)
    `,
      {
        teamId: testIds.team.teamId,
        playerPseudonymId: testIds.player.pseudonymId,
      },
    );
  } finally {
    await session.close();
  }
}

/**
 * Seed all test databases
 */
export async function seedAllTestDatabases(
  postgresPool: Pool,
  neo4jDriver: Driver,
): Promise<TestDataIds> {
  const testIds = await seedPostgresTestData(postgresPool);
  await seedNeo4jTestData(neo4jDriver, testIds);
  return testIds;
}

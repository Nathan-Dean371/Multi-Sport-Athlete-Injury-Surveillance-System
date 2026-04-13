import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { Pool } from "pg";
import { PlayerDto, PlayerListDto } from "./dto/player.dto";
import { PlayerAdminDto, PlayerAdminListDto } from "./dto/player-admin.dto";
import { PlayerInjuriesDto, InjuryDto } from "./dto/injury.dto";
import { AcceptPlayerInvitationDto } from "./dto/accept-player-invitation.dto";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { UpdatePlayerAdminDto } from "./dto/update-player-admin.dto";

@Injectable()
export class PlayersService {
  constructor(
    @Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver,
    @Inject("POSTGRES_POOL") private readonly pool: Pool,
  ) {}

  async acceptInvite(dto: AcceptPlayerInvitationDto) {
    const client = await this.pool.connect();
    const neo4jSession: Session = this.neo4jDriver.session();

    try {
      await client.query("BEGIN");

      const inviteRes = await client.query(
        `SELECT * FROM player_invitations WHERE token = $1`,
        [dto.token],
      );

      if (inviteRes.rows.length === 0) {
        throw new NotFoundException("Invitation not found");
      }

      const invitation = inviteRes.rows[0];

      if (invitation.accepted) {
        throw new BadRequestException("Invitation already accepted");
      }

      // Ensure the parent exists in Postgres (needed to link player identity)
      const parentRes = await client.query(
        `SELECT parent_id, pseudonym_id FROM parent_identities WHERE pseudonym_id = $1`,
        [invitation.parent_pseudonym_id],
      );

      if (parentRes.rows.length === 0) {
        throw new NotFoundException("Parent not found for invitation");
      }

      const parentId = parentRes.rows[0].parent_id;
      const email = invitation.email;
      const firstName = invitation.first_name;
      const lastName = invitation.last_name;

      // Prevent duplicate account creation
      const existingUser = await client.query(
        `SELECT id FROM user_accounts WHERE email = $1`,
        [email],
      );
      if (existingUser.rows.length > 0) {
        throw new BadRequestException("Account already exists for this email");
      }

      const pseudonymId =
        dto.pseudonymId ||
        `PSY-PLAYER-${randomBytes(4).toString("hex").toUpperCase()}`;
      const neo4jPlayerId = `PLAYER-${randomBytes(4).toString("hex").toUpperCase()}`;

      const playerIdentityResult = await client.query(
        `INSERT INTO player_identities
         (pseudonym_id, neo4j_player_id, first_name, last_name, date_of_birth, email, parent_id, is_active, gdpr_consent_given, gdpr_consent_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, CURRENT_TIMESTAMP, NOW(), NOW())
         RETURNING id`,
        [
          pseudonymId,
          neo4jPlayerId,
          firstName,
          lastName,
          dto.dateOfBirth,
          email,
          parentId,
        ],
      );

      const playerIdentityId = playerIdentityResult.rows[0].id;

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const passwordSalt = "bcrypt";

      await client.query(
        `INSERT INTO user_accounts
         (email, password_hash, password_salt, identity_type, pseudonym_id, identity_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          email,
          passwordHash,
          passwordSalt,
          "player",
          pseudonymId,
          playerIdentityId,
        ],
      );

      await client.query(
        `UPDATE player_invitations
         SET accepted = true, accepted_at = NOW()
         WHERE token = $1`,
        [dto.token],
      );

      // Ensure parent node exists in Neo4j, then create player node and relationship
      await neo4jSession.run(
        `MERGE (p:Parent {pseudonymId: $parentPseudonymId})
         ON CREATE SET p.parentId = $parentPseudonymId, p.createdAt = datetime()`,
        { parentPseudonymId: invitation.parent_pseudonym_id },
      );

      await neo4jSession.run(
        `CREATE (pl:Player {
          playerId: $playerId,
          pseudonymId: $pseudonymId,
          isActive: true,
          createdAt: datetime(),
          updatedAt: datetime()
        })`,
        { playerId: neo4jPlayerId, pseudonymId },
      );

      await neo4jSession.run(
        `MATCH (p:Parent {pseudonymId: $parentPseudonymId})
         MATCH (pl:Player {pseudonymId: $playerPseudonymId})
         MERGE (p)-[:PARENT_OF {createdAt: datetime()}]->(pl)`,
        {
          parentPseudonymId: invitation.parent_pseudonym_id,
          playerPseudonymId: pseudonymId,
        },
      );

      await client.query("COMMIT");

      return {
        message: "Player invitation accepted successfully",
        player: {
          playerId: neo4jPlayerId,
          pseudonymId,
          email,
          firstName,
          lastName,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      await neo4jSession.close();
    }
  }

  async findAll(): Promise<PlayerListDto> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(`
        MATCH (p:Player)
        OPTIONAL MATCH (p)-[:PLAYS_FOR]->(t:Team)
        RETURN p, t.name as teamName
        ORDER BY p.name
      `);

      const players: PlayerDto[] = result.records.map((record) => {
        const player = record.get("p").properties;
        return {
          playerId: player.playerId,
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth,
          ageGroup: player.ageGroup,
          isActive: player.isActive,
          teamName: record.get("teamName"),
        };
      });

      return {
        players,
        total: players.length,
      };
    } finally {
      await session.close();
    }
  }

  async findOne(playerId: string): Promise<PlayerDto> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Player {pseudonymId: $playerId})
        OPTIONAL MATCH (p)-[:PLAYS_FOR]->(t:Team)
        RETURN p, 
               t.teamId as teamId, 
               t.name as teamName,
               t.sport as sport
        `,
        { playerId },
      );

      if (result.records.length === 0) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      const record = result.records[0];
      const player = record.get("p").properties;
      const teamId = record.get("teamId");
      const teamName = record.get("teamName");
      const sport = record.get("sport");

      return {
        playerId: player.playerId,
        name: player.name,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        dateOfBirth: player.dateOfBirth,
        ageGroup: player.ageGroup,
        isActive: player.isActive,
        teamId,
        teamName,
        team: teamId
          ? {
              teamId,
              teamName,
              sport,
            }
          : undefined,
      };
    } finally {
      await session.close();
    }
  }

  async findPlayerInjuries(playerId: string): Promise<PlayerInjuriesDto> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Player {pseudonymId: $playerId})
        OPTIONAL MATCH (p)-[r:SUSTAINED]->(i:Injury)
        RETURN p, 
               collect({
                 injury: i,
                 diagnosedDate: r.diagnosedDate,
                 reportedBy: r.reportedBy
               }) as injuries
        `,
        { playerId },
      );

      if (result.records.length === 0) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      const record = result.records[0];
      const player = record.get("p").properties;
      const injuriesData = record.get("injuries");

      const injuries: InjuryDto[] = injuriesData
        .filter((item: any) => item.injury !== null)
        .map((item: any) => {
          const injury = item.injury.properties;
          return {
            injuryId: injury.injuryId,
            injuryType: injury.injuryType,
            bodyPart: injury.bodyPart,
            side: injury.side,
            severity: injury.severity,
            status: injury.status,
            injuryDate: injury.injuryDate
              ? injury.injuryDate.toString()
              : undefined,
            expectedReturnDate: injury.expectedReturnDate
              ? injury.expectedReturnDate.toString()
              : undefined,
            actualReturnDate: injury.actualReturnDate
              ? injury.actualReturnDate.toString()
              : undefined,
            mechanism: injury.mechanism,
            diagnosis: injury.diagnosis,
            treatmentPlan: injury.treatmentPlan,
            notes: injury.notes,
            diagnosedDate: item.diagnosedDate
              ? item.diagnosedDate.toString()
              : undefined,
            reportedBy: item.reportedBy,
          };
        });

      return {
        playerId: player.playerId,
        playerName: player.name,
        injuries,
        total: injuries.length,
      };
    } finally {
      await session.close();
    }
  }

  async findAllForAdmin(): Promise<PlayerAdminListDto> {
    // Get player data from Neo4j
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(`
        MATCH (player:Player)
        OPTIONAL MATCH (player)-[:PLAYS_FOR]->(team:Team)
        OPTIONAL MATCH (player)-[:SUSTAINED]->(injury:Injury)
        RETURN player.pseudonymId as pseudonymId,
               player.position as position,
               team.name as teamName,
               count(DISTINCT injury) as injuryCount
        ORDER BY player.pseudonymId
      `);

      const pseudonymIds = result.records.map((r) => r.get("pseudonymId"));
      const playerData = new Map(
        result.records.map((r) => [
          r.get("pseudonymId"),
          {
            position: r.get("position"),
            teamName: r.get("teamName"),
            injuryCount: r.get("injuryCount").toNumber(),
          },
        ]),
      );

      if (pseudonymIds.length === 0) {
        return { players: [], total: 0 };
      }

      // Get identity data from PostgreSQL
      const client = await this.pool.connect();
      try {
        const identityResult = await client.query(
          `SELECT 
             pi.id as player_id,
             pi.pseudonym_id,
             pi.first_name,
             pi.last_name,
             pi.email,
             pi.date_of_birth,
             COALESCE(pi.is_active, true) as is_active
           FROM player_identities pi
           WHERE pi.pseudonym_id = ANY($1::text[])
           ORDER BY pi.last_name, pi.first_name`,
          [pseudonymIds],
        );

        const players: PlayerAdminDto[] = identityResult.rows.map((row) => {
          const neo4jData = playerData.get(row.pseudonym_id);
          return {
            playerId: row.player_id,
            pseudonymId: row.pseudonym_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            dateOfBirth: row.date_of_birth,
            position: neo4jData?.position || null,
            teamName: neo4jData?.teamName || null,
            injuryCount: neo4jData?.injuryCount || 0,
            isActive: row.is_active ?? true,
          };
        });

        return {
          players,
          total: players.length,
        };
      } finally {
        client.release();
      }
    } finally {
      await session.close();
    }
  }

  async getAdminProfile(pseudonymId: string) {
    const client = await this.pool.connect();
    const session = this.neo4jDriver.session();

    try {
      const res = await client.query(
        `SELECT
           pi.id as player_id,
           pi.pseudonym_id,
           pi.first_name,
           pi.last_name,
           pi.email,
           pi.date_of_birth,
           COALESCE(pi.is_active, true) as identity_is_active,
           ua.id as user_account_id,
           ua.email as account_email,
           COALESCE(ua.is_active, pi.is_active, true) as is_active
         FROM player_identities pi
         LEFT JOIN user_accounts ua
           ON ua.pseudonym_id = pi.pseudonym_id AND ua.identity_type = 'player'
         WHERE pi.pseudonym_id = $1
         LIMIT 1`,
        [pseudonymId],
      );

      if (res.rows.length === 0) {
        throw new NotFoundException(`Player identity ${pseudonymId} not found`);
      }

      const row = res.rows[0];
      return {
        playerId: row.player_id,
        pseudonymId: row.pseudonym_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.account_email ?? row.email ?? null,
        dateOfBirth: row.date_of_birth,
        isActive: row.is_active ?? true,
      };
    } finally {
      client.release();
      await session.close();
    }
  }

  async updateAdminProfile(pseudonymId: string, dto: UpdatePlayerAdminDto) {
    const client = await this.pool.connect();
    const neo4jSession: Session = this.neo4jDriver.session();

    try {
      await client.query("BEGIN");

      const existingRes = await client.query(
        `SELECT
           pi.id as player_id,
           ua.id as user_account_id
         FROM player_identities pi
         LEFT JOIN user_accounts ua
           ON ua.pseudonym_id = pi.pseudonym_id AND ua.identity_type = 'player'
         WHERE pi.pseudonym_id = $1
         LIMIT 1`,
        [pseudonymId],
      );

      if (existingRes.rows.length === 0) {
        throw new NotFoundException(`Player identity ${pseudonymId} not found`);
      }

      const accountId: string | null =
        existingRes.rows[0].user_account_id || null;

      if (dto.email && accountId) {
        const emailConflict = await client.query(
          `SELECT 1 FROM user_accounts WHERE email = $1 AND id <> $2 LIMIT 1`,
          [dto.email, accountId],
        );
        if (emailConflict.rows.length > 0) {
          throw new ConflictException("Email address is already in use");
        }
      }

      await client.query(
        `UPDATE player_identities
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             email = COALESCE($4, email),
             is_active = COALESCE($5, is_active),
             updated_at = NOW()
         WHERE pseudonym_id = $1`,
        [
          pseudonymId,
          dto.firstName ?? null,
          dto.lastName ?? null,
          dto.email ?? null,
          dto.isActive ?? null,
        ],
      );

      if (accountId) {
        await client.query(
          `UPDATE user_accounts
           SET email = COALESCE($2, email),
               is_active = COALESCE($3, is_active),
               updated_at = NOW()
           WHERE id = $1`,
          [accountId, dto.email ?? null, dto.isActive ?? null],
        );
      }

      await client.query("COMMIT");

      if (dto.isActive !== undefined) {
        try {
          await neo4jSession.run(
            `MATCH (p:Player {pseudonymId: $pseudonymId})
             SET p.isActive = $isActive,
                 p.updatedAt = datetime()`,
            { pseudonymId, isActive: dto.isActive },
          );
        } catch {
          // Best-effort only
        }
      }

      return this.getAdminProfile(pseudonymId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      await neo4jSession.close();
    }
  }
}

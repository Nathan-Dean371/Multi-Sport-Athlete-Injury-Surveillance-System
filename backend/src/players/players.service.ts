import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Driver } from "neo4j-driver";
import { Pool } from "pg";
import { PlayerDto, PlayerListDto } from "./dto/player.dto";
import { PlayerAdminDto, PlayerAdminListDto } from "./dto/player-admin.dto";
import { PlayerInjuriesDto, InjuryDto } from "./dto/injury.dto";

@Injectable()
export class PlayersService {
  constructor(
    @Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver,
    @Inject("POSTGRES_POOL") private readonly pool: Pool,
  ) {}

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
}

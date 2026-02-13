import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Driver } from 'neo4j-driver';
import { PlayerDto, PlayerListDto } from './dto/player.dto';
import { PlayerInjuriesDto, InjuryDto } from './dto/injury.dto';

@Injectable()
export class PlayersService {
  constructor(@Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver) {}

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
        const player = record.get('p').properties;
        return {
          playerId: player.playerId,
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth,
          ageGroup: player.ageGroup,
          isActive: player.isActive,
          teamName: record.get('teamName'),
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
        RETURN p, t.teamId as teamId, t.name as teamName
        `,
        { playerId }
      );

      if (result.records.length === 0) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      const record = result.records[0];
      const player = record.get('p').properties;

      return {
        playerId: player.playerId,
        name: player.name,
        position: player.position,
        dateOfBirth: player.dateOfBirth,
        ageGroup: player.ageGroup,
        isActive: player.isActive,
        teamId: record.get('teamId'),
        teamName: record.get('teamName'),
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
        { playerId }
      );

      if (result.records.length === 0) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      const record = result.records[0];
      const player = record.get('p').properties;
      const injuriesData = record.get('injuries');

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
            injuryDate: injury.injuryDate,
            expectedReturnDate: injury.expectedReturnDate,
            actualReturnDate: injury.actualReturnDate,
            mechanism: injury.mechanism,
            diagnosis: injury.diagnosis,
            treatmentPlan: injury.treatmentPlan,
            notes: injury.notes,
            diagnosedDate: item.diagnosedDate,
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
}

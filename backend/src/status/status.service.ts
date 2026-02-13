import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { UpdateStatusDto, PlayerStatus } from './dto/update-status.dto';
import { LatestStatusResponseDto, TeamStatusDto, PlayerStatusDto } from './dto/status-response.dto';

@Injectable()
export class StatusService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  /**
   * Update player's daily status (GREEN/ORANGE/RED)
   * Creates a StatusUpdate node linked to the player
   */
  async updatePlayerStatus(playerId: string, updateStatusDto: UpdateStatusDto): Promise<any> {
    const session: Session = this.neo4jDriver.session();

    try {
      // First verify the player exists
      const playerCheck = await session.run(
        `MATCH (p:Player {pseudonymId: $playerId}) RETURN p`,
        { playerId }
      );

      if (playerCheck.records.length === 0) {
        throw new NotFoundException(`Player ${playerId} not found`);
      }

      // Create status update node and link to player
      const query = `
        MATCH (p:Player {pseudonymId: $playerId})
        CREATE (s:StatusUpdate {
          id: randomUUID(),
          status: $status,
          date: date(),
          timestamp: datetime(),
          notes: $notes
        })
        CREATE (p)-[:HAS_STATUS]->(s)
        RETURN s, p.playerId as playerId, p.firstName as firstName, p.lastName as lastName
      `;

      const result = await session.run(query, {
        playerId,
        status: updateStatusDto.status,
        notes: updateStatusDto.notes || null,
      });

      if (result.records.length === 0) {
        throw new BadRequestException('Failed to create status update');
      }

      const record = result.records[0];
      const statusNode = record.get('s').properties;

      return {
        success: true,
        message: 'Status updated successfully',
        data: {
          playerId: record.get('playerId'),
          playerName: `${record.get('firstName')} ${record.get('lastName')}`,
          status: statusNode.status,
          notes: statusNode.notes,
          date: statusNode.date.toString(),
          timestamp: statusNode.timestamp.toString(),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update player status: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Get latest status updates for all players on teams managed by a coach
   * Returns data grouped by team with aggregated status counts
   */
  async getLatestTeamStatuses(coachPseudoId: string): Promise<LatestStatusResponseDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // Query to get all teams coached by this coach, with player statuses
      const query = `
        MATCH (c:Coach {pseudoId: $coachPseudoId})-[:COACHES]->(t:Team)
        MATCH (t)<-[:PLAYS_FOR]-(p:Player)
        OPTIONAL MATCH (p)-[:HAS_STATUS]->(s:StatusUpdate)
        WHERE s.date = date()
        OPTIONAL MATCH (p)-[:SUSTAINED]->(i:Injury {isResolved: false})
        WITH t, p, s, count(i) as activeInjuries
        ORDER BY t.name, p.lastName
        RETURN t.id as teamId, 
               t.name as teamName, 
               t.sport as sport,
               collect({
                 playerId: p.playerId,
                 firstName: p.firstName,
                 lastName: p.lastName,
                 currentStatus: COALESCE(s.status, 'UNKNOWN'),
                 statusNotes: s.notes,
                 lastUpdated: toString(s.date),
                 activeInjuryCount: activeInjuries
               }) as players
      `;

      const result = await session.run(query, { coachPseudoId });

      // Transform the result into TeamStatusDto objects
      const teams: TeamStatusDto[] = result.records.map((record) => {
        const players: PlayerStatusDto[] = record.get('players').map((p: any) => ({
          playerId: p.playerId,
          firstName: p.firstName,
          lastName: p.lastName,
          currentStatus: p.currentStatus as PlayerStatus,
          statusNotes: p.statusNotes,
          lastUpdated: p.lastUpdated,
          activeInjuryCount: p.activeInjuryCount.toNumber ? p.activeInjuryCount.toNumber() : p.activeInjuryCount,
        }));

        // Calculate status counts
        const greenCount = players.filter((p) => p.currentStatus === PlayerStatus.GREEN).length;
        const orangeCount = players.filter((p) => p.currentStatus === PlayerStatus.ORANGE).length;
        const redCount = players.filter((p) => p.currentStatus === PlayerStatus.RED).length;
        const noStatusCount = players.filter((p) => p.currentStatus === PlayerStatus.UNKNOWN).length;

        return {
          teamId: record.get('teamId'),
          teamName: record.get('teamName'),
          sport: record.get('sport'),
          players,
          statusCounts: {
            green: greenCount,
            orange: orangeCount,
            red: redCount,
            noStatus: noStatusCount,
          },
        };
      });

      return {
        teams,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve team statuses: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Get status update history for a specific player
   */
  async getPlayerStatusHistory(playerId: string): Promise<any> {
    const session: Session = this.neo4jDriver.session();

    try {
      // First verify the player exists
      const playerCheck = await session.run(
        `MATCH (p:Player {pseudonymId: $playerId}) RETURN p`,
        { playerId }
      );

      if (playerCheck.records.length === 0) {
        throw new NotFoundException(`Player ${playerId} not found`);
      }

      // Get all status updates for the player, ordered by date
      const query = `
        MATCH (p:Player {pseudonymId: $playerId})-[:HAS_STATUS]->(s:StatusUpdate)
        RETURN s.id as id,
               s.status as status,
               s.date as date,
               s.timestamp as timestamp,
               s.notes as notes
        ORDER BY s.date DESC, s.timestamp DESC
      `;

      const result = await session.run(query, { playerId });

      const statusHistory = result.records.map((record) => ({
        id: record.get('id'),
        status: record.get('status'),
        date: record.get('date').toString(),
        timestamp: record.get('timestamp').toString(),
        notes: record.get('notes'),
      }));

      return {
        playerId,
        statusHistory,
        total: statusHistory.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve status history: ${error.message}`);
    } finally {
      await session.close();
    }
  }
}

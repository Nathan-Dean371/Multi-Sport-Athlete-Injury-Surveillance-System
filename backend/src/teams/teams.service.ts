import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { TeamRosterDto, RosterPlayerDto } from './dto/team-roster.dto';
import { TeamDetailsDto, CoachInfoDto } from './dto/team-details.dto';
import { PlayerStatus } from '../status/dto/update-status.dto';

@Injectable()
export class TeamsService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  /**
   * Get team roster with current player statuses and injury counts
   */
  async getTeamRoster(teamId: string): Promise<TeamRosterDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (t:Team {id: $teamId})<-[:PLAYS_FOR]-(p:Player)
        OPTIONAL MATCH (p)-[:HAS_STATUS]->(s:StatusUpdate)
        WHERE s.date = date()
        OPTIONAL MATCH (p)-[:SUSTAINED]->(i:Injury {isResolved: false})
        WITH t, p, s, count(i) as activeInjuries
        ORDER BY p.lastName, p.firstName
        RETURN t.id as teamId,
               t.name as teamName,
               t.sport as sport,
               collect({
                 playerId: p.playerId,
                 firstName: p.firstName,
                 lastName: p.lastName,
                 position: p.position,
                 jerseyNumber: p.jerseyNumber,
                 currentStatus: s.status,
                 statusNotes: s.notes,
                 lastStatusUpdate: toString(s.date),
                 activeInjuryCount: activeInjuries
               }) as players,
               count(p) as totalPlayers,
               count(s) as playersReportedToday
      `;

      const result = await session.run(query, { teamId });

      if (result.records.length === 0) {
        throw new NotFoundException(`Team ${teamId} not found`);
      }

      const record = result.records[0];
      const playersData = record.get('players');

      // Transform players data
      const players: RosterPlayerDto[] = playersData.map((p: any) => ({
        playerId: p.playerId,
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        currentStatus: p.currentStatus as PlayerStatus,
        statusNotes: p.statusNotes,
        lastStatusUpdate: p.lastStatusUpdate,
        activeInjuryCount: p.activeInjuryCount.toNumber ? p.activeInjuryCount.toNumber() : p.activeInjuryCount,
      }));

      return {
        teamId: record.get('teamId'),
        teamName: record.get('teamName'),
        sport: record.get('sport'),
        players,
        totalPlayers: record.get('totalPlayers').toNumber(),
        playersReportedToday: record.get('playersReportedToday').toNumber(),
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve team roster: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Get detailed team information including coaches and player count
   */
  async getTeamDetails(teamId: string): Promise<TeamDetailsDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (t:Team {id: $teamId})-[:BELONGS_TO]->(o:Organization)
        OPTIONAL MATCH (t)<-[:COACHES]-(c:Coach)
        OPTIONAL MATCH (t)<-[:PLAYS_FOR]-(p:Player)
        RETURN t.id as teamId,
               t.name as name,
               t.sport as sport,
               t.ageGroup as ageGroup,
               t.gender as gender,
               o.id as organizationId,
               o.name as organizationName,
               t.seasonStart as seasonStart,
               t.seasonEnd as seasonEnd,
               collect(DISTINCT {
                 coachId: c.coachId,
                 firstName: c.firstName,
                 lastName: c.lastName,
                 role: c.role
               }) as coaches,
               count(DISTINCT p) as playerCount
      `;

      const result = await session.run(query, { teamId });

      if (result.records.length === 0) {
        throw new NotFoundException(`Team ${teamId} not found`);
      }

      const record = result.records[0];
      const coachesData = record.get('coaches');

      // Filter out null coaches (from OPTIONAL MATCH when no coaches exist)
      const coaches: CoachInfoDto[] = coachesData
        .filter((c: any) => c.coachId !== null)
        .map((c: any) => ({
          coachId: c.coachId,
          firstName: c.firstName,
          lastName: c.lastName,
          role: c.role,
        }));

      return {
        teamId: record.get('teamId'),
        name: record.get('name'),
        sport: record.get('sport'),
        ageGroup: record.get('ageGroup'),
        gender: record.get('gender'),
        organizationId: record.get('organizationId'),
        organizationName: record.get('organizationName'),
        coaches,
        playerCount: record.get('playerCount').toNumber(),
        seasonStart: record.get('seasonStart'),
        seasonEnd: record.get('seasonEnd'),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve team details: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Helper method to verify if a coach has access to a specific team
   */
  async verifyCoachAccess(coachPseudoId: string, teamId: string): Promise<boolean> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Coach {pseudoId: $coachPseudoId})-[:COACHES]->(t:Team {id: $teamId})
        RETURN count(t) > 0 as hasAccess
      `;

      const result = await session.run(query, { coachPseudoId, teamId });

      if (result.records.length === 0) {
        return false;
      }

      return result.records[0].get('hasAccess');
    } catch (error) {
      console.error('Error verifying coach access:', error);
      return false;
    } finally {
      await session.close();
    }
  }
}

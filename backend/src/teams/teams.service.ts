import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { Pool } from 'pg';
import { TeamRosterDto, RosterPlayerDto } from './dto/team-roster.dto';
import { TeamDetailsDto, CoachInfoDto } from './dto/team-details.dto';
import { PlayerStatus } from '../status/dto/update-status.dto';

@Injectable()
export class TeamsService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
    @Inject('POSTGRES_POOL') private readonly pool: Pool,
  ) {}

  /**
   * Get team roster with current player statuses and injury counts
   */
  async getTeamRoster(teamId: string): Promise<TeamRosterDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // First, get team data and player info from Neo4j
      const query = `
        MATCH (t:Team {teamId: $teamId})<-[:PLAYS_FOR]-(p:Player)
        OPTIONAL MATCH (t)-[:PLAYS]->(sp:Sport)
        OPTIONAL MATCH (p)-[:HAS_STATUS]->(s:StatusUpdate)
        WHERE s.date = date()
        OPTIONAL MATCH (p)-[:SUSTAINED]->(i:Injury {isResolved: false})
        WITH t, sp, p, s, count(i) as activeInjuries
        RETURN t.teamId as teamId,
               t.name as teamName,
               sp.name as sport,
               collect({
                 playerId: p.playerId,
                 pseudonymId: p.pseudonymId,
                 position: p.position,
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

      // Extract pseudonym IDs to query PostgreSQL
      const pseudonymIds = playersData.map((p: any) => p.pseudonymId);

      // Fetch real names from PostgreSQL identity database
      const identityMap = await this.getPlayerIdentities(pseudonymIds);
      console.log(`Fetched ${identityMap.size} player identities from PostgreSQL for ${pseudonymIds.length} pseudonym IDs`);

      // Transform players data with real names
      const players: RosterPlayerDto[] = playersData.map((p: any) => {
        const identity = identityMap.get(p.pseudonymId);
        return {
          playerId: p.playerId,
          pseudonymId: p.pseudonymId,
          firstName: identity?.firstName || 'Unknown',
          lastName: identity?.lastName || 'Player',
          position: p.position,
          jerseyNumber: '', // Will be assigned after sorting
          currentStatus: p.currentStatus as PlayerStatus,
          statusNotes: p.statusNotes,
          lastStatusUpdate: p.lastStatusUpdate,
          activeInjuryCount: p.activeInjuryCount.toNumber ? p.activeInjuryCount.toNumber() : p.activeInjuryCount,
        };
      });

      // Sort players by last name, then first name
      players.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });

      // Assign jersey numbers based on sorted order
      players.forEach((player, index) => {
        player.jerseyNumber = String(index + 1);
      });

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
   * Get player identities (real names) from PostgreSQL by pseudonym IDs
   */
  private async getPlayerIdentities(pseudonymIds: string[]): Promise<Map<string, {firstName: string, lastName: string}>> {
    if (pseudonymIds.length === 0) {
      return new Map();
    }

    try {
      const query = `
        SELECT pseudonym_id, first_name, last_name
        FROM player_identities
        WHERE pseudonym_id = ANY($1)
        AND deleted_at IS NULL
      `;

      const result = await this.pool.query(query, [pseudonymIds]);

      const identityMap = new Map();
      result.rows.forEach(row => {
        identityMap.set(row.pseudonym_id, {
          firstName: row.first_name,
          lastName: row.last_name,
        });
      });

      return identityMap;
    } catch (error) {
      console.error('Error fetching player identities:', error);
      // Return empty map on error to avoid breaking the roster view
      return new Map();
    }
  }

  /**
   * Get detailed team information including coaches and player count
   */
  async getTeamDetails(teamId: string): Promise<TeamDetailsDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `\n        MATCH (t:Team {teamId: $teamId})-[:BELONGS_TO]->(o:Organization)
        OPTIONAL MATCH (t)-[:PLAYS]->(sp:Sport)
        OPTIONAL MATCH (t)<-[:MANAGES]-(c:Coach)
        OPTIONAL MATCH (t)<-[:PLAYS_FOR]-(p:Player)
        RETURN t.teamId as teamId,
               t.name as name,
               sp.name as sport,
               t.ageGroup as ageGroup,
               t.gender as gender,
               o.orgId as organizationId,
               o.name as organizationName,
               t.seasonStart as seasonStart,
               t.seasonEnd as seasonEnd,
               collect(DISTINCT {
                 coachId: c.coachId,
                 pseudonymId: c.pseudonymId,
                 specialization: c.specialization
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
          pseudonymId: c.pseudonymId,
          specialization: c.specialization,
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
        MATCH (c:Coach {pseudonymId: $coachPseudoId})-[:MANAGES]->(t:Team {teamId: $teamId})
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

  /**
   * Get all teams coached by a specific coach
   */
  async getCoachTeams(coachPseudoId: string): Promise<TeamDetailsDto[]> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Coach {pseudonymId: $coachPseudoId})-[:MANAGES]->(t:Team)-[:BELONGS_TO]->(o:Organization)
        OPTIONAL MATCH (t)-[:PLAYS]->(sp:Sport)
        OPTIONAL MATCH (t)<-[:PLAYS_FOR]-(p:Player)
        WITH t, sp, o, count(DISTINCT p) as playerCount
        ORDER BY t.name
        RETURN t.teamId as teamId,
               t.name as name,
               sp.name as sport,
               t.ageGroup as ageGroup,
               t.gender as gender,
               o.orgId as organizationId,
               o.name as organizationName,
               playerCount as playerCount,
               t.seasonStart as seasonStart,
               t.seasonEnd as seasonEnd
      `;

      const result = await session.run(query, { coachPseudoId });

      return result.records.map((record) => ({
        teamId: record.get('teamId'),
        name: record.get('name'),
        sport: record.get('sport'),
        ageGroup: record.get('ageGroup'),
        gender: record.get('gender'),
        organizationId: record.get('organizationId'),
        organizationName: record.get('organizationName'),
        coaches: [], // Not needed for this list view
        playerCount: record.get('playerCount').toNumber(),
        seasonStart: record.get('seasonStart'),
        seasonEnd: record.get('seasonEnd'),
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve coach teams: ${error.message}`);
    } finally {
      await session.close();
    }
  }
}

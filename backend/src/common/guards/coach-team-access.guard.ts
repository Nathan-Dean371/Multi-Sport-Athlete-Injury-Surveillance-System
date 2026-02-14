import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  Inject 
} from '@nestjs/common';
import { Driver } from 'neo4j-driver';

/**
 * Guard to verify that coaches can only access teams they manage
 * Admins have access to all teams
 */
@Injectable()
export class CoachTeamAccessGuard implements CanActivate {
  constructor(@Inject('NEO4J_DRIVER') private neo4jDriver: Driver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT strategy
    const teamId = request.params.teamId;

    // Admins have access to all teams
    if (user.identityType === 'admin') {
      return true;
    }

    // Coaches must manage the team to access it
    if (user.identityType === 'coach') {
      const hasAccess = await this.verifyCoachAccess(user.pseudonymId, teamId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this team');
      }
      return true;
    }

    // Players cannot access team rosters (only their own profile)
    throw new ForbiddenException('You do not have permission to access team rosters');
  }

  /**
   * Verify that the coach has a COACHES relationship to the team
   */
  private async verifyCoachAccess(coachPseudoId: string, teamId: string): Promise<boolean> {
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (c:Coach {pseudonymId: $coachPseudoId})-[:MANAGES]->(t:Team {teamId: $teamId})
         RETURN count(t) > 0 as hasAccess`,
        { coachPseudoId, teamId }
      );

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

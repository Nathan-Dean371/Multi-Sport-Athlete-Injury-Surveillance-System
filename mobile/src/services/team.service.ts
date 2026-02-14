import apiService from './api.service';
import { TeamRosterDto, TeamDetailsDto } from '../types/team.types';

class TeamService {
  async getCoachTeams(): Promise<TeamDetailsDto[]> {
    try {
      return await apiService.get<TeamDetailsDto[]>('/teams/coach/my-teams');
    } catch (error) {
      console.error('Error fetching coach teams:', error);
      throw error;
    }
  }

  async getTeamRoster(teamId: string): Promise<TeamRosterDto> {
    try {
      return await apiService.get<TeamRosterDto>(`/teams/${teamId}/players`);
    } catch (error) {
      console.error(`Error fetching roster for team ${teamId}:`, error);
      throw error;
    }
  }

  async getTeamDetails(teamId: string): Promise<TeamDetailsDto> {
    try {
      return await apiService.get<TeamDetailsDto>(`/teams/${teamId}`);
    } catch (error) {
      console.error(`Error fetching details for team ${teamId}:`, error);
      throw error;
    }
  }
}

export default new TeamService();

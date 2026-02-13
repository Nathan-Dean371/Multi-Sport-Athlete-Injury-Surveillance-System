import apiService from './api.service';
import { UpdateStatusDto, LatestStatusResponseDto } from '../types/status.types';

class StatusService {
  async updatePlayerStatus(playerId: string, statusDto: UpdateStatusDto): Promise<void> {
    try {
      await apiService.patch(`/status/players/${playerId}/status`, statusDto);
    } catch (error) {
      console.error(`Error updating status for player ${playerId}:`, error);
      throw error;
    }
  }

  async getLatestTeamStatuses(): Promise<LatestStatusResponseDto> {
    try {
      return await apiService.get<LatestStatusResponseDto>('/status/latest');
    } catch (error) {
      console.error('Error fetching latest team statuses:', error);
      throw error;
    }
  }

  async getPlayerStatusHistory(playerId: string): Promise<any> {
    try {
      return await apiService.get(`/status/players/${playerId}/history`);
    } catch (error) {
      console.error(`Error fetching status history for player ${playerId}:`, error);
      throw error;
    }
  }
}

export default new StatusService();

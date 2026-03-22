import apiService from "./api.service";
import { PlayerDto, PlayerListDto } from "../types/player.types";
import { PlayerInjuriesDto } from "../types/injury.types";
import {
  AcceptPlayerInvitationRequest,
  AcceptPlayerInvitationResponse,
} from "../types/invite.types";

class PlayerService {
  async acceptInvite(
    data: AcceptPlayerInvitationRequest,
  ): Promise<AcceptPlayerInvitationResponse> {
    try {
      return await apiService.post<AcceptPlayerInvitationResponse>(
        "/players/accept-invite",
        data,
      );
    } catch (error) {
      console.error("Error accepting player invitation:", error);
      throw error;
    }
  }

  async getAllPlayers(): Promise<PlayerListDto> {
    try {
      return await apiService.get<PlayerListDto>("/players");
    } catch (error) {
      console.error("Error fetching players:", error);
      throw error;
    }
  }

  async getPlayerById(playerId: string): Promise<PlayerDto> {
    try {
      return await apiService.get<PlayerDto>(`/players/${playerId}`);
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error);
      throw error;
    }
  }

  async getPlayerInjuries(playerId: string): Promise<PlayerInjuriesDto> {
    try {
      return await apiService.get<PlayerInjuriesDto>(
        `/players/${playerId}/injuries`,
      );
    } catch (error) {
      console.error(`Error fetching injuries for player ${playerId}:`, error);
      throw error;
    }
  }
}

export default new PlayerService();

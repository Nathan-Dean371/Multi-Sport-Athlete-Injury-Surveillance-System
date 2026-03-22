import apiService from "./api.service";
import {
  AcceptParentInvitationRequest,
  AcceptParentInvitationResponse,
  InviteAthleteRequest,
  InviteAthleteResponse,
  InviteParentRequest,
  InviteParentResponse,
  ParentProfileDto,
} from "../types/invite.types";

class ParentsService {
  async acceptInvitation(
    data: AcceptParentInvitationRequest,
  ): Promise<AcceptParentInvitationResponse> {
    try {
      return await apiService.post<AcceptParentInvitationResponse>(
        "/parents/accept",
        data,
      );
    } catch (error) {
      console.error("Error accepting parent invitation:", error);
      throw error;
    }
  }

  async getMe(): Promise<ParentProfileDto> {
    try {
      const raw = await apiService.get<any>("/parents/me");
      return {
        parentId: raw.parent_id,
        pseudonymId: raw.pseudonym_id,
        firstName: raw.first_name,
        lastName: raw.last_name,
        email: raw.email ?? null,
        phone: raw.phone ?? null,
      };
    } catch (error) {
      console.error("Error fetching parent profile:", error);
      throw error;
    }
  }

  async inviteAthlete(
    data: InviteAthleteRequest,
  ): Promise<InviteAthleteResponse> {
    try {
      return await apiService.post<InviteAthleteResponse>(
        "/parents/invite-athlete",
        data,
      );
    } catch (error) {
      console.error("Error inviting athlete:", error);
      throw error;
    }
  }

  async inviteParent(data: InviteParentRequest): Promise<InviteParentResponse> {
    try {
      return await apiService.post<InviteParentResponse>(
        "/parents/invite",
        data,
      );
    } catch (error) {
      console.error("Error inviting parent:", error);
      throw error;
    }
  }
}

export default new ParentsService();

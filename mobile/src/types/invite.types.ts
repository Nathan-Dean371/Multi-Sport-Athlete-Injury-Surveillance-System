export interface AcceptParentInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  pseudonymId?: string;
}

export interface AcceptParentInvitationResponse {
  pseudonymId: string;
}

export interface AcceptPlayerInvitationRequest {
  token: string;
  password: string;
  dateOfBirth: string;
  pseudonymId?: string;
}

export interface AcceptPlayerInvitationResponse {
  message: string;
  player: {
    playerId: string;
    pseudonymId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface InviteAthleteRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface InviteAthleteResponse {
  token: string;
  message?: string;
  invitationLink?: string;
}

export interface InviteParentRequest {
  parentEmail: string;
  parentPhone?: string;
}

export interface InviteParentResponse {
  token: string;
  message?: string;
  invitationLink?: string;
}

export interface ParentProfileDto {
  parentId: string;
  pseudonymId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

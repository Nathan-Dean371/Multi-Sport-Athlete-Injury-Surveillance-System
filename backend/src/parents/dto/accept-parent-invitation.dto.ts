export class AcceptParentInvitationDto {
  token: string;
  pseudonymId: string; // the parent will be assigned a pseudonymId on accept
  firstName: string;
  lastName: string;
}

export class CreateSessionDto {
  sessionType: string; // e.g., 'training', 'physio', 'appointment'
  sessionDate: string; // ISO date
  notes?: string;
}

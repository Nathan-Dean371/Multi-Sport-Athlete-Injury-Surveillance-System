export type TrainingSessionRepeat = {
  isRepeatable: true;
  repeatIntervalDays: number; // e.g. 7 = weekly
};

export type TrainingSessionOneOff = {
  isRepeatable: false;
};

export type TrainingSessionRepeatConfig =
  | TrainingSessionRepeat
  | TrainingSessionOneOff;

export interface TrainingSessionDefinition {
  id: string;
  name: string;
  sessionType: string;
  startDateTime: string; // ISO string
  repeat: TrainingSessionRepeatConfig;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface TrainingSchedule {
  sessions: TrainingSessionDefinition[];
}

export interface TrainingSessionOccurrence {
  occurrenceId: string; // `${sessionId}:${yyyy-MM-dd}`
  sessionId: string;
  name: string;
  sessionType: string;
  startDateTime: string; // ISO string for this specific occurrence
  occurrenceDate: string; // yyyy-MM-dd
}

export interface PostSessionReport {
  id: string;
  sessionId: string;
  occurrenceDate: string; // yyyy-MM-dd (relevant session date)
  reportDate: string; // yyyy-MM-dd (defaults to occurrenceDate)
  effortExpended: number; // 1-10
  physicalFeeling: string;
  mentalFeeling: string;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

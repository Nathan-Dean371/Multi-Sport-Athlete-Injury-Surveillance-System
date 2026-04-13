import apiService from "./api.service";

export type TrainingSessionDefinitionApiDto = {
  trainingSessionId: string;
  name: string;
  sessionType: string;
  startDateTime: string;
  isRepeatable: boolean;
  repeatIntervalDays?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainingScheduleApiDto = {
  sessions: TrainingSessionDefinitionApiDto[];
};

export type UpsertTrainingSessionDefinitionApiDto = {
  name: string;
  sessionType: string;
  startDateTime: string;
  isRepeatable: boolean;
  repeatIntervalDays?: number;
};

export type TrainingSessionReportApiDto = {
  reportKey: string;
  trainingSessionId: string;
  playerPseudonymId: string;
  occurrenceDate: string;
  reportDate: string;
  effortExpended: number;
  physicalFeeling: string;
  mentalFeeling: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListTrainingReportsApiDto = {
  reports: TrainingSessionReportApiDto[];
};

export type UpsertTrainingSessionReportApiDto = {
  reportDate: string;
  effortExpended: number;
  physicalFeeling: string;
  mentalFeeling: string;
  notes?: string;
};

class TrainingService {
  async getTrainingSchedule(playerId: string): Promise<TrainingScheduleApiDto> {
    return apiService.get<TrainingScheduleApiDto>(
      `/players/${playerId}/training-schedule`,
    );
  }

  async upsertTrainingSessionDefinition(
    playerId: string,
    sessionId: string,
    dto: UpsertTrainingSessionDefinitionApiDto,
  ): Promise<{ trainingSessionId: string }> {
    return apiService.put<{ trainingSessionId: string }>(
      `/players/${playerId}/training-schedule/sessions/${sessionId}`,
      dto,
    );
  }

  async deleteTrainingSessionDefinition(
    playerId: string,
    sessionId: string,
  ): Promise<{ deleted: boolean }> {
    return apiService.delete<{ deleted: boolean }>(
      `/players/${playerId}/training-schedule/sessions/${sessionId}`,
    );
  }

  async upsertTrainingSessionReport(
    playerId: string,
    sessionId: string,
    occurrenceDate: string,
    dto: UpsertTrainingSessionReportApiDto,
  ): Promise<{ reportKey: string }> {
    return apiService.put<{ reportKey: string }>(
      `/players/${playerId}/training-reports/${sessionId}/${occurrenceDate}`,
      dto,
    );
  }

  async listTrainingReports(
    playerId: string,
    query?: { from?: string; to?: string },
  ): Promise<ListTrainingReportsApiDto> {
    return apiService.get<ListTrainingReportsApiDto>(
      `/players/${playerId}/training-reports`,
      query,
    );
  }
}

export default new TrainingService();

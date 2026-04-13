import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PostSessionReport,
  TrainingSchedule,
  TrainingSessionDefinition,
} from "../types/training.types";
import trainingService from "../services/training.service";

const scheduleKey = (playerId: string) => `training_schedule:${playerId}`;
const reportsKey = (playerId: string) => `training_reports:${playerId}`;
const permissionsRequestedKey = (playerId: string) =>
  `training_notifications_permissions_requested:${playerId}`;

const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getCachedTrainingSchedule = async (
  playerId: string,
): Promise<TrainingSchedule> => {
  const raw = await AsyncStorage.getItem(scheduleKey(playerId));
  return safeJsonParse<TrainingSchedule>(raw, { sessions: [] });
};

const getCachedPostSessionReports = async (
  playerId: string,
): Promise<PostSessionReport[]> => {
  const raw = await AsyncStorage.getItem(reportsKey(playerId));
  return safeJsonParse<PostSessionReport[]>(raw, []);
};

export const getTrainingSchedule = async (
  playerId: string,
): Promise<TrainingSchedule> => {
  const cached = await getCachedTrainingSchedule(playerId);

  try {
    const remote = await trainingService.getTrainingSchedule(playerId);
    const schedule: TrainingSchedule = {
      sessions: (remote.sessions || []).map((s) => ({
        id: s.trainingSessionId,
        name: s.name,
        sessionType: s.sessionType,
        startDateTime: s.startDateTime,
        repeat: s.isRepeatable
          ? {
              isRepeatable: true,
              repeatIntervalDays: Number(s.repeatIntervalDays ?? 7),
            }
          : { isRepeatable: false },
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };

    await saveTrainingSchedule(playerId, schedule);
    return schedule;
  } catch {
    // Best-effort: fall back to cached value for reads.
    return cached;
  }
};

export const saveTrainingSchedule = async (
  playerId: string,
  schedule: TrainingSchedule,
): Promise<void> => {
  await AsyncStorage.setItem(scheduleKey(playerId), JSON.stringify(schedule));
};

export const upsertTrainingSession = async (
  playerId: string,
  session: TrainingSessionDefinition,
): Promise<TrainingSchedule> => {
  // Connectivity required: only update cache after backend success.
  await trainingService.upsertTrainingSessionDefinition(playerId, session.id, {
    name: session.name,
    sessionType: session.sessionType,
    startDateTime: session.startDateTime,
    isRepeatable: session.repeat.isRepeatable,
    repeatIntervalDays: session.repeat.isRepeatable
      ? session.repeat.repeatIntervalDays
      : undefined,
  });

  // Update local cache immediately (server remains source of truth).
  const schedule = await getCachedTrainingSchedule(playerId);
  const existingIndex = schedule.sessions.findIndex((s) => s.id === session.id);

  const nextSessions = [...schedule.sessions];
  if (existingIndex >= 0) {
    nextSessions[existingIndex] = session;
  } else {
    nextSessions.push(session);
  }

  const nextSchedule: TrainingSchedule = { sessions: nextSessions };
  await saveTrainingSchedule(playerId, nextSchedule);
  return nextSchedule;
};

export const deleteTrainingSession = async (
  playerId: string,
  sessionId: string,
): Promise<TrainingSchedule> => {
  // Connectivity required: only update cache after backend success.
  await trainingService.deleteTrainingSessionDefinition(playerId, sessionId);

  const schedule = await getCachedTrainingSchedule(playerId);
  const nextSchedule: TrainingSchedule = {
    sessions: schedule.sessions.filter((s) => s.id !== sessionId),
  };
  await saveTrainingSchedule(playerId, nextSchedule);
  return nextSchedule;
};

export const getPostSessionReports = async (
  playerId: string,
): Promise<PostSessionReport[]> => {
  const cached = await getCachedPostSessionReports(playerId);

  try {
    const remote = await trainingService.listTrainingReports(playerId);
    const reports: PostSessionReport[] = (remote.reports || []).map((r) => ({
      id: r.reportKey,
      sessionId: r.trainingSessionId,
      occurrenceDate: r.occurrenceDate,
      reportDate: r.reportDate,
      effortExpended: Number(r.effortExpended),
      physicalFeeling: r.physicalFeeling,
      mentalFeeling: r.mentalFeeling,
      notes: r.notes ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    await AsyncStorage.setItem(reportsKey(playerId), JSON.stringify(reports));
    return reports;
  } catch {
    // Best-effort: fall back to cached value for reads.
    return cached;
  }
};

export const upsertPostSessionReport = async (
  playerId: string,
  report: PostSessionReport,
): Promise<PostSessionReport[]> => {
  // Connectivity required: only update cache after backend success.
  await trainingService.upsertTrainingSessionReport(
    playerId,
    report.sessionId,
    report.occurrenceDate,
    {
      reportDate: report.reportDate,
      effortExpended: report.effortExpended,
      physicalFeeling: report.physicalFeeling,
      mentalFeeling: report.mentalFeeling,
      notes: report.notes,
    },
  );

  const reportKey = `${report.sessionId}:${report.occurrenceDate}`;
  const normalized: PostSessionReport = {
    ...report,
    id: reportKey,
  };

  const reports = await getCachedPostSessionReports(playerId);
  const existingIndex = reports.findIndex(
    (r) =>
      r.sessionId === normalized.sessionId &&
      r.occurrenceDate === normalized.occurrenceDate,
  );

  const next = [...reports];
  if (existingIndex >= 0) {
    next[existingIndex] = normalized;
  } else {
    next.push(normalized);
  }

  next.sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  await AsyncStorage.setItem(reportsKey(playerId), JSON.stringify(next));
  return next;
};

export const getPermissionsRequested = async (
  playerId: string,
): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(permissionsRequestedKey(playerId));
  return raw === "true";
};

export const setPermissionsRequested = async (
  playerId: string,
  value: boolean,
): Promise<void> => {
  await AsyncStorage.setItem(
    permissionsRequestedKey(playerId),
    value ? "true" : "false",
  );
};

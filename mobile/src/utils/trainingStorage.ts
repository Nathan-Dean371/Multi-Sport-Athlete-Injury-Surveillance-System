import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PostSessionReport,
  TrainingSchedule,
  TrainingSessionDefinition,
} from "../types/training.types";

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

export const getTrainingSchedule = async (
  playerId: string,
): Promise<TrainingSchedule> => {
  const raw = await AsyncStorage.getItem(scheduleKey(playerId));
  return safeJsonParse<TrainingSchedule>(raw, { sessions: [] });
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
  const schedule = await getTrainingSchedule(playerId);
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
  const schedule = await getTrainingSchedule(playerId);
  const nextSchedule: TrainingSchedule = {
    sessions: schedule.sessions.filter((s) => s.id !== sessionId),
  };
  await saveTrainingSchedule(playerId, nextSchedule);
  return nextSchedule;
};

export const getPostSessionReports = async (
  playerId: string,
): Promise<PostSessionReport[]> => {
  const raw = await AsyncStorage.getItem(reportsKey(playerId));
  return safeJsonParse<PostSessionReport[]>(raw, []);
};

export const upsertPostSessionReport = async (
  playerId: string,
  report: PostSessionReport,
): Promise<PostSessionReport[]> => {
  const reports = await getPostSessionReports(playerId);
  const existingIndex = reports.findIndex(
    (r) =>
      r.sessionId === report.sessionId &&
      r.occurrenceDate === report.occurrenceDate,
  );

  const next = [...reports];
  if (existingIndex >= 0) {
    next[existingIndex] = report;
  } else {
    next.push(report);
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

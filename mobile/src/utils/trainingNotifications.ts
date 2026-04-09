import * as Notifications from "expo-notifications";
import { addDays, isAfter, parseISO, startOfDay } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { TrainingSchedule } from "../types/training.types";
import { getOccurrencesForDay } from "./trainingUtils";

const notificationIdsKey = (playerId: string) =>
  `training_notification_ids:${playerId}`;

const safeJsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const rescheduleTrainingNotifications = async (
  playerId: string,
  schedule: TrainingSchedule,
) => {
  // Cancel existing scheduled notifications created by this feature
  const raw = await Notifications.getPermissionsAsync().catch(() => null);
  if (!raw?.granted) return;

  const existingRaw = await AsyncStorage.getItem(notificationIdsKey(playerId));
  const existingIds = safeJsonParse<string[]>(existingRaw, []);

  await Promise.all(
    existingIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );

  const now = new Date();
  const ids: string[] = [];

  // Schedule notifications for occurrences over the next 7 days
  for (let i = 0; i < 7; i++) {
    const day = addDays(startOfDay(now), i);
    const occurrences = getOccurrencesForDay(schedule, day);

    for (const occ of occurrences) {
      const triggerDate = parseISO(occ.startDateTime);
      if (!isAfter(triggerDate, now)) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Training session",
          body: `After "${occ.name}", please complete your post-session report.`,
          data: {
            kind: "training-post-session",
            sessionId: occ.sessionId,
            occurrenceDate: occ.occurrenceDate,
          },
        },
        trigger: { date: triggerDate } as any,
      });

      ids.push(id);
    }
  }

  await AsyncStorage.setItem(notificationIdsKey(playerId), JSON.stringify(ids));
};

export const hasNotificationsPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  return !!current.granted;
};

export const ensureNotificationsPermissions = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

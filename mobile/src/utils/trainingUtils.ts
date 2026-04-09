import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

import {
  TrainingSchedule,
  TrainingSessionDefinition,
  TrainingSessionOccurrence,
} from "../types/training.types";

export const formatOccurrenceDate = (date: Date): string =>
  format(date, "yyyy-MM-dd");

const buildOccurrenceId = (sessionId: string, occurrenceDate: string) =>
  `${sessionId}:${occurrenceDate}`;

export const isValidRepeatIntervalDays = (value: number) =>
  Number.isFinite(value) && value >= 1 && value <= 365;

export const getOccurrencesForDay = (
  schedule: TrainingSchedule,
  day: Date,
): TrainingSessionOccurrence[] => {
  const dayStart = startOfDay(day);

  const occurrences: TrainingSessionOccurrence[] = [];

  for (const session of schedule.sessions) {
    const anchor = parseISO(session.startDateTime);

    if (!session.repeat.isRepeatable) {
      if (isSameDay(anchor, dayStart)) {
        const occurrenceDate = formatOccurrenceDate(dayStart);
        occurrences.push({
          occurrenceId: buildOccurrenceId(session.id, occurrenceDate),
          sessionId: session.id,
          name: session.name,
          sessionType: session.sessionType,
          startDateTime: session.startDateTime,
          occurrenceDate,
        });
      }
      continue;
    }

    const intervalDays = session.repeat.repeatIntervalDays;
    if (!isValidRepeatIntervalDays(intervalDays)) continue;

    const dayDiff = differenceInCalendarDays(dayStart, startOfDay(anchor));

    if (dayDiff < 0) continue;

    if (dayDiff % intervalDays === 0) {
      const occurrenceStart = addDays(startOfDay(anchor), dayDiff);
      // Keep anchor time-of-day
      const anchored = parseISO(session.startDateTime);
      occurrenceStart.setHours(
        anchored.getHours(),
        anchored.getMinutes(),
        0,
        0,
      );

      const occurrenceDate = formatOccurrenceDate(dayStart);
      occurrences.push({
        occurrenceId: buildOccurrenceId(session.id, occurrenceDate),
        sessionId: session.id,
        name: session.name,
        sessionType: session.sessionType,
        startDateTime: occurrenceStart.toISOString(),
        occurrenceDate,
      });
    }
  }

  occurrences.sort(
    (a, b) =>
      parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime(),
  );

  return occurrences;
};

export const findSessionById = (
  schedule: TrainingSchedule,
  sessionId: string,
): TrainingSessionDefinition | undefined =>
  schedule.sessions.find((s) => s.id === sessionId);

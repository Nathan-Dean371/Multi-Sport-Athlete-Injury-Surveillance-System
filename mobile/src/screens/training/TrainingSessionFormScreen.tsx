import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Switch, Text, TextInput, Snackbar } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { format, isValid, parse, parseISO } from "date-fns";

import { useAuth } from "../../contexts/AuthContext";
import colors from "../../constants/colors";
import { TrainingSessionDefinition } from "../../types/training.types";
import {
  deleteTrainingSession,
  getPermissionsRequested,
  getTrainingSchedule,
  setPermissionsRequested,
  upsertTrainingSession,
} from "../../utils/trainingStorage";
import { isValidRepeatIntervalDays } from "../../utils/trainingUtils";
import {
  ensureNotificationsPermissions,
  hasNotificationsPermission,
  rescheduleTrainingNotifications,
} from "../../utils/trainingNotifications";

const makeId = () => `TRN-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TrainingSessionFormScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const playerId = user?.pseudonymId;

  const sessionId: string | undefined = route?.params?.sessionId;

  const [name, setName] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [dateInput, setDateInput] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [timeInput, setTimeInput] = useState<string>(
    format(new Date(), "HH:mm"),
  );
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [repeatIntervalDays, setRepeatIntervalDays] = useState("7");

  const [createdAtIso, setCreatedAtIso] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const loadExisting = useCallback(async () => {
    if (!playerId || !sessionId) return;
    const schedule = await getTrainingSchedule(playerId);
    const existing = schedule.sessions.find((s) => s.id === sessionId);
    if (!existing) return;

    setCreatedAtIso(existing.createdAt);

    setName(existing.name);
    setSessionType(existing.sessionType);

    const start = parseISO(existing.startDateTime);
    setDate(start);
    setTime(start);
    setDateInput(format(start, "yyyy-MM-dd"));
    setTimeInput(format(start, "HH:mm"));

    setIsRepeatable(existing.repeat.isRepeatable);
    if (existing.repeat.isRepeatable) {
      setRepeatIntervalDays(String(existing.repeat.repeatIntervalDays));
    }
  }, [playerId, sessionId]);

  useFocusEffect(
    useCallback(() => {
      loadExisting();
    }, [loadExisting]),
  );

  const startDateTime = useMemo(() => {
    const dt = new Date(date);
    dt.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return dt;
  }, [date, time]);

  const handleSave = async () => {
    if (!playerId) {
      showSnackbar("User information not available");
      return;
    }

    if (!name.trim()) {
      showSnackbar("Please enter a name");
      return;
    }

    if (!sessionType.trim()) {
      showSnackbar("Please enter a session type");
      return;
    }

    const interval = Number(repeatIntervalDays);
    if (isRepeatable && !isValidRepeatIntervalDays(interval)) {
      showSnackbar("Repeat interval must be 1-365 days");
      return;
    }

    try {
      setLoading(true);

      let startDateTimeToSave = startDateTime;
      if (Platform.OS === "web") {
        const parsedDate = parse(dateInput, "yyyy-MM-dd", new Date());
        const parsedTime = parse(timeInput, "HH:mm", new Date());
        if (!isValid(parsedDate) || !isValid(parsedTime)) {
          showSnackbar(
            "Please enter a valid date (YYYY-MM-DD) and time (HH:mm)",
          );
          return;
        }
        const dt = new Date(parsedDate);
        dt.setHours(parsedTime.getHours(), parsedTime.getMinutes(), 0, 0);
        startDateTimeToSave = dt;
      }

      const nowIso = new Date().toISOString();
      const session: TrainingSessionDefinition = {
        id: sessionId || makeId(),
        name: name.trim(),
        sessionType: sessionType.trim(),
        startDateTime: startDateTimeToSave.toISOString(),
        repeat: isRepeatable
          ? { isRepeatable: true, repeatIntervalDays: interval }
          : { isRepeatable: false },
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      if (createdAtIso) {
        session.createdAt = createdAtIso;
        session.updatedAt = nowIso;
      }

      const nextSchedule = await upsertTrainingSession(playerId, session);

      const alreadyRequested = await getPermissionsRequested(playerId).catch(
        () => true,
      );
      if (!alreadyRequested) {
        const granted = await ensureNotificationsPermissions().catch(
          () => false,
        );
        await setPermissionsRequested(playerId, true).catch(() => undefined);
        if (granted) {
          await rescheduleTrainingNotifications(playerId, nextSchedule).catch(
            () => undefined,
          );
        }
      } else {
        const granted = await hasNotificationsPermission().catch(() => false);
        if (granted) {
          await rescheduleTrainingNotifications(playerId, nextSchedule).catch(
            () => undefined,
          );
        }
      }

      navigation.goBack();
    } catch (e: any) {
      console.error("Failed to save training session:", e);
      showSnackbar("Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!playerId || !sessionId) return;
    try {
      setLoading(true);
      const nextSchedule = await deleteTrainingSession(playerId, sessionId);

      const granted = await hasNotificationsPermission().catch(() => false);
      if (granted) {
        await rescheduleTrainingNotifications(playerId, nextSchedule).catch(
          () => undefined,
        );
      }
      navigation.goBack();
    } catch (e) {
      console.error("Failed to delete session:", e);
      showSnackbar("Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.title}>
          {sessionId ? "Edit Session" : "Add Session"}
        </Text>

        <TextInput
          mode="outlined"
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Team Training"
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Session Type"
          value={sessionType}
          onChangeText={setSessionType}
          placeholder="e.g. Gym, Physio, Recovery"
          style={styles.input}
        />

        {Platform.OS === "web" ? (
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Date"
              value={dateInput}
              onChangeText={(value) => {
                setDateInput(value);
                const parsed = parse(value, "yyyy-MM-dd", new Date());
                if (isValid(parsed)) setDate(parsed);
              }}
              placeholder="YYYY-MM-DD"
              style={[styles.rowButton, styles.webRowInput]}
            />
            <TextInput
              mode="outlined"
              label="Time"
              value={timeInput}
              onChangeText={(value) => {
                setTimeInput(value);
                const parsed = parse(value, "HH:mm", new Date());
                if (isValid(parsed)) setTime(parsed);
              }}
              placeholder="HH:mm"
              style={[styles.rowButton, styles.webRowInput]}
            />
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
                style={styles.rowButton}
              >
                {format(date, "PPP")}
              </Button>
              <Button
                mode="outlined"
                icon="clock"
                onPress={() => setShowTimePicker(true)}
                style={styles.rowButton}
              >
                {format(time, "p")}
              </Button>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    setDate(selected);
                    setDateInput(format(selected, "yyyy-MM-dd"));
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={(_, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    setTime(selected);
                    setTimeInput(format(selected, "HH:mm"));
                  }
                }}
              />
            )}
          </>
        )}

        <View style={styles.switchRow}>
          <Text variant="titleMedium">Repeatable</Text>
          <Switch value={isRepeatable} onValueChange={setIsRepeatable} />
        </View>

        {isRepeatable && (
          <TextInput
            mode="outlined"
            label="Repeat Interval (days)"
            value={repeatIntervalDays}
            onChangeText={setRepeatIntervalDays}
            keyboardType="numeric"
            placeholder="7"
            style={styles.input}
          />
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.saveButton}
        >
          Save Session
        </Button>

        {sessionId && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            disabled={loading}
            style={styles.deleteButton}
            textColor={colors.error}
          >
            Delete Session
          </Button>
        )}

        <Text variant="bodySmall" style={styles.helperText}>
          Notifications are scheduled at the session start time.
        </Text>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  rowButton: {
    flex: 1,
  },
  webRowInput: {
    marginBottom: 0,
    backgroundColor: colors.background,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 16,
  },
  helperText: {
    color: colors.textSecondary,
  },
});

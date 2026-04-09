import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, StyleSheet, ScrollView } from "react-native";
import {
  Button,
  Card,
  Chip,
  Text,
  TextInput,
  Snackbar,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { format, isValid, parse, parseISO } from "date-fns";

import { useAuth } from "../../contexts/AuthContext";
import colors from "../../constants/colors";
import {
  PostSessionReport,
  TrainingSchedule,
} from "../../types/training.types";
import {
  getPostSessionReports,
  getTrainingSchedule,
  upsertPostSessionReport,
} from "../../utils/trainingStorage";
import { green100 } from "react-native-paper/src/styles/themes/v2/colors";

const makeId = () => `RPT-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Step = 1 | 2 | 3;

type DropdownOption = {
  value: string;
  label: string;
};

const EFFORT_OPTIONS: DropdownOption[] = [
  { value: "1", label: "1 - Very easy" },
  { value: "2", label: "2 - Easy" },
  { value: "3", label: "3 - Moderate" },
  { value: "4", label: "4 - Somewhat hard" },
  { value: "5", label: "5 - Hard" },
  { value: "6", label: "6 - Very hard" },
  { value: "7", label: "7 - Extremely hard" },
  { value: "8", label: "8 - Near-maximal" },
  { value: "9", label: "9 - Maximal" },
  { value: "10", label: "10 - All-out" },
];

const FEELING_OPTIONS: DropdownOption[] = [
  { value: "very_poor", label: "Very poor" },
  { value: "poor", label: "Poor" },
  { value: "okay", label: "Okay" },
  { value: "good", label: "Good" },
  { value: "excellent", label: "Excellent" },
];

export default function TrainingReportWizardScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const playerId = user?.pseudonymId;

  const sessionId: string | undefined = route?.params?.sessionId;
  const occurrenceDate: string | undefined = route?.params?.occurrenceDate;

  const [step, setStep] = useState<Step>(1);

  const [schedule, setSchedule] = useState<TrainingSchedule>({ sessions: [] });
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [existingCreatedAtIso, setExistingCreatedAtIso] = useState<
    string | null
  >(null);

  const [effort, setEffort] = useState("");
  const [physicalFeeling, setPhysicalFeeling] = useState("");
  const [mentalFeeling, setMentalFeeling] = useState("");
  const [notes, setNotes] = useState("");

  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [reportDateInput, setReportDateInput] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const showSnackbar = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarVisible(true);
  };

  const session = useMemo(() => {
    return schedule.sessions.find((s) => s.id === sessionId);
  }, [schedule, sessionId]);

  const effortLabel = useMemo(() => {
    const match = EFFORT_OPTIONS.find((o) => o.value === effort);
    return match?.label || "None selected";
  }, [effort]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!playerId || !sessionId || !occurrenceDate) return;

        const sch = await getTrainingSchedule(playerId);
        setSchedule(sch);

        const reports = await getPostSessionReports(playerId);
        const existing = reports.find(
          (r) =>
            r.sessionId === sessionId && r.occurrenceDate === occurrenceDate,
        );

        if (existing) {
          setExistingReportId(existing.id);
          setExistingCreatedAtIso(existing.createdAt);
          setEffort(String(existing.effortExpended));
          setPhysicalFeeling(existing.physicalFeeling);
          setMentalFeeling(existing.mentalFeeling);
          setNotes(existing.notes || "");
          const dt = parseISO(existing.reportDate);
          setReportDate(dt);
          setReportDateInput(format(dt, "yyyy-MM-dd"));
        } else {
          // Default reportDate to session date
          const dt = parseISO(`${occurrenceDate}T00:00:00`);
          setReportDate(dt);
          setReportDateInput(format(dt, "yyyy-MM-dd"));
        }
      })();
    }, [playerId, sessionId, occurrenceDate]),
  );

  const validateStep = () => {
    if (step === 1) {
      const n = Number(effort);
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        showSnackbar("Please select an effort value (1-10)");
        return false;
      }
    }

    if (step === 2) {
      if (!physicalFeeling.trim() || !mentalFeeling.trim()) {
        showSnackbar("Please select physical and mental feeling");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 3));
  };

  const handleBack = () => {
    setStep((prev) => (prev === 3 ? 2 : prev === 2 ? 1 : 1));
  };

  const handleSubmit = async () => {
    if (!playerId || !sessionId || !occurrenceDate) {
      showSnackbar("Missing session information");
      return;
    }

    if (!validateStep()) return;

    try {
      setLoading(true);
      const nowIso = new Date().toISOString();

      let reportDateToSave = reportDate;
      if (Platform.OS === "web") {
        const parsed = parse(reportDateInput, "yyyy-MM-dd", new Date());
        if (!isValid(parsed)) {
          showSnackbar("Please enter a valid date (YYYY-MM-DD)");
          return;
        }
        reportDateToSave = parsed;
      }

      const report: PostSessionReport = {
        id: existingReportId || makeId(),
        sessionId,
        occurrenceDate,
        reportDate: format(reportDateToSave, "yyyy-MM-dd"),
        effortExpended: Number(effort),
        physicalFeeling: physicalFeeling.trim(),
        mentalFeeling: mentalFeeling.trim(),
        notes: notes.trim() || undefined,
        createdAt: existingCreatedAtIso || nowIso,
        updatedAt: nowIso,
      };

      await upsertPostSessionReport(playerId, report);
      navigation.goBack();
    } catch (e) {
      console.error("Failed to save report:", e);
      showSnackbar("Failed to save report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.title}>
          Post-Session Report
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          {session ? `${session.name} • ${session.sessionType}` : "Session"}
          {occurrenceDate ? ` • ${occurrenceDate}` : ""}
        </Text>

        {step === 1 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.stepTitle}>
                Step 1: Effort expended
              </Text>
              <Text variant="bodyMedium" style={styles.selectionHint}>
                Selected: {effortLabel}
              </Text>

              <View style={styles.chipGroup}>
                {EFFORT_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    mode="outlined"
                    selected={effort === o.value}
                    showSelectedCheck
                    onPress={() => setEffort(o.value)}
                    style={styles.chip}
                  >
                    {o.value}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.stepTitle}>
                Step 2: How did you feel?
              </Text>
              <Text variant="bodyMedium" style={styles.selectionHint}>
                Physical feeling
              </Text>
              <View style={styles.chipGroup}>
                {FEELING_OPTIONS.map((o) => (
                  <Chip
                    key={`physical-${o.value}`}
                    mode="outlined"
                    selected={physicalFeeling === o.label}
                    showSelectedCheck
                    onPress={() => setPhysicalFeeling(o.label)}
                    style={styles.chip}
                  >
                    {o.label}
                  </Chip>
                ))}
              </View>

              <Text variant="bodyMedium" style={styles.selectionHint}>
                Mental feeling
              </Text>
              <View style={styles.chipGroup}>
                {FEELING_OPTIONS.map((o) => (
                  <Chip
                    key={`mental-${o.value}`}
                    mode="outlined"
                    selected={mentalFeeling === o.label}
                    showSelectedCheck
                    onPress={() => setMentalFeeling(o.label)}
                    style={styles.chip}
                  >
                    {o.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {step === 3 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.stepTitle}>
                Step 3: Notes & date
              </Text>

              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                {format(reportDate, "PPP")}
              </Button>

              {Platform.OS === "web" ? (
                <TextInput
                  mode="outlined"
                  label="Report date"
                  value={reportDateInput}
                  onChangeText={(value) => {
                    setReportDateInput(value);
                    const parsed = parse(value, "yyyy-MM-dd", new Date());
                    if (isValid(parsed)) setReportDate(parsed);
                  }}
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                />
              ) : (
                showDatePicker && (
                  <DateTimePicker
                    value={reportDate}
                    mode="date"
                    onChange={(_, selected) => {
                      setShowDatePicker(false);
                      if (selected) {
                        setReportDate(selected);
                        setReportDateInput(format(selected, "yyyy-MM-dd"));
                      }
                    }}
                  />
                )
              )}

              <TextInput
                mode="outlined"
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Anything noteworthy about the session..."
                style={styles.input}
              />
            </Card.Content>
          </Card>
        )}

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleBack}
            disabled={step === 1 || loading}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button mode="contained" onPress={handleNext} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            >
              Save
            </Button>
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
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
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  stepTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    marginTop: 12,
    backgroundColor: colors.background,
  },
  selectionHint: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});

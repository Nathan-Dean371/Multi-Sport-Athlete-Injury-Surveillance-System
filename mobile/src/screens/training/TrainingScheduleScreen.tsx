import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Button, Card, FAB, IconButton, Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, format, startOfWeek } from "date-fns";

import { useAuth } from "../../contexts/AuthContext";
import EmptyState from "../../components/common/EmptyState";
import { TrainingSchedule } from "../../types/training.types";
import {
  getPermissionsRequested,
  getTrainingSchedule,
  setPermissionsRequested,
} from "../../utils/trainingStorage";
import { getOccurrencesForDay } from "../../utils/trainingUtils";
import {
  ensureNotificationsPermissions,
  hasNotificationsPermission,
  rescheduleTrainingNotifications,
} from "../../utils/trainingNotifications";

export default function TrainingScheduleScreen({ navigation }: any) {
  const { user } = useAuth();

  const [schedule, setSchedule] = useState<TrainingSchedule>({ sessions: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const playerId = user?.pseudonymId;

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
  }, [selectedDate]);

  const selectedOccurrences = useMemo(() => {
    return getOccurrencesForDay(schedule, selectedDate);
  }, [schedule, selectedDate]);

  const fetchSchedule = async () => {
    if (!playerId) return;
    const next = await getTrainingSchedule(playerId);
    setSchedule(next);

    // Best-effort: request notification permission once, then keep schedules updated when granted.
    const alreadyRequested = await getPermissionsRequested(playerId).catch(
      () => true,
    );
    if (!alreadyRequested) {
      const granted = await ensureNotificationsPermissions().catch(() => false);
      await setPermissionsRequested(playerId, true).catch(() => undefined);
      if (granted) {
        await rescheduleTrainingNotifications(playerId, next).catch(
          () => undefined,
        );
      }
      return;
    }

    const granted = await hasNotificationsPermission().catch(() => false);
    if (granted) {
      await rescheduleTrainingNotifications(playerId, next).catch(
        () => undefined,
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        try {
          await fetchSchedule();
        } finally {
          // no-op
        }
      })();
      return () => {
        isMounted = false;
      };
    }, [playerId]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  const handleAddSession = () => {
    navigation.navigate("TrainingSessionForm");
  };

  const handleEditSession = (sessionId: string) => {
    navigation.navigate("TrainingSessionForm", { sessionId });
  };

  const handleLogSession = (sessionId: string, occurrenceDate: string) => {
    navigation.navigate("TrainingReportWizard", { sessionId, occurrenceDate });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerRow}>
          <Text variant="headlineSmall" style={styles.title}>
            Training Schedule
          </Text>
          <Button
            mode="outlined"
            icon="history"
            onPress={() => navigation.navigate("TrainingHistory")}
          >
            History
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              This Week
            </Text>

            <View style={styles.weekRow}>
              {weekDays.map((day) => {
                const isSelected =
                  format(day, "yyyy-MM-dd") ===
                  format(selectedDate, "yyyy-MM-dd");
                const count = getOccurrencesForDay(schedule, day).length;

                return (
                  <Button
                    key={day.toISOString()}
                    mode={isSelected ? "contained" : "outlined"}
                    compact
                    onPress={() => setSelectedDate(day)}
                    style={styles.dayButton}
                    contentStyle={styles.dayButtonContent}
                  >
                    {`${format(day, "EEE")}\n${format(day, "d")}${count ? ` •${count}` : ""}`}
                  </Button>
                );
              })}
            </View>

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { marginTop: 16 }]}
            >
              {format(selectedDate, "EEEE, MMM d")}
            </Text>

            {selectedOccurrences.length === 0 ? (
              <EmptyState
                icon="calendar-blank"
                title="No sessions"
                message="No sessions scheduled for this day."
              />
            ) : (
              <View style={styles.occurrenceList}>
                {selectedOccurrences.map((occ) => (
                  <Card key={occ.occurrenceId} style={styles.sessionCard}>
                    <Card.Title
                      title={occ.name}
                      subtitle={`${occ.sessionType || "Session"} • ${format(new Date(occ.startDateTime), "p")}`}
                      right={() => (
                        <View style={styles.cardActions}>
                          <IconButton
                            icon="clipboard-text"
                            onPress={() =>
                              handleLogSession(
                                occ.sessionId,
                                occ.occurrenceDate,
                              )
                            }
                            accessibilityLabel="Log session"
                          />
                          <IconButton
                            icon="pencil"
                            onPress={() => handleEditSession(occ.sessionId)}
                            accessibilityLabel="Edit session"
                          />
                        </View>
                      )}
                    />
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Session"
        style={styles.fab}
        onPress={handleAddSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    width: "30%",
  },
  dayButtonContent: {
    paddingVertical: 6,
  },
  occurrenceList: {
    gap: 8,
  },
  sessionCard: {
    marginTop: 8,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});

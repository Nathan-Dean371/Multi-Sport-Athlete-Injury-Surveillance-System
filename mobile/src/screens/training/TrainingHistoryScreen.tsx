import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Card, Text } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../contexts/AuthContext";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../constants/colors";
import {
  PostSessionReport,
  TrainingSchedule,
} from "../../types/training.types";
import {
  getPostSessionReports,
  getTrainingSchedule,
} from "../../utils/trainingStorage";

export default function TrainingHistoryScreen() {
  const { user } = useAuth();
  const playerId = user?.pseudonymId;

  const [schedule, setSchedule] = useState<TrainingSchedule>({ sessions: [] });
  const [reports, setReports] = useState<PostSessionReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!playerId) return;
    const [sch, reps] = await Promise.all([
      getTrainingSchedule(playerId),
      getPostSessionReports(playerId),
    ]);
    setSchedule(sch);
    setReports(reps);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [playerId]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const reportItems = useMemo(() => {
    return reports.map((r) => {
      const session = schedule.sessions.find((s) => s.id === r.sessionId);
      return {
        ...r,
        sessionName: session?.name || "Session",
        sessionType: session?.sessionType || "",
      };
    });
  }, [reports, schedule]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text variant="headlineSmall" style={styles.title}>
          Session History
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Past post-session reports
        </Text>

        {reportItems.length === 0 ? (
          <EmptyState
            icon="clipboard-text"
            title="No reports yet"
            message="Log a session from your schedule to start tracking."
          />
        ) : (
          <View style={styles.list}>
            {reportItems.map((r) => (
              <Card
                key={`${r.sessionId}:${r.occurrenceDate}`}
                style={styles.card}
              >
                <Card.Title
                  title={`${r.sessionName}`}
                  subtitle={`${r.sessionType ? `${r.sessionType} • ` : ""}${r.reportDate}`}
                />
                <Card.Content>
                  <Text variant="bodyMedium">
                    Effort: {r.effortExpended}/10
                  </Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    Physical: {r.physicalFeeling}
                  </Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    Mental: {r.mentalFeeling}
                  </Text>
                  {r.notes ? (
                    <Text variant="bodySmall" style={styles.notes}>
                      Notes: {r.notes}
                    </Text>
                  ) : null}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    marginBottom: 8,
  },
  muted: {
    color: colors.textSecondary,
  },
  notes: {
    marginTop: 8,
  },
});

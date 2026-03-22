import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Card, Button, Divider } from "react-native-paper";
import parentsService from "../../services/parents.service";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { ParentProfileDto } from "../../types/invite.types";

export default function ParentDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ParentProfileDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setError(null);
      const res = await parentsService.getMe();
      setProfile(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load parent profile");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProfile();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner message="Loading parent dashboard..." />;
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "No profile data available"}
        </Text>
        <Button
          mode="outlined"
          onPress={fetchProfile}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Welcome, {profile.firstName}
          </Text>
          <Divider style={styles.divider} />

          <Text variant="bodyLarge" style={styles.row}>
            Name: {profile.firstName} {profile.lastName}
          </Text>
          <Text variant="bodyLarge" style={styles.row}>
            Email: {profile.email || "N/A"}
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("InviteAthlete")}
          >
            Invite Athlete
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 12,
  },
  row: {
    marginBottom: 8,
  },
  actions: {
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    textAlign: "center",
  },
});

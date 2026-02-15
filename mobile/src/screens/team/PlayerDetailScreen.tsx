import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Divider, Button, useTheme, List } from 'react-native-paper';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import playerService from '../../services/player.service';
import { PlayerDto } from '../../types/player.types';
import { PlayerInjuriesDto, Severity, InjuryStatus } from '../../types/injury.types';

interface PlayerDetailScreenProps {
  route: {
    params: {
      playerId: string;
      playerName?: string;
    };
  };
  navigation: any;
}

export default function PlayerDetailScreen({ route, navigation }: PlayerDetailScreenProps) {
  const { playerId, playerName } = route.params;
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [player, setPlayer] = useState<PlayerDto | null>(null);
  const [injuries, setInjuries] = useState<PlayerInjuriesDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [playerData, injuryData] = await Promise.all([
        playerService.getPlayerById(playerId),
        playerService.getPlayerInjuries(playerId),
      ]);
      
      setPlayer(playerData);
      setInjuries(injuryData);
    } catch (err: any) {
      console.error('Error fetching player data:', err);
      setError(err.message || 'Failed to load player details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlayerData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: Severity): string => {
    switch (severity) {
      case Severity.MINOR:
        return theme.colors.primary;
      case Severity.MODERATE:
        return '#FF9800';
      case Severity.SEVERE:
        return '#FF5722';
      case Severity.CRITICAL:
        return '#F44336';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getStatusColor = (status: InjuryStatus): string => {
    switch (status) {
      case InjuryStatus.ACTIVE:
        return '#F44336';
      case InjuryStatus.RECOVERING:
        return '#FF9800';
      case InjuryStatus.RECOVERED:
        return '#4CAF50';
      case InjuryStatus.CHRONIC:
        return '#9C27B0';
      case InjuryStatus.RE_INJURED:
        return '#FF5722';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getActiveInjuries = () => {
    if (!injuries?.injuries) return [];
    return injuries.injuries.filter(
      injury => injury.status === InjuryStatus.ACTIVE || injury.status === InjuryStatus.RECOVERING
    );
  };

  const getPastInjuries = () => {
    if (!injuries?.injuries) return [];
    return injuries.injuries.filter(
      injury => injury.status === InjuryStatus.RECOVERED
    );
  };

  const getChronicInjuries = () => {
    if (!injuries?.injuries) return [];
    return injuries.injuries.filter(
      injury => injury.status === InjuryStatus.CHRONIC || injury.status === InjuryStatus.RE_INJURED
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading player details..." />;
  }

  if (error || !player) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Player not found'}
        </Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const activeInjuries = getActiveInjuries();
  const pastInjuries = getPastInjuries();
  const chronicInjuries = getChronicInjuries();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Player Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="headlineSmall" style={styles.playerName}>
                {player.name || playerName || 'Unknown Player'}
              </Text>
              {player.position && (
                <Text variant="bodyLarge" style={styles.position}>
                  {player.position}
                </Text>
              )}
            </View>
            {player.jerseyNumber && (
              <View style={styles.jerseyBadge}>
                <Text variant="headlineMedium" style={styles.jerseyNumber}>
                  #{player.jerseyNumber}
                </Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {player.team && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Team:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {player.team.teamName}
              </Text>
            </View>
          )}

          {player.ageGroup && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Age Group:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {player.ageGroup}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.infoLabel}>
              Player ID:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {player.playerId}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.infoLabel}>
              Status:
            </Text>
            <Chip
              mode="outlined"
              icon={player.isActive ? 'check-circle' : 'close-circle'}
              textStyle={{ color: player.isActive ? '#4CAF50' : '#9E9E9E' }}
            >
              {player.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Injury Summary Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Injury Summary
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.injurySummary}>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryCount, { color: '#F44336' }]}>
                {activeInjuries.length}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Active
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryCount, { color: '#9C27B0' }]}>
                {chronicInjuries.length}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Chronic
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryCount, { color: '#4CAF50' }]}>
                {pastInjuries.length}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Recovered
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={styles.summaryCount}>
                {injuries?.total || 0}
              </Text>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Active Injuries */}
      {activeInjuries.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Active Injuries
            </Text>
            <Divider style={styles.divider} />

            {activeInjuries.map((injury) => (
              <List.Item
                key={injury.injuryId}
                title={String(injury.injuryType)}
                description={`${String(injury.bodyPart)} • ${formatDate(injury.injuryDate)}`}
                left={(props) => (
                  <View style={styles.listIcon}>
                    <Chip
                      style={[styles.severityChip, { backgroundColor: getSeverityColor(injury.severity) }]}
                      textStyle={styles.severityText}
                    >
                      {String(injury.severity)}
                    </Chip>
                  </View>
                )}
                right={(props) => (
                  <Chip
                    icon="chevron-right"
                    style={{ backgroundColor: getStatusColor(injury.status as InjuryStatus) }}
                    textStyle={styles.statusText}
                  >
                    {String(injury.status)}
                  </Chip>
                )}
                onPress={() => navigation.navigate('InjuryDetail', { injuryId: injury.injuryId })}
                style={styles.listItem}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Chronic Injuries */}
      {chronicInjuries.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Chronic / Re-injured
            </Text>
            <Divider style={styles.divider} />

            {chronicInjuries.map((injury) => (
              <List.Item
                key={injury.injuryId}
                title={String(injury.injuryType)}
                description={`${String(injury.bodyPart)} • ${formatDate(injury.injuryDate)}`}
                left={(props) => (
                  <View style={styles.listIcon}>
                    <Chip
                      style={[styles.severityChip, { backgroundColor: getSeverityColor(injury.severity) }]}
                      textStyle={styles.severityText}
                    >
                      {String(injury.severity)}
                    </Chip>
                  </View>
                )}
                right={(props) => (
                  <Chip
                    icon="chevron-right"
                    style={{ backgroundColor: getStatusColor(injury.status as InjuryStatus) }}
                    textStyle={styles.statusText}
                  >
                    {String(injury.status)}
                  </Chip>
                )}
                onPress={() => navigation.navigate('InjuryDetail', { injuryId: injury.injuryId })}
                style={styles.listItem}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Past Injuries */}
      {pastInjuries.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Injury History
            </Text>
            <Divider style={styles.divider} />

            {pastInjuries.map((injury) => (
              <List.Item
                key={injury.injuryId}
                title={String(injury.injuryType)}
                description={`${String(injury.bodyPart)} • ${formatDate(injury.injuryDate)} - ${formatDate(injury.actualReturnDate)}`}
                left={(props) => (
                  <View style={styles.listIcon}>
                    <Chip
                      style={[styles.severityChip, { backgroundColor: getSeverityColor(injury.severity) }]}
                      textStyle={styles.severityText}
                    >
                      {String(injury.severity)}
                    </Chip>
                  </View>
                )}
                right={(props) => (
                  <Chip icon="chevron-right">
                    Recovered
                  </Chip>
                )}
                onPress={() => navigation.navigate('InjuryDetail', { injuryId: injury.injuryId })}
                style={styles.listItem}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* No Injuries */}
      {injuries?.total === 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.noInjuries}>
              <Text variant="bodyLarge" style={styles.noInjuriesText}>
                No injury history recorded
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  position: {
    color: '#424242',
  },
  jerseyBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  jerseyNumber: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
  },
  injurySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryCount: {
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#424242',
    marginTop: 4,
  },
  listIcon: {
    justifyContent: 'center',
    marginRight: 8,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  severityChip: {
    height: 28,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  noInjuries: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noInjuriesText: {
    color: '#757575',
  },
});

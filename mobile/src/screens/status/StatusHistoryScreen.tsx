import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import statusService from '../../services/status.service';
import { format, parseISO } from 'date-fns';
import { PlayerStatus } from '../../types/status.types';

interface StatusHistoryItem {
  id: string;
  status: PlayerStatus;
  date: string;
  timestamp: string;
  notes?: string;
}

interface StatusHistoryResponse {
  playerId: string;
  statusHistory: StatusHistoryItem[];
  total: number;
}

export default function StatusHistoryScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);

  useEffect(() => {
    fetchStatusHistory();
  }, []);

  const fetchStatusHistory = async () => {
    if (!user?.pseudonymId) return;

    try {
      setLoading(true);
      const response: StatusHistoryResponse = await statusService.getPlayerStatusHistory(user.pseudonymId);
      setHistory(response.statusHistory || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatusHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timestampString: string) => {
    try {
      return format(parseISO(timestampString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const getStatusDescription = (status: PlayerStatus) => {
    switch (status) {
      case PlayerStatus.GREEN:
        return 'Feeling great, ready to train';
      case PlayerStatus.ORANGE:
        return 'Some discomfort, manageable';
      case PlayerStatus.RED:
        return 'Not feeling well, need rest';
      case PlayerStatus.UNKNOWN:
        return 'No status recorded';
      default:
        return '';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading status history..." />;
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="No status history yet"
        message="Your status updates will appear here once you start tracking your daily wellness."
      />
    );
  }

  // Group by date
  const groupedHistory = history.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, StatusHistoryItem[]>);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Status History
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {history.length} total update{history.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {Object.entries(groupedHistory).map(([date, items]) => (
        <View key={date} style={styles.dateGroup}>
          <Text variant="titleMedium" style={styles.dateHeader}>
            {formatDate(date)}
          </Text>
          
          {items.map((item, index) => (
            <Card key={item.id} style={styles.statusCard} mode="outlined">
              <Card.Content>
                <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <StatusBadge status={item.status} size="medium" />
                    <View style={styles.statusDetails}>
                      <Text variant="bodyMedium" style={styles.statusDescription}>
                        {getStatusDescription(item.status)}
                      </Text>
                      <Text variant="bodySmall" style={styles.timestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {item.notes && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.notesSection}>
                      <Text variant="labelSmall" style={styles.notesLabel}>
                        NOTES
                      </Text>
                      <Text variant="bodyMedium" style={styles.notesText}>
                        {item.notes}
                      </Text>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDetails: {
    marginLeft: 12,
    flex: 1,
  },
  statusDescription: {
    color: '#333',
    fontWeight: '500',
  },
  timestamp: {
    color: '#999',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  notesSection: {
    marginTop: 4,
  },
  notesLabel: {
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    color: '#666',
    fontStyle: 'italic',
  },
});

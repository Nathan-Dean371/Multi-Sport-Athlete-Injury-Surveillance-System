import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InjuryCard from '../components/injury/InjuryCard';
import StatusSelector from '../components/status/StatusSelector';
import { PlayerStatus } from '../types/status.types';
import { InjuryDetailDto } from '../types/injury.types';
import injuryService from '../services/injury.service';
import statusService from '../services/status.service';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentInjuries, setRecentInjuries] = useState<InjuryDetailDto[]>([]);
  const [showQuickStatus, setShowQuickStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch recent injuries
      const response = await injuryService.getAllInjuries({
        playerId: user?.identityType === 'player' ? user.pseudonymId : undefined,
        pageSize: 3,
      });
      setRecentInjuries(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleQuickStatusSubmit = async () => {
    if (!selectedStatus || !user?.pseudonymId) return;
    
    try {
      setSubmittingStatus(true);
      await statusService.updatePlayerStatus(user.pseudonymId, {
        status: selectedStatus,
      });
      setShowQuickStatus(false);
      setSelectedStatus(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getRoleColor = (identityType: string) => {
    switch (identityType) {
      case 'admin':
        return theme.colors.error;
      case 'coach':
        return theme.colors.primary;
      case 'player':
        return theme.colors.tertiary;
      default:
        return theme.colors.secondary;
    }
  };

  const getRoleLabel = (identityType: string) => {
    return identityType.charAt(0).toUpperCase() + identityType.slice(1);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const isPlayer = user?.identityType === 'player';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user?.email?.substring(0, 2).toUpperCase() || 'U'} 
          style={{ backgroundColor: getRoleColor(user?.identityType || '') }}
        />
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome Back!
        </Text>
        <Text variant="bodyLarge" style={styles.emailText}>
          {user?.email}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            User Information
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>Role:</Text>
            <Text 
              variant="bodyLarge" 
              style={[styles.value, { color: getRoleColor(user?.identityType || '') }]}
            >
              {getRoleLabel(user?.identityType || 'Unknown')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>User ID:</Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.pseudonymId || 'N/A'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Status Update (Players Only) */}
      {isPlayer && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Quick Status Update
              </Text>
              <IconButton
                icon={showQuickStatus ? 'chevron-up' : 'chevron-down'}
                size={20}
                onPress={() => setShowQuickStatus(!showQuickStatus)}
              />
            </View>
            
            {showQuickStatus && (
              <>
                <Divider style={styles.divider} />
                <StatusSelector
                  selectedStatus={selectedStatus}
                  onSelect={setSelectedStatus}
                />
                <Button
                  mode="contained"
                  onPress={handleQuickStatusSubmit}
                  disabled={!selectedStatus || submittingStatus}
                  loading={submittingStatus}
                  style={styles.submitStatusButton}
                >
                  Submit Status
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Recent Injuries */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Recent Injuries
            </Text>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Injuries' as never)}
              compact
            >
              View All
            </Button>
          </View>
          <Divider style={styles.divider} />
          
          {recentInjuries.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No injuries recorded
            </Text>
          ) : (
            recentInjuries.map((injury) => (
              <InjuryCard
                key={injury.injuryId}
                injury={injury}
                onPress={() => navigation.navigate('Injuries' as never, {
                  screen: 'InjuryDetail',
                  params: { injuryId: injury.injuryId },
                } as never)}
              />
            ))
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Quick Actions
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.actionButtons}>
            {isPlayer && (
              <Button
                mode="contained-tonal"
                icon="heart-pulse"
                onPress={() => navigation.navigate('Status' as never)}
                style={styles.actionButton}
              >
                Update Status
              </Button>
            )}
            
            <Button
              mode="contained-tonal"
              icon="medical-bag"
              onPress={() => navigation.navigate('Injuries' as never)}
              style={styles.actionButton}
            >
              View Injuries
            </Button>
            
            {!isPlayer && (
              <Button
                mode="contained-tonal"
                icon="account-group"
                onPress={() => navigation.navigate('Team' as never)}
                style={styles.actionButton}
              >
                Team Dashboard
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Injury Surveillance System v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  welcomeText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emailText: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitStatusButton: {
    marginTop: 16,
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  comingSoon: {
    fontStyle: 'italic',
    opacity: 0.6,
    marginBottom: 12,
  },
  featureList: {
    paddingLeft: 8,
    gap: 4,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    opacity: 0.5,
  },
});

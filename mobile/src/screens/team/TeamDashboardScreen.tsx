import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, useTheme, Divider, ProgressBar, Badge, List, Button, Menu } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import teamService from '../../services/team.service';
import { TeamRosterDto, RosterPlayerDto, TeamDetailsDto } from '../../types/team.types';
import { PlayerStatus } from '../../types/status.types';

export default function TeamDashboardScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teams, setTeams] = useState<TeamDetailsDto[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetailsDto | null>(null);
  const [roster, setRoster] = useState<TeamRosterDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchCoachTeams();
  }, []);

  const fetchCoachTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const coachTeams = await teamService.getCoachTeams();
      setTeams(coachTeams);
      
      // Auto-select first team if only one team
      if (coachTeams.length === 1) {
        selectTeam(coachTeams[0]);
      } else if (coachTeams.length > 0) {
        // Select first team by default
        selectTeam(coachTeams[0]);
      } else {
        setError('No teams found. Please contact your administrator.');
      }
    } catch (err: any) {
      console.error('Error fetching coach teams:', err);
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const selectTeam = async (team: TeamDetailsDto) => {
    setSelectedTeam(team);
    setMenuVisible(false);
    await fetchTeamRoster(team.teamId);
  };

  const fetchTeamRoster = async (teamId: string) => {
    try {
      const data = await teamService.getTeamRoster(teamId);
      setRoster(data);
    } catch (err: any) {
      console.error('Error fetching team roster:', err);
      setError(err.message || 'Failed to load team roster');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedTeam) {
      await fetchTeamRoster(selectedTeam.teamId);
    } else {
      await fetchCoachTeams();
    }
    setRefreshing(false);
  };

  const getStatusColor = (status?: PlayerStatus): string => {
    if (!status) return theme.colors.surfaceVariant;
    
    switch (status) {
      case PlayerStatus.GREEN:
        return '#4CAF50';
      case PlayerStatus.ORANGE:
        return '#FF9800';
      case PlayerStatus.RED:
        return '#F44336';
      default:
        return theme.colors.surfaceVariant;
    }
  };

  const getStatusLabel = (status?: PlayerStatus): string => {
    if (!status) return 'Not Reported';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusIcon = (status?: PlayerStatus): string => {
    if (!status) return 'help-circle-outline';
    
    switch (status) {
      case PlayerStatus.GREEN:
        return 'check-circle';
      case PlayerStatus.ORANGE:
        return 'alert';
      case PlayerStatus.RED:
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const renderPlayerCard = (player: RosterPlayerDto) => {
    const hasReportedToday = !!player.currentStatus;
    
    return (
      <Card key={player.playerId} style={styles.playerCard}>
        <Card.Content>
          <View style={styles.playerHeader}>
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName}>
                  {player.firstName} {player.lastName}
                </Text>
                {player.activeInjuryCount > 0 && (
                  <Badge 
                    size={20} 
                    style={[styles.injuryBadge, { backgroundColor: theme.colors.error }]}
                  >
                    {player.activeInjuryCount}
                  </Badge>
                )}
              </View>
              <Text style={styles.playerDetails}>
                #{player.jerseyNumber} • {player.position}
              </Text>
            </View>
            
            <Chip
              icon={getStatusIcon(player.currentStatus)}
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(player.currentStatus) }
              ]}
              textStyle={styles.statusChipText}
            >
              {getStatusLabel(player.currentStatus)}
            </Chip>
          </View>

          {player.statusNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{player.statusNotes}</Text>
            </View>
          )}

          {!hasReportedToday && player.lastStatusUpdate && (
            <Text style={styles.lastUpdate}>
              Last update: {new Date(player.lastStatusUpdate).toLocaleDateString()}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const groupPlayersByStatus = () => {
    if (!roster) return {};
    
    const groups: Record<string, RosterPlayerDto[]> = {
      notReported: [],
      green: [],
      orange: [],
      red: [],
    };

    roster.players.forEach(player => {
      if (!player.currentStatus) {
        groups.notReported.push(player);
      } else {
        groups[player.currentStatus.toLowerCase()].push(player);
      }
    });

    return groups;
  };

  if (loading) {
    return <LoadingSpinner message="Loading team roster..." />;
  }

  if (error || !roster || !selectedTeam) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'No team data available'}
        </Text>
        {teams.length === 0 && (
          <Button mode="outlined" onPress={fetchCoachTeams} style={{ marginTop: 16 }}>
            Retry
          </Button>
        )}
      </View>
    );
  }

  const groups = groupPlayersByStatus();
  const reportingPercentage = roster.totalPlayers > 0 
    ? roster.playersReportedToday / roster.totalPlayers 
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Team Selector */}
      {teams.length > 1 && (
        <View style={styles.teamSelectorContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                icon="chevron-down"
                contentStyle={{ flexDirection: 'row-reverse' }}
                style={styles.teamSelectorButton}
              >
                {selectedTeam.name}
              </Button>
            }
          >
            {teams.map((team) => (
              <Menu.Item
                key={team.teamId}
                onPress={() => selectTeam(team)}
                title={team.name}
                leadingIcon={selectedTeam?.teamId === team.teamId ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>
      )}

      {/* Team Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.teamName}>{roster.teamName}</Text>
          <Text style={styles.sport}>{roster.sport}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{roster.totalPlayers}</Text>
              <Text style={styles.statLabel}>Total Players</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{roster.playersReportedToday}</Text>
              <Text style={styles.statLabel}>Reported Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {groups.red.length + groups.orange.length}
              </Text>
              <Text style={styles.statLabel}>Need Attention</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              Daily Reporting: {Math.round(reportingPercentage * 100)}%
            </Text>
            <ProgressBar 
              progress={reportingPercentage} 
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Status Overview */}
      <Card style={styles.overviewCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Status Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewBadge, { backgroundColor: '#F44336' }]}>
                <Text style={styles.overviewCount}>{groups.red.length}</Text>
              </View>
              <Text style={styles.overviewLabel}>Red</Text>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.overviewCount}>{groups.orange.length}</Text>
              </View>
              <Text style={styles.overviewLabel}>Orange</Text>
            </View>
            <View style={styles.overviewItem}>
              <View style={[styles.overviewBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.overviewCount}>{groups.green.length}</Text>
              </View>
              <Text style={styles.overviewLabel}>Green</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Players List */}
      <View style={styles.playersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Roster</Text>
          <Button
            mode="outlined"
            icon="account-group"
            onPress={() => navigation.navigate('TeamRoster', { 
              teamId: selectedTeam.teamId, 
              teamName: selectedTeam.name 
            })}
            compact
          >
            View All
          </Button>
        </View>
        
        {/* Priority: Red Status Players */}
        {groups.red.length > 0 && (
          <View style={styles.statusGroup}>
            <Text style={styles.groupTitle}>⚠️ Immediate Attention Required</Text>
            {groups.red.map(renderPlayerCard)}
          </View>
        )}

        {/* Orange Status Players */}
        {groups.orange.length > 0 && (
          <View style={styles.statusGroup}>
            <Text style={styles.groupTitle}>⚡ Monitor Closely</Text>
            {groups.orange.map(renderPlayerCard)}
          </View>
        )}

        {/* Green Status Players */}
        {groups.green.length > 0 && (
          <View style={styles.statusGroup}>
            <Text style={styles.groupTitle}>✅ Ready to Play</Text>
            {groups.green.map(renderPlayerCard)}
          </View>
        )}

        {/* Not Reported Players */}
        {groups.notReported.length > 0 && (
          <View style={styles.statusGroup}>
            <Text style={styles.groupTitle}>📋 Awaiting Status Update</Text>
            {groups.notReported.map(renderPlayerCard)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  teamSelectorContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  teamSelectorButton: {
    borderColor: '#6200EE',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sport: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  overviewCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 8,
    color: '#666',
  },
  playersSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  playerCard: {
    marginBottom: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  injuryBadge: {
    marginLeft: 8,
  },
  playerDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginLeft: 12,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

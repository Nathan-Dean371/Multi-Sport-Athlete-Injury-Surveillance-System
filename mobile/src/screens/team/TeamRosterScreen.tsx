import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, useTheme, Badge, Searchbar } from 'react-native-paper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import teamService from '../../services/team.service';
import { TeamRosterDto, RosterPlayerDto } from '../../types/team.types';
import { PlayerStatus } from '../../types/status.types';

interface TeamRosterScreenProps {
  route: {
    params: {
      teamId: string;
      teamName: string;
    };
  };
}

export default function TeamRosterScreen({ route }: TeamRosterScreenProps) {
  const { teamId, teamName } = route.params;
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roster, setRoster] = useState<TeamRosterDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeamRoster();
  }, [teamId]);

  const fetchTeamRoster = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamService.getTeamRoster(teamId);
      setRoster(data);
    } catch (err: any) {
      console.error('Error fetching team roster:', err);
      setError(err.message || 'Failed to load team roster');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeamRoster();
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

  const filterPlayers = (players: RosterPlayerDto[]) => {
    if (!searchQuery) return players;
    
    const query = searchQuery.toLowerCase();
    return players.filter(player => 
      player.firstName.toLowerCase().includes(query) ||
      player.lastName.toLowerCase().includes(query) ||
      player.jerseyNumber.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query)
    );
  };

  const sortPlayers = (players: RosterPlayerDto[]) => {
    return [...players].sort((a, b) => {
      // Sort by jersey number (numeric)
      const jerseyA = parseInt(a.jerseyNumber) || 0;
      const jerseyB = parseInt(b.jerseyNumber) || 0;
      return jerseyA - jerseyB;
    });
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

  if (loading) {
    return <LoadingSpinner message="Loading team roster..." />;
  }

  if (error || !roster) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'No team data available'}
        </Text>
      </View>
    );
  }

  const filteredPlayers = filterPlayers(roster.players);
  const sortedPlayers = sortPlayers(filteredPlayers);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.teamName}>{teamName}</Text>
        <Text style={styles.playerCount}>
          {filteredPlayers.length} {filteredPlayers.length === 1 ? 'Player' : 'Players'}
        </Text>
      </View>

      <Searchbar
        placeholder="Search players..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.playersContainer}>
          {sortedPlayers.map(renderPlayerCard)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerCount: {
    fontSize: 14,
    color: '#666',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  playersContainer: {
    padding: 16,
    paddingTop: 8,
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

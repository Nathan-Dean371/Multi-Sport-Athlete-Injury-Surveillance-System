import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar, Chip, useTheme, Badge, Avatar } from 'react-native-paper';
import Icon from 'react-native-paper/src/components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import teamService from '../../services/team.service';
import { TeamDetailsDto, RosterPlayerDto } from '../../types/team.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface SelectPlayerScreenProps {
  navigation: any;
  route: any;
}

export default function SelectPlayerScreen({ navigation, route }: SelectPlayerScreenProps) {
  const { reportType } = route.params;
  const { user } = useAuth();
  const theme = useTheme();
  
  const [teams, setTeams] = useState<TeamDetailsDto[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetailsDto | null>(null);
  const [players, setPlayers] = useState<RosterPlayerDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    fetchCoachTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamRoster(selectedTeam.teamId);
    }
  }, [selectedTeam]);

  const fetchCoachTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getCoachTeams();
      setTeams(data);
      
      // Auto-select if only one team
      if (data.length === 1) {
        setSelectedTeam(data[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamRoster = async (teamId: string) => {
    try {
      setLoadingPlayers(true);
      const roster = await teamService.getTeamRoster(teamId);
      setPlayers(roster.players);
    } catch (error) {
      console.error('Error fetching roster:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleTeamSelect = (team: TeamDetailsDto) => {
    setSelectedTeam(team);
    setSearchQuery('');
  };

  const handlePlayerSelect = (player: RosterPlayerDto) => {
    if (reportType === 'quick') {
      navigation.navigate('QuickReportInjury', {
        playerId: player.pseudonymId,
        playerName: `${player.firstName} ${player.lastName}`,
      });
    } else {
      navigation.navigate('ReportInjury', {
        playerId: player.pseudonymId,
        playerName: `${player.firstName} ${player.lastName}`,
      });
    }
  };

  const filteredPlayers = players.filter(player =>
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.jerseyNumber.includes(searchQuery) ||
    player.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'GREEN':
        return '#4CAF50';
      case 'ORANGE':
        return '#FF9800';
      case 'RED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading teams..." />;
  }

  return (
    <View style={styles.container}>
      {/* Team Selection Section */}
      {!selectedTeam ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Select Team
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Choose which team the player belongs to
          </Text>

          {teams.map((team) => (
            <Card 
              key={team.teamId} 
              style={styles.teamCard}
              onPress={() => handleTeamSelect(team)}
              mode="elevated"
            >
              <Card.Content>
                <View style={styles.teamHeader}>
                  <View style={styles.teamIconContainer}>
                    <Icon source="account-group" size={32} color={theme.colors.primary} />
                  </View>
                  <View style={styles.teamInfo}>
                    <Text variant="titleLarge" style={styles.teamName}>
                      {team.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.teamMeta}>
                      {team.sport} • {team.playerCount} players
                    </Text>
                    {team.ageGroup && (
                      <Text variant="bodySmall" style={styles.teamDetail}>
                        {team.ageGroup} {team.gender ? `• ${team.gender}` : ''}
                      </Text>
                    )}
                  </View>
                  <Icon source="chevron-right" size={24} color={theme.colors.outline} />
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      ) : (
        /* Player Selection Section */
        <View style={styles.playerSelectionContainer}>
          {/* Selected Team Header */}
          <View style={styles.selectedTeamHeader}>
            <TouchableOpacity 
              onPress={() => setSelectedTeam(null)}
              style={styles.backButton}
            >
              <Icon source="arrow-left" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.selectedTeamInfo}>
              <Text variant="titleMedium" style={styles.selectedTeamName}>
                {selectedTeam.name}
              </Text>
              <Text variant="bodySmall" style={styles.selectedTeamMeta}>
                {selectedTeam.sport}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search by name, number, or position..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
          </View>

          {/* Report Type Badge */}
          <View style={styles.reportTypeBadge}>
            <Chip 
              icon={reportType === 'quick' ? 'lightning-bolt' : 'clipboard-text'}
              mode="outlined"
            >
              {reportType === 'quick' ? 'Quick Report' : 'Detailed Report'}
            </Chip>
          </View>

          {/* Player List */}
          {loadingPlayers ? (
            <LoadingSpinner message="Loading players..." />
          ) : (
            <ScrollView 
              style={styles.playerList}
              contentContainerStyle={styles.playerListContent}
            >
              <Text variant="titleSmall" style={styles.playerListTitle}>
                Select Player ({filteredPlayers.length})
              </Text>

              {filteredPlayers.map((player) => (
                <Card 
                  key={player.playerId}
                  style={styles.playerCard}
                  onPress={() => handlePlayerSelect(player)}
                  mode="outlined"
                >
                  <Card.Content style={styles.playerCardContent}>
                    <View style={styles.playerLeft}>
                      <Avatar.Text 
                        size={48} 
                        label={player.jerseyNumber}
                        style={styles.jerseyAvatar}
                      />
                      <View style={styles.playerDetails}>
                        <View style={styles.playerNameRow}>
                          <Text variant="titleMedium" style={styles.playerName}>
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
                        <Text variant="bodySmall" style={styles.playerPosition}>
                          {player.position}
                        </Text>
                        {player.currentStatus && (
                          <View style={styles.statusRow}>
                            <View 
                              style={[
                                styles.statusDot, 
                                { backgroundColor: getStatusColor(player.currentStatus) }
                              ]} 
                            />
                            <Text variant="bodySmall" style={styles.statusText}>
                              Status: {player.currentStatus}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Icon source="chevron-right" size={24} color={theme.colors.outline} />
                  </Card.Content>
                </Card>
              ))}

              {filteredPlayers.length === 0 && (
                <View style={styles.emptyState}>
                  <Icon source="account-search" size={64} color={theme.colors.outline} />
                  <Text variant="titleMedium" style={styles.emptyText}>
                    No players found
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    Try adjusting your search
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    color: '#424242',
  },
  teamCard: {
    marginBottom: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8DEF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamMeta: {
    color: '#424242',
    marginBottom: 2,
  },
  teamDetail: {
    color: '#9E9E9E',
  },
  playerSelectionContainer: {
    flex: 1,
  },
  selectedTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  selectedTeamInfo: {
    flex: 1,
  },
  selectedTeamName: {
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedTeamMeta: {
    color: '#616161',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    elevation: 0,
  },
  reportTypeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  playerList: {
    flex: 1,
  },
  playerListContent: {
    padding: 16,
  },
  playerListTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#424242',
  },
  playerCard: {
    marginBottom: 12,
  },
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jerseyAvatar: {
    backgroundColor: '#6200EE',
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  playerName: {
    fontWeight: '600',
    marginRight: 8,
    color: '#FFFFFF',
  },
  injuryBadge: {
    marginLeft: 4,
  },
  playerPosition: {
    color: '#B0B0B0',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#757575',
  },
});

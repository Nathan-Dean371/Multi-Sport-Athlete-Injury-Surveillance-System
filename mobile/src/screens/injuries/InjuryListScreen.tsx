import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import InjuryCard from '../../components/injury/InjuryCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { InjuryDetailDto, InjuryStatus } from '../../types/injury.types';
import injuryService from '../../services/injury.service';

export default function InjuryListScreen({ navigation }: any) {
  const { user } = useAuth();
  const theme = useTheme();
  const [injuries, setInjuries] = useState<InjuryDetailDto[]>([]);
  const [filteredInjuries, setFilteredInjuries] = useState<InjuryDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<InjuryStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchInjuries();
  }, []);

  useEffect(() => {
    filterInjuries();
  }, [injuries, searchQuery, selectedFilter]);

  const fetchInjuries = async () => {
    try {
      setLoading(true);
      const response = await injuryService.getAllInjuries({
        playerId: user?.identityType === 'player' ? user.pseudonymId : undefined,
      });
      setInjuries(response.data);
    } catch (error) {
      console.error('Error fetching injuries:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInjuries();
    setRefreshing(false);
  };

  const filterInjuries = () => {
    let filtered = injuries;

    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter((injury) => injury.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (injury) =>
          injury.injuryType.toLowerCase().includes(query) ||
          injury.bodyPart.toLowerCase().includes(query) ||
          injury.diagnosis?.toLowerCase().includes(query)
      );
    }

    setFilteredInjuries(filtered);
  };

  const handleInjuryPress = (injury: InjuryDetailDto) => {
    navigation.navigate('InjuryDetail', { injuryId: injury.injuryId });
  };

  const handleReportInjury = () => {
    navigation.navigate('ReportInjury');
  };

  const filters: Array<{ label: string; value: InjuryStatus | 'ALL' }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: InjuryStatus.ACTIVE },
    { label: 'Recovering', value: InjuryStatus.RECOVERING },
    { label: 'Recovered', value: InjuryStatus.RECOVERED },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading injuries..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search injuries..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <Chip
              key={filter.value}
              selected={selectedFilter === filter.value}
              onPress={() => setSelectedFilter(filter.value)}
              style={styles.filterChip}
              mode="outlined"
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredInjuries.length === 0 ? (
          <EmptyState
            icon="medical-bag"
            title="No Injuries Found"
            message={
              searchQuery || selectedFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'No injury records available'
            }
          />
        ) : (
          <>
            <Text variant="bodySmall" style={styles.resultCount}>
              {filteredInjuries.length} {filteredInjuries.length === 1 ? 'injury' : 'injuries'} found
            </Text>
            {filteredInjuries.map((injury) => (
              <InjuryCard
                key={injury.injuryId}
                injury={injury}
                onPress={() => handleInjuryPress(injury)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Report Injury"
        style={styles.fab}
        onPress={handleReportInjury}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  resultCount: {
    marginBottom: 12,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

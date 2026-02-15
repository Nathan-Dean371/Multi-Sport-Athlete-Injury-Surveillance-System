import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, Button, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { InjuryDetailDto, Severity } from '../../types/injury.types';
import injuryService from '../../services/injury.service';

export default function InjuryDetailScreen({ route, navigation }: any) {
  const { injuryId } = route.params;
  const { user } = useAuth();
  const theme = useTheme();
  const [injury, setInjury] = useState<InjuryDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔍 InjuryDetailScreen - injuryId:', injuryId);
  console.log('🔍 InjuryDetailScreen - route.params:', route.params);

  useEffect(() => {
    fetchInjuryDetails();
  }, [injuryId]);

  const fetchInjuryDetails = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching injury details for ID:', injuryId);
      const data = await injuryService.getInjuryById(injuryId);
      console.log('✅ Injury data received:', data);
      setInjury(data);
    } catch (error) {
      console.error('Error fetching injury details:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading injury details..." />;
  }

  if (!injury) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleLarge">Injury not found</Text>
      </View>
    );
  }

  const canEdit = user?.identityType === 'coach' || user?.identityType === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="headlineSmall" style={styles.injuryType}>
                {injury.injuryType}
              </Text>
              <Text variant="bodyLarge" style={styles.bodyPart}>
                {injury.bodyPart} {injury.side !== 'Central' ? `(${injury.side})` : ''}
              </Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(injury.severity) }]}>
              <Text variant="labelMedium" style={styles.severityText}>
                {injury.severity}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.infoLabel}>
              Status:
            </Text>
            <Text variant="bodyLarge" style={styles.infoValue}>
              {injury.status}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.infoLabel}>
              Injury ID:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {injury.injuryId}
            </Text>
          </View>

          {injury.player && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Player:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {injury.player.firstName && injury.player.lastName 
                  ? `${injury.player.firstName} ${injury.player.lastName}` 
                  : injury.player.pseudonymId}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Dates Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Important Dates
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.infoLabel}>
              Injury Date:
            </Text>
            <Text variant="bodyMedium" style={styles.infoValue}>
              {formatDate(injury.injuryDate)}
            </Text>
          </View>

          {injury.reportedDate && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Reported Date:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {formatDate(injury.reportedDate)}
              </Text>
            </View>
          )}

          {injury.expectedReturnDate && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Expected Return:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {formatDate(injury.expectedReturnDate)}
              </Text>
            </View>
          )}

          {injury.actualReturnDate && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Actual Return:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {formatDate(injury.actualReturnDate)}
              </Text>
            </View>
          )}

          {injury.lastUpdated && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>
                Last Updated:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {formatDate(injury.lastUpdated)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Details Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Injury Details
          </Text>
          <Divider style={styles.divider} />

          {injury.mechanism && (
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={styles.detailLabel}>
                Mechanism of Injury:
              </Text>
              <Text variant="bodyMedium" style={styles.detailText}>
                {injury.mechanism}
              </Text>
            </View>
          )}

          {injury.diagnosis && (
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={styles.detailLabel}>
                Diagnosis:
              </Text>
              <Text variant="bodyMedium" style={styles.detailText}>
                {injury.diagnosis}
              </Text>
            </View>
          )}

          {injury.treatmentPlan && (
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={styles.detailLabel}>
                Treatment Plan:
              </Text>
              <Text variant="bodyMedium" style={styles.detailText}>
                {injury.treatmentPlan}
              </Text>
            </View>
          )}

          {injury.notes && (
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={styles.detailLabel}>
                Notes:
              </Text>
              <Text variant="bodyMedium" style={styles.detailText}>
                {injury.notes}
              </Text>
            </View>
          )}

          {injury.reportedBy && (
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={styles.detailLabel}>
                Reported By:
              </Text>
              <Text variant="bodyMedium" style={styles.detailText}>
                {injury.reportedBy}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      {canEdit && !injury.isResolved && (
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => navigation.navigate('EditInjury', { injuryId: injury.injuryId })}
            style={styles.actionButton}
          >
            Update Injury
          </Button>
        </View>
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
  injuryType: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bodyPart: {
    color: '#E0E0E0',
  },
  severityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 140,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    marginBottom: 4,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  detailText: {
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});

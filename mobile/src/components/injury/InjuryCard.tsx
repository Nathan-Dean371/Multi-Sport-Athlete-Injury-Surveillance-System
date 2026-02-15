import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import StatusBadge from '../common/StatusBadge';
import { InjuryDetailDto, Severity } from '../../types/injury.types';
import { PlayerStatus } from '../../types/status.types';

interface InjuryCardProps {
  injury: InjuryDetailDto;
  onPress?: () => void;
}

export default function InjuryCard({ injury, onPress }: InjuryCardProps) {
  const theme = useTheme();

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

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.injuryType}>
              {injury.injuryType}
            </Text>
            <Text variant="bodySmall" style={styles.bodyPart}>
              {injury.bodyPart} {injury.side !== 'Central' ? `(${injury.side})` : ''}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(injury.severity) }]}>
            <Text variant="labelSmall" style={styles.severityText}>
              {injury.severity}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text variant="labelSmall" style={styles.label}>
              Status:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {injury.status}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text variant="labelSmall" style={styles.label}>
              Injury Date:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {formatDate(injury.injuryDate)}
            </Text>
          </View>

          {injury.expectedReturnDate && (
            <View style={styles.detailRow}>
              <Text variant="labelSmall" style={styles.label}>
                Expected Return:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {formatDate(injury.expectedReturnDate)}
              </Text>
            </View>
          )}
        </View>

        {injury.diagnosis && (
          <Text variant="bodySmall" style={styles.diagnosis} numberOfLines={2}>
            {injury.diagnosis}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  injuryType: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bodyPart: {
    color: '#E0E0E0',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  details: {
    gap: 6,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 120,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  value: {
    flex: 1,
  },
  diagnosis: {
    marginTop: 8,
    color: '#E0E0E0',
    fontStyle: 'italic',
  },
});

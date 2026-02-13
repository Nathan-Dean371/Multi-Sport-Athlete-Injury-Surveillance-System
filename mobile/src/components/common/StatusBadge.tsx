import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { PlayerStatus } from '../../types/status.types';

interface StatusBadgeProps {
  status: PlayerStatus;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const theme = useTheme();

  const getStatusColor = (status: PlayerStatus): string => {
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

  const getTextColor = (status: PlayerStatus): string => {
    return '#FFFFFF';
  };

  return (
    <Chip
      mode="flat"
      textStyle={[
        styles.text,
        { color: getTextColor(status) },
        size === 'small' && styles.smallText,
      ]}
      style={[
        styles.chip,
        { backgroundColor: getStatusColor(status) },
        size === 'small' && styles.smallChip,
      ]}
    >
      {status}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  smallChip: {
    height: 24,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  smallText: {
    fontSize: 10,
  },
});

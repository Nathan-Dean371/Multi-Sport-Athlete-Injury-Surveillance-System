import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { PlayerStatus } from '../../types/status.types';

interface StatusSelectorProps {
  selectedStatus: PlayerStatus | null;
  onSelect: (status: PlayerStatus) => void;
}

export default function StatusSelector({ selectedStatus, onSelect }: StatusSelectorProps) {
  const theme = useTheme();

  const statusOptions = [
    {
      value: PlayerStatus.GREEN,
      label: 'GREEN',
      description: 'Feeling great, ready to play',
      color: '#4CAF50',
    },
    {
      value: PlayerStatus.ORANGE,
      label: 'ORANGE',
      description: 'Some discomfort, needs monitoring',
      color: '#FF9800',
    },
    {
      value: PlayerStatus.RED,
      label: 'RED',
      description: 'Not feeling well, should not play',
      color: '#F44336',
    },
  ];

  return (
    <View style={styles.container}>
      {statusOptions.map((option) => {
        const isSelected = selectedStatus === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusCard,
              {
                backgroundColor: isSelected ? option.color : theme.colors.surface,
                borderColor: option.color,
                borderWidth: isSelected ? 0 : 2,
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              variant="headlineMedium"
              style={[
                styles.statusLabel,
                { color: isSelected ? '#FFFFFF' : option.color },
              ]}
            >
              {option.label}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.statusDescription,
                { color: isSelected ? '#FFFFFF' : theme.colors.onSurface },
              ]}
            >
              {option.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    opacity: 0.9,
  },
});

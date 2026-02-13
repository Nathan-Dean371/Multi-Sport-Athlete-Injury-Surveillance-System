import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

export default function EmptyState({ icon = 'inbox', title, message }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color={theme.colors.surfaceDisabled} />
      <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurfaceDisabled }]}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
});

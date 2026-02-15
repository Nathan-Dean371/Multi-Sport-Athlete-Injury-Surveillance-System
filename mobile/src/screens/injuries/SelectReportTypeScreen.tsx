import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import Icon from 'react-native-paper/src/components/Icon';

interface SelectReportTypeScreenProps {
  navigation: any;
}

export default function SelectReportTypeScreen({ navigation }: SelectReportTypeScreenProps) {
  const theme = useTheme();

  const handleQuickReport = () => {
    navigation.navigate('SelectPlayer', { reportType: 'quick' });
  };

  const handleDetailedReport = () => {
    navigation.navigate('SelectPlayer', { reportType: 'detailed' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Report Injury
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Choose the type of report you'd like to create
        </Text>

        <Card 
          style={[styles.card, styles.quickCard]} 
          onPress={handleQuickReport}
          mode="elevated"
        >
          <Card.Content style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="lightning-bolt" size={48} color={theme.colors.primary} />
            </View>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Quick Report
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Fast pitch-side reporting with essential information only
            </Text>
          </Card.Content>
        </Card>

        <Card 
          style={[styles.card, styles.detailedCard]} 
          onPress={handleDetailedReport}
          mode="elevated"
        >
          <Card.Content style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Icon source="clipboard-text" size={48} color={theme.colors.secondary} />
            </View>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Detailed Report
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Comprehensive medical report with full diagnostic information
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000000',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#424242',
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
  },
  quickCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200EE',
  },
  detailedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#03DAC6',
  },
  cardContent: {
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#E0E0E0',
  },
});

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleColor = (identityType: string) => {
    switch (identityType) {
      case 'admin':
        return theme.colors.error;
      case 'coach':
        return theme.colors.primary;
      case 'player':
        return theme.colors.tertiary;
      default:
        return theme.colors.secondary;
    }
  };

  const getRoleLabel = (identityType: string) => {
    return identityType.charAt(0).toUpperCase() + identityType.slice(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={user?.email?.substring(0, 2).toUpperCase() || 'U'} 
          style={{ backgroundColor: getRoleColor(user?.identityType || '') }}
        />
        <Text variant="headlineMedium" style={styles.welcomeText}>
          Welcome Back!
        </Text>
        <Text variant="bodyLarge" style={styles.emailText}>
          {user?.email}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            User Information
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>Role:</Text>
            <Text 
              variant="bodyLarge" 
              style={[styles.value, { color: getRoleColor(user?.identityType || '') }]}
            >
              {getRoleLabel(user?.identityType || 'Unknown')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>User ID:</Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.pseudonymId || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>Status:</Text>
            <Text variant="bodyLarge" style={[styles.value, { color: theme.colors.primary }]}>
              Active
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Quick Actions
          </Text>
          <Divider style={styles.divider} />
          
          <Text variant="bodyMedium" style={styles.comingSoon}>
            Dashboard features coming soon...
          </Text>
          
          <View style={styles.featureList}>
            <Text variant="bodyMedium">• View injury reports</Text>
            <Text variant="bodyMedium">• Team analytics</Text>
            <Text variant="bodyMedium">• Player profiles</Text>
            <Text variant="bodyMedium">• Training schedules</Text>
          </View>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Logout
      </Button>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Injury Surveillance System v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  welcomeText: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emailText: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '600',
  },
  comingSoon: {
    fontStyle: 'italic',
    opacity: 0.6,
    marginBottom: 12,
  },
  featureList: {
    paddingLeft: 8,
    gap: 4,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    opacity: 0.5,
  },
});

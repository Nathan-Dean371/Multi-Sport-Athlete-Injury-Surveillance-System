import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, List, Avatar, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import Constants from 'expo-constants';

export default function ProfileScreen() {
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
      {/* User Header */}
      <View style={styles.header}>
        <Avatar.Text 
          size={100} 
          label={user?.email?.substring(0, 2).toUpperCase() || 'U'} 
          style={{ backgroundColor: getRoleColor(user?.identityType || '') }}
        />
        <Text variant="headlineMedium" style={styles.email}>
          {user?.email}
        </Text>
        <Text 
          variant="titleMedium" 
          style={[styles.role, { color: getRoleColor(user?.identityType || '') }]}
        >
          {getRoleLabel(user?.identityType || 'Unknown')}
        </Text>
      </View>

      {/* User Information Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Account Information
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              User ID:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.pseudonymId || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              Email:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              Role:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {getRoleLabel(user?.identityType || 'Unknown')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              Status:
            </Text>
            <Text variant="bodyMedium" style={[styles.value, { color: theme.colors.primary }]}>
              Active
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Settings/Options */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Settings
          </Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Notifications"
            description="Coming soon..."
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            disabled
          />
          
          <List.Item
            title="Privacy"
            description="Coming soon..."
            left={props => <List.Icon {...props} icon="shield-account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            disabled
          />
          
          <List.Item
            title="Help & Support"
            description="Coming soon..."
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            disabled
          />
        </Card.Content>
      </Card>

      {/* App Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            App Information
          </Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              Version:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="labelLarge" style={styles.label}>
              Build:
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {Constants.expoConfig?.extra?.buildNumber || 'Development'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={handleLogout}
        icon="logout"
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
      >
        Sign Out
      </Button>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Injury Surveillance System
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          © 2026 All rights reserved
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
    paddingTop: 32,
    backgroundColor: '#fff',
  },
  email: {
    marginTop: 16,
    fontWeight: '600',
  },
  role: {
    marginTop: 4,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    width: 100,
    opacity: 0.7,
  },
  value: {
    flex: 1,
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  footerText: {
    opacity: 0.5,
    marginBottom: 4,
  },
});

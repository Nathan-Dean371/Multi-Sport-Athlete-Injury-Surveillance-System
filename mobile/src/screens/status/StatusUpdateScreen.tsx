import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Snackbar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import StatusSelector from '../../components/status/StatusSelector';
import { PlayerStatus, UpdateStatusDto } from '../../types/status.types';
import statusService from '../../services/status.service';

export default function StatusUpdateScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const handleSubmit = async () => {
    if (!selectedStatus) {
      showSnackbar('Please select a status', 'error');
      return;
    }

    if (!user?.pseudonymId) {
      showSnackbar('User information not available', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const updateDto: UpdateStatusDto = {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      };

      await statusService.updatePlayerStatus(user.pseudonymId, updateDto);
      
      showSnackbar('Status updated successfully!', 'success');
      
      // Reset form
      setSelectedStatus(null);
      setNotes('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to update status. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Daily Status Update
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            How are you feeling today?
          </Text>
          <Button
            mode="outlined"
            icon="history"
            onPress={() => navigation.navigate('StatusHistory' as never)}
            style={styles.historyButton}
          >
            View History
          </Button>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Select Your Status
          </Text>
          <StatusSelector
            selectedStatus={selectedStatus}
            onSelect={setSelectedStatus}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Additional Notes (Optional)
          </Text>
          <TextInput
            mode="outlined"
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Any additional details about how you're feeling..."
            style={styles.notesInput}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !selectedStatus}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Submit Status Update
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{
          backgroundColor: snackbarType === 'success' ? theme.colors.primary : theme.colors.error,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  historyButton: {
    marginTop: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});

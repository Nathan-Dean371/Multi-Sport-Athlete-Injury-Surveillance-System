import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { InjuryDetailDto, UpdateInjuryDto, InjuryStatus, ResolveInjuryDto } from '../../types/injury.types';
import injuryService from '../../services/injury.service';

export default function EditInjuryScreen({ route, navigation }: any) {
  const { injuryId } = route.params;
  const theme = useTheme();
  const [injury, setInjury] = useState<InjuryDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState<InjuryStatus>(InjuryStatus.ACTIVE);
  const [statusNote, setStatusNote] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  useEffect(() => {
    fetchInjuryDetails();
  }, [injuryId]);

  const fetchInjuryDetails = async () => {
    try {
      setLoading(true);
      const data = await injuryService.getInjuryById(injuryId);
      setInjury(data);
      
      // Initialize form with current values
      setStatus(data.status);
      setDiagnosis(data.diagnosis || '');
      setTreatmentPlan(data.treatmentPlan || '');
      setNotes(data.notes || '');
      setExpectedReturnDate(data.expectedReturnDate || '');
    } catch (error) {
      console.error('Error fetching injury details:', error);
      Alert.alert('Error', 'Failed to load injury details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      
      const updateDto: UpdateInjuryDto = {};
      
      // Only include fields that have been modified
      if (status !== injury?.status) {
        updateDto.status = status;
        
        // Include status note if provided
        if (statusNote.trim()) {
          updateDto.statusNote = statusNote.trim();
        }
      }
      
      if (diagnosis !== (injury?.diagnosis || '')) {
        updateDto.diagnosis = diagnosis.trim() || undefined;
      }
      
      if (treatmentPlan !== (injury?.treatmentPlan || '')) {
        updateDto.treatmentPlan = treatmentPlan.trim() || undefined;
      }
      
      if (notes !== (injury?.notes || '')) {
        updateDto.notes = notes.trim() || undefined;
      }
      
      if (expectedReturnDate !== (injury?.expectedReturnDate || '')) {
        updateDto.expectedReturnDate = expectedReturnDate.trim() || undefined;
      }

      await injuryService.updateInjury(injuryId, updateDto);
      
      Alert.alert('Success', 'Injury updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating injury:', error);
      Alert.alert('Error', error.message || 'Failed to update injury');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = () => {
    Alert.alert(
      'Resolve Injury',
      'Mark this injury as recovered? This will set the actual return date to today.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Resolve',
          style: 'default',
          onPress: async () => {
            try {
              setSaving(true);
              const resolveDto: ResolveInjuryDto = {
                actualReturnDate: new Date().toISOString(),
                notes: statusNote.trim() || undefined,
              };
              
              await injuryService.resolveInjury(injuryId, resolveDto);
              
              Alert.alert('Success', 'Injury resolved successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('InjuryList'),
                },
              ]);
            } catch (error: any) {
              console.error('Error resolving injury:', error);
              Alert.alert('Error', error.message || 'Failed to resolve injury');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Injury Information Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Injury Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.label}>
              Injury ID:
            </Text>
            <Text variant="bodyMedium">{injury.injuryId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.label}>
              Type:
            </Text>
            <Text variant="bodyMedium">{injury.injuryType}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.label}>
              Body Part:
            </Text>
            <Text variant="bodyMedium">
              {injury.bodyPart} {injury.side !== 'Central' ? `(${injury.side})` : ''}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.label}>
              Severity:
            </Text>
            <Text variant="bodyMedium">{injury.severity}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="labelMedium" style={styles.label}>
              Injury Date:
            </Text>
            <Text variant="bodyMedium">{formatDate(injury.injuryDate)}</Text>
          </View>

          {injury.player && (
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.label}>
                Player:
              </Text>
              <Text variant="bodyMedium">
                {injury.player.firstName && injury.player.lastName 
                  ? `${injury.player.firstName} ${injury.player.lastName}` 
                  : injury.player.pseudonymId}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Status Update Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Update Status
          </Text>
          
          <Text variant="labelMedium" style={styles.inputLabel}>
            Current Status
          </Text>
          <SegmentedButtons
            value={status}
            onValueChange={(value) => setStatus(value as InjuryStatus)}
            buttons={[
              { value: InjuryStatus.ACTIVE, label: 'Active' },
              { value: InjuryStatus.RECOVERING, label: 'Recovering' },
              { value: InjuryStatus.CHRONIC, label: 'Chronic' },
            ]}
            style={styles.segmentedButtons}
          />
          <SegmentedButtons
            value={status}
            onValueChange={(value) => setStatus(value as InjuryStatus)}
            buttons={[
              { value: InjuryStatus.RECOVERED, label: 'Recovered' },
              { value: InjuryStatus.RE_INJURED, label: 'Re-injured' },
            ]}
            style={styles.segmentedButtons}
          />
          
          <TextInput
            label="Status Update Note"
            value={statusNote}
            onChangeText={setStatusNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Add details about the status change..."
          />
        </Card.Content>
      </Card>

      {/* Medical Details Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Medical Details
          </Text>
          
          <TextInput
            label="Diagnosis"
            value={diagnosis}
            onChangeText={setDiagnosis}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            placeholder="Update medical diagnosis..."
          />
          
          <TextInput
            label="Treatment Plan"
            value={treatmentPlan}
            onChangeText={setTreatmentPlan}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Update treatment plan..."
          />
          
          <TextInput
            label="Expected Return Date"
            value={expectedReturnDate}
            onChangeText={setExpectedReturnDate}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD or leave blank"
            keyboardType="default"
          />
          <Text variant="bodySmall" style={styles.hint}>
            Current: {formatDate(injury.expectedReturnDate)}
          </Text>
        </Card.Content>
      </Card>

      {/* Notes Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Additional Notes
          </Text>
          
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            placeholder="Add any additional notes..."
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleUpdate}
          loading={saving}
          disabled={saving}
          style={styles.primaryButton}
          icon="content-save"
        >
          Save Changes
        </Button>
        
        {!injury.isResolved && status !== InjuryStatus.RECOVERED && (
          <Button
            mode="contained-tonal"
            onPress={handleResolve}
            disabled={saving}
            style={styles.resolveButton}
            icon="check-circle"
            buttonColor={theme.colors.tertiary}
          >
            Mark as Resolved
          </Button>
        )}
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 120,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  inputLabel: {
    marginBottom: 8,
    marginTop: 8,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  input: {
    marginBottom: 12,
  },
  hint: {
    marginTop: -8,
    marginBottom: 12,
    color: '#757575',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 8,
  },
  resolveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
});

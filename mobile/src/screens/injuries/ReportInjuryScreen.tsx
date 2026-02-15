import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Snackbar, useTheme, Card } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { CreateInjuryDto, InjuryType, BodyPart, Side, Severity } from '../../types/injury.types';
import injuryService from '../../services/injury.service';
import { format } from 'date-fns';

const schema = yup.object().shape({
  playerId: yup.string().required('Player ID is required'),
  injuryType: yup.string().required('Injury type is required'),
  bodyPart: yup.string().required('Body part is required'),
  side: yup.string().required('Side is required'),
  severity: yup.string().required('Severity is required'),
  injuryDate: yup.date().required('Injury date is required'),
  mechanism: yup.string(),
  diagnosis: yup.string(),
  treatmentPlan: yup.string(),
  expectedReturnDate: yup.date(),
  notes: yup.string(),
});

export default function ReportInjuryScreen({ navigation, route }: any) {
  const { playerId: routePlayerId, playerName: routePlayerName } = route?.params || {};
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showInjuryDatePicker, setShowInjuryDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateInjuryDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      playerId: routePlayerId || user?.pseudonymId || '',
      injuryType: undefined,
      bodyPart: undefined,
      side: Side.LEFT,
      severity: Severity.MODERATE,
      injuryDate: new Date(),
      mechanism: '',
      diagnosis: '',
      treatmentPlan: '',
      expectedReturnDate: undefined,
      notes: '',
    },
  });

  const injuryDate = watch('injuryDate');
  const expectedReturnDate = watch('expectedReturnDate');

  const onSubmit = async (data: CreateInjuryDto) => {
    try {
      setLoading(true);
      
      const formattedData: CreateInjuryDto = {
        ...data,
        injuryDate: format(new Date(data.injuryDate), 'yyyy-MM-dd'),
        expectedReturnDate: data.expectedReturnDate 
          ? format(new Date(data.expectedReturnDate), 'yyyy-MM-dd')
          : undefined,
        mechanism: data.mechanism || undefined,
        diagnosis: data.diagnosis || undefined,
        treatmentPlan: data.treatmentPlan || undefined,
        notes: data.notes || undefined,
      };

      await injuryService.createInjury(formattedData);
      
      setSnackbarMessage('Injury reported successfully!');
      setSnackbarVisible(true);
      
      // Navigate back to injury list after a short delay
      setTimeout(() => {
        navigation.navigate('InjuryList');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating injury:', error);
      setSnackbarMessage(
        error.response?.data?.message || 'Failed to report injury. Please try again.'
      );
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const injuryTypes = Object.values(InjuryType);
  const bodyParts = Object.values(BodyPart);
  const sides = Object.values(Side);
  const severities = Object.values(Severity);

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
        <Text variant="headlineSmall" style={styles.title}>
          Report New Injury
        </Text>

        {/* Player Info Card - Show when player was selected */}
        {routePlayerName && (
          <Card style={styles.playerCard} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={styles.playerLabel}>
                Reporting for:
              </Text>
              <Text variant="titleLarge" style={styles.playerName}>
                {routePlayerName}
              </Text>
              <Text variant="bodySmall" style={styles.playerId}>
                ID: {routePlayerId}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Player ID - Only visible for coaches/admins who didn't select from list */}
        {user?.identityType !== 'player' && !routePlayerName && (
          <>
            <Controller
              control={control}
              name="playerId"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Player ID *"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.playerId}
                  textColor="#000000"
                  style={styles.input}
                />
              )}
            />
            {errors.playerId && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.playerId.message}
              </Text>
            )}
          </>
        )}

        {/* Injury Type */}
        <Text variant="titleSmall" style={styles.label}>Injury Type *</Text>
        <Controller
          control={control}
          name="injuryType"
          render={({ field: { onChange, value } }) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}
              contentContainerStyle={styles.chipContainer}
            >
              {injuryTypes.map((type) => (
                <Button
                  key={type}
                  mode={value === type ? 'contained' : 'outlined'}
                  onPress={() => onChange(type)}
                  style={styles.chip}
                  textColor={value === type ? undefined : '#000000'}
                  compact
                >
                  {type}
                </Button>
              ))}
            </ScrollView>
          )}
        />
        {errors.injuryType && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.injuryType.message}
          </Text>
        )}

        {/* Body Part */}
        <Text variant="titleSmall" style={styles.label}>Body Part *</Text>
        <Controller
          control={control}
          name="bodyPart"
          render={({ field: { onChange, value } }) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScrollView}
              contentContainerStyle={styles.chipContainer}
            >
              {bodyParts.map((part) => (
                <Button
                  key={part}
                  mode={value === part ? 'contained' : 'outlined'}
                  onPress={() => onChange(part)}
                  style={styles.chip}
                  textColor={value === part ? undefined : '#000000'}
                  compact
                >
                  {part}
                </Button>
              ))}
            </ScrollView>
          )}
        />
        {errors.bodyPart && (
          <Text variant="bodySmall" style={styles.errorText}>
            {errors.bodyPart.message}
          </Text>
        )}

        {/* Side */}
        <Text variant="titleSmall" style={styles.label}>Side *</Text>
        <Controller
          control={control}
          name="side"
          render={({ field: { onChange, value } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={sides.map((side) => ({
                value: side,
                label: side,
                uncheckedColor: '#000000',
                labelStyle: value === side ? undefined : { color: '#000000' },
              }))}
              style={styles.segmentedButtons}
            />
          )}
        />

        {/* Severity */}
        <Text variant="titleSmall" style={styles.label}>Severity *</Text>
        <Controller
          control={control}
          name="severity"
          render={({ field: { onChange, value } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={severities.map((severity) => ({
                value: severity,
                label: severity,
                uncheckedColor: '#000000',
                labelStyle: value === severity ? undefined : { color: '#000000' },
              }))}
              style={styles.segmentedButtons}
            />
          )}
        />

        {/* Injury Date */}
        <Text variant="titleSmall" style={styles.label}>Injury Date *</Text>
        <Button
          mode="outlined"
          onPress={() => setShowInjuryDatePicker(true)}
          icon="calendar"
          textColor="#000000"
          style={styles.dateButton}
        >
          {injuryDate ? format(new Date(injuryDate), 'MMM dd, yyyy') : 'Select Date'}
        </Button>
        {showInjuryDatePicker && (
          <DateTimePicker
            value={injuryDate ? new Date(injuryDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowInjuryDatePicker(false);
              if (selectedDate) {
                setValue('injuryDate', selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* Expected Return Date */}
        <Text variant="titleSmall" style={styles.label}>Expected Return Date</Text>
        <Button
          mode="outlined"
          onPress={() => setShowReturnDatePicker(true)}
          icon="calendar"
          textColor="#000000"
          style={styles.dateButton}
        >
          {expectedReturnDate ? format(new Date(expectedReturnDate), 'MMM dd, yyyy') : 'Select Date (Optional)'}
        </Button>
        {showReturnDatePicker && (
          <DateTimePicker
            value={expectedReturnDate ? new Date(expectedReturnDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowReturnDatePicker(false);
              if (selectedDate) {
                setValue('expectedReturnDate', selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Mechanism */}
        <Controller
          control={control}
          name="mechanism"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Mechanism of Injury"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="How did the injury occur?"
              textColor="#000000"
              style={styles.input}
            />
          )}
        />

        {/* Diagnosis */}
        <Controller
          control={control}
          name="diagnosis"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Diagnosis"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              placeholder="Medical diagnosis..."
              textColor="#000000"
              style={styles.input}
            />
          )}
        />

        {/* Treatment Plan */}
        <Controller
          control={control}
          name="treatmentPlan"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Treatment Plan"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              placeholder="Planned treatment and rehabilitation..."
              textColor="#000000"
              style={styles.input}
            />
          )}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Additional Notes"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              placeholder="Any additional information..."
              textColor="#000000"
              style={styles.input}
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Report Injury
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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
    paddingBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000',
  },
  playerCard: {
    marginBottom: 20,
    backgroundColor: '#E1BEE7',
  },
  playerLabel: {
    color: '#424242',
    marginBottom: 4,
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  playerId: {
    color: '#616161',
    fontFamily: 'monospace',
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  chipScrollView: {
    maxHeight: 50,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  dateButton: {
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});

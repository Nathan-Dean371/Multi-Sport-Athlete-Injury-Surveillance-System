import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Snackbar, useTheme, Card, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { CreateInjuryDto, InjuryType, BodyPart, Side, Severity } from '../../types/injury.types';
import injuryService from '../../services/injury.service';
import { format } from 'date-fns';

// Form data type for internal use (with Date objects)
interface QuickReportFormData {
  playerId: string;
  injuryType: InjuryType;
  bodyPart: BodyPart;
  side: Side;
  severity: Severity;
  injuryDate: Date;
  notes?: string;
}

const schema = yup.object().shape({
  playerId: yup.string().required('Player ID is required'),
  injuryType: yup.mixed<InjuryType>().oneOf(Object.values(InjuryType)).required('Injury type is required'),
  bodyPart: yup.mixed<BodyPart>().oneOf(Object.values(BodyPart)).required('Body part is required'),
  side: yup.mixed<Side>().oneOf(Object.values(Side)).required('Side is required'),
  severity: yup.mixed<Severity>().oneOf(Object.values(Severity)).required('Severity is required'),
  injuryDate: yup.date().required('Injury date is required'),
  notes: yup.string(),
});

interface QuickReportInjuryScreenProps {
  navigation: any;
  route: any;
}

export default function QuickReportInjuryScreen({ navigation, route }: QuickReportInjuryScreenProps) {
  const { playerId, playerName } = route.params;
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showInjuryDatePicker, setShowInjuryDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<QuickReportFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      playerId: playerId,
      injuryType: undefined,
      bodyPart: undefined,
      side: Side.LEFT,
      severity: Severity.MODERATE,
      injuryDate: new Date(),
      notes: '',
    },
  });

  const injuryDate = watch('injuryDate');

  const onSubmit = async (data: QuickReportFormData) => {
    try {
      setLoading(true);
      
      const formattedData: CreateInjuryDto = {
        ...data,
        injuryDate: format(new Date(data.injuryDate), 'yyyy-MM-dd'),
        notes: data.notes || undefined,
      };

      await injuryService.createInjury(formattedData);
      
      setSnackbarMessage('Quick injury report submitted successfully!');
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
        {/* Header */}
        <View style={styles.header}>
          <Chip icon="lightning-bolt" mode="flat" style={styles.quickBadge} textStyle={{ color: '#fff' }}>
            Quick Report
          </Chip>
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Pitch-Side Injury Report
        </Text>

        {/* Player Info Card */}
        <Card style={styles.playerCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium" style={styles.playerLabel}>
              Reporting for:
            </Text>
            <Text variant="titleLarge" style={styles.playerName}>
              {playerName}
            </Text>
            <Text variant="bodySmall" style={styles.playerId}>
              ID: {playerId}
            </Text>
          </Card.Content>
        </Card>

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

        {/* Quick Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Quick Notes (Optional)"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              placeholder="Add any immediate observations..."
              textColor="#000000"
              style={styles.input}
            />
          )}
        />

        <View style={styles.infoBox}>
          <Text variant="bodySmall" style={styles.infoText}>
            💡 This is a quick report. You can add detailed medical information later by editing the injury record.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          icon="lightning-bolt"
        >
          Submit Quick Report
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
  header: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  quickBadge: {
    backgroundColor: '#4CAF50',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  playerCard: {
    marginBottom: 24,
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
    marginTop: 8,
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
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    color: '#1976D2',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});

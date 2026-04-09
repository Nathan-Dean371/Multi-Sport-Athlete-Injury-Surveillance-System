import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
  useTheme,
  Card,
  ProgressBar,
  IconButton,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../contexts/AuthContext";
import {
  CreateInjuryDto,
  InjuryType,
  BodyPart,
  Side,
  Severity,
} from "../../types/injury.types";
import injuryService from "../../services/injury.service";
import { format } from "date-fns";
import BodyDiagramSelector from "../../components/BodyDiagramSelector";

const TOTAL_STEPS = 5;

const schema = yup.object().shape({
  playerId: yup.string().required("Player ID is required"),
  injuryType: yup.string().required("Injury type is required"),
  bodyPart: yup.string().required("Body part is required"),
  side: yup.string().required("Side is required"),
  severity: yup.string().required("Severity is required"),
  injuryDate: yup.string().required("Injury date is required"),
  mechanism: yup.string(),
  diagnosis: yup.string(),
  treatmentPlan: yup.string(),
  expectedReturnDate: yup.string(),
  notes: yup.string(),
});

export default function ReportInjuryScreen({ navigation, route }: any) {
  const { playerId: routePlayerId, playerName: routePlayerName } =
    route?.params || {};
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showInjuryDatePicker, setShowInjuryDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dateOption, setDateOption] = useState<"now" | "past">("now");

  const {
    control,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm<CreateInjuryDto>({
    resolver: yupResolver(schema) as any,
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      playerId: routePlayerId || user?.pseudonymId || "",
      injuryType: undefined,
      bodyPart: undefined,
      side: Side.LEFT,
      severity: Severity.MODERATE,
      injuryDate: format(new Date(), "yyyy-MM-dd"),
      mechanism: "",
      diagnosis: "",
      treatmentPlan: "",
      expectedReturnDate: undefined,
      notes: "",
    },
  });

  const injuryDate = watch("injuryDate");
  const injuryType = watch("injuryType");
  const bodyPart = watch("bodyPart");
  const side = watch("side");
  const severity = watch("severity");

  // Ensure non-text-input fields are registered so their values persist across
  // step unmounts and can be validated/triggered reliably.
  useEffect(() => {
    register("injuryType" as any);
    register("bodyPart" as any);
    register("side" as any);
    register("injuryDate" as any);
  }, [register]);

  console.log("Form values:", {
    injuryType,
    bodyPart,
    side,
    severity,
    injuryDate,
  });

  const handleNextStep = async () => {
    let isValid = false;

    console.log("handleNextStep - Current values:", getValues());

    // Validate current step before proceeding
    switch (currentStep) {
      case 1:
        isValid = await trigger(["bodyPart", "side"]);
        break;
      case 2:
        isValid = await trigger("injuryType");
        break;
      case 3:
        isValid = await trigger("severity");
        break;
      case 4:
        isValid = await trigger("injuryDate");
        break;
      case 5:
        // Notes are optional, always valid
        isValid = true;
        break;
    }

    console.log(
      "Validation result:",
      isValid,
      "Moving from step",
      currentStep,
      "to",
      currentStep + 1,
    );

    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDateOptionChange = (option: "now" | "past") => {
    setDateOption(option);
    if (option === "now") {
      setValue("injuryDate", format(new Date(), "yyyy-MM-dd"));
    } else {
      setShowInjuryDatePicker(true);
    }
  };

  const onSubmit = async (data: CreateInjuryDto) => {
    try {
      setLoading(true);

      // Data is already in the correct format
      const formattedData: CreateInjuryDto = {
        ...data,
        mechanism: data.mechanism || undefined,
        diagnosis: data.diagnosis || undefined,
        treatmentPlan: data.treatmentPlan || undefined,
        notes: data.notes || undefined,
      };

      await injuryService.createInjury(formattedData);

      setSnackbarMessage("Injury reported successfully!");
      setSnackbarVisible(true);

      // Navigate back to injury list after a short delay
      setTimeout(() => {
        navigation.navigate("InjuryList");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating injury:", error);
      setSnackbarMessage(
        error.response?.data?.message ||
          "Failed to report injury. Please try again.",
      );
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidSubmit = (formErrors: typeof errors) => {
    // If submission is blocked by validation, surface the error and move the
    // user to the first step that needs attention.
    if (formErrors.bodyPart || formErrors.side) {
      setCurrentStep(1);
      setSnackbarMessage(
        formErrors.bodyPart?.message ||
          formErrors.side?.message ||
          "Please select a body part",
      );
      setSnackbarVisible(true);
      return;
    }

    if (formErrors.injuryType) {
      setCurrentStep(2);
      setSnackbarMessage(
        formErrors.injuryType.message || "Please select an injury type",
      );
      setSnackbarVisible(true);
      return;
    }

    if (formErrors.severity) {
      setCurrentStep(3);
      setSnackbarMessage(
        formErrors.severity.message || "Please select a severity",
      );
      setSnackbarVisible(true);
      return;
    }

    if (formErrors.injuryDate) {
      setCurrentStep(4);
      setSnackbarMessage(
        formErrors.injuryDate.message || "Please select an injury date",
      );
      setSnackbarVisible(true);
      return;
    }

    // Fallback
    setSnackbarMessage("Please review the form and try again");
    setSnackbarVisible(true);
  };

  const injuryTypes = Object.values(InjuryType);
  const bodyParts = Object.values(BodyPart);
  const sides = Object.values(Side);
  const severities = Object.values(Severity);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Body Part + Side (Visual Diagram)
        return (
          <View style={styles.stepContainer}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Which body part?
            </Text>
            <Text variant="bodyLarge" style={styles.stepSubtitle}>
              Tap on the body diagram
            </Text>

            <BodyDiagramSelector
              selectedBodyPart={bodyPart as BodyPart | undefined}
              selectedSide={side as Side | undefined}
              onBodyPartSelect={(bodyPart) => {
                console.log("Body part selected:", bodyPart);
                setValue("bodyPart", bodyPart, { shouldValidate: true });
              }}
              onSideSelect={(side) => {
                console.log("Side selected:", side);
                setValue("side", side, { shouldValidate: true });
              }}
            />
            {errors.bodyPart && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.bodyPart.message}
              </Text>
            )}
          </View>
        );

      case 2:
        // Step 2: Injury Type
        return (
          <View style={styles.stepContainer}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              What type of injury?
            </Text>
            <Text variant="bodyLarge" style={styles.stepSubtitle}>
              Select the muscle or injury type
            </Text>

            <View style={styles.optionsGrid}>
              {injuryTypes.map((type) => (
                <Button
                  key={type}
                  mode={injuryType === type ? "contained" : "outlined"}
                  onPress={() => {
                    console.log("Injury type selected:", type);
                    setValue("injuryType", type as any, {
                      shouldValidate: true,
                    });
                  }}
                  style={styles.gridButton}
                  contentStyle={styles.gridButtonContent}
                  labelStyle={styles.gridButtonLabel}
                  textColor={injuryType === type ? undefined : "#000000"}
                >
                  {type}
                </Button>
              ))}
            </View>
            {errors.injuryType && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.injuryType.message}
              </Text>
            )}
          </View>
        );

      case 3:
        // Step 3: Severity
        return (
          <View style={styles.stepContainer}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              How severe is the pain?
            </Text>
            <Text variant="bodyLarge" style={styles.stepSubtitle}>
              Select the severity level
            </Text>

            <Controller
              control={control}
              name="severity"
              render={({ field: { onChange, value } }) => (
                <View style={styles.severityContainer}>
                  {severities.map((severityOption) => (
                    <Button
                      key={severityOption}
                      mode={value === severityOption ? "contained" : "elevated"}
                      onPress={() => onChange(severityOption)}
                      style={[
                        styles.severityButton,
                        value === severityOption &&
                          styles.severityButtonSelected,
                      ]}
                      contentStyle={styles.severityButtonContent}
                      labelStyle={styles.severityButtonLabel}
                      textColor={value === severityOption ? "#fff" : "#000000"}
                      buttonColor={
                        value === severityOption
                          ? severityOption === Severity.MINOR
                            ? "#4CAF50"
                            : severityOption === Severity.MODERATE
                              ? "#FF9800"
                              : severityOption === Severity.SEVERE
                                ? "#F44336"
                                : "#D32F2F"
                          : undefined
                      }
                    >
                      {severityOption}
                    </Button>
                  ))}
                </View>
              )}
            />
            {errors.severity && (
              <Text variant="bodySmall" style={styles.errorText}>
                {errors.severity.message}
              </Text>
            )}
          </View>
        );

      case 4:
        // Step 4: Date
        return (
          <View style={styles.stepContainer}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              When did it happen?
            </Text>
            <Text variant="bodyLarge" style={styles.stepSubtitle}>
              Select when the injury occurred
            </Text>

            <View style={styles.dateOptionsContainer}>
              <Button
                mode={dateOption === "now" ? "contained" : "outlined"}
                onPress={() => handleDateOptionChange("now")}
                style={styles.dateOptionButton}
                contentStyle={styles.dateOptionButtonContent}
                icon="clock-outline"
                textColor={dateOption === "now" ? undefined : "#000000"}
              >
                Just Now
              </Button>
              <Button
                mode={dateOption === "past" ? "contained" : "outlined"}
                onPress={() => handleDateOptionChange("past")}
                style={styles.dateOptionButton}
                contentStyle={styles.dateOptionButtonContent}
                icon="calendar"
                textColor={dateOption === "past" ? undefined : "#000000"}
              >
                Earlier Date
              </Button>
            </View>

            {dateOption === "past" && (
              <Card style={styles.dateCard} mode="outlined">
                <Card.Content>
                  <Text variant="titleSmall" style={styles.dateLabel}>
                    Selected Date:
                  </Text>
                  <Text variant="headlineSmall" style={styles.dateValue}>
                    {format(new Date(injuryDate), "MMMM dd, yyyy")}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setShowInjuryDatePicker(true)}
                    icon="calendar-edit"
                    style={styles.changeDateButton}
                    textColor="#000000"
                  >
                    Change Date
                  </Button>
                </Card.Content>
              </Card>
            )}

            {showInjuryDatePicker && (
              <DateTimePicker
                value={injuryDate ? new Date(injuryDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowInjuryDatePicker(false);
                  if (selectedDate) {
                    setValue("injuryDate", format(selectedDate, "yyyy-MM-dd"));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
        );

      case 5:
        // Step 5: Optional Notes
        return (
          <View style={styles.stepContainer}>
            <Text variant="headlineMedium" style={styles.stepTitle}>
              Any additional details?
            </Text>
            <Text variant="bodyLarge" style={styles.stepSubtitle}>
              Optional - Add notes about the injury
            </Text>

            <Card style={styles.summaryCard} mode="elevated">
              <Card.Content>
                <Text variant="titleSmall" style={styles.summaryTitle}>
                  Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium" style={styles.summaryLabel}>
                    Type:
                  </Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>
                    {injuryType || "Not selected"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium" style={styles.summaryLabel}>
                    Body Part:
                  </Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>
                    {bodyPart ? `${bodyPart} (${side})` : "Not selected"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium" style={styles.summaryLabel}>
                    Severity:
                  </Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>
                    {severity}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium" style={styles.summaryLabel}>
                    Date:
                  </Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>
                    {format(new Date(injuryDate), "MMM dd, yyyy")}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Additional Notes (Optional)"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  placeholder="E.g., mechanism of injury, symptoms, treatment needed..."
                  textColor="#000000"
                  style={styles.notesInput}
                />
              )}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Report Injury
          </Text>
          <Text variant="bodyMedium" style={styles.stepIndicator}>
            Step {currentStep} of {TOTAL_STEPS}
          </Text>
        </View>
        <ProgressBar
          progress={currentStep / TOTAL_STEPS}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      {/* Player Info Card - Show when player was selected */}
      {routePlayerName && currentStep === 1 && (
        <Card style={styles.playerCard} mode="elevated">
          <Card.Content>
            <Text variant="labelMedium" style={styles.playerLabel}>
              Reporting for:
            </Text>
            <Text variant="titleLarge" style={styles.playerName}>
              {routePlayerName}
            </Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {currentStep > 1 && (
            <Button
              mode="outlined"
              onPress={handlePrevStep}
              style={styles.backButton}
              icon="arrow-left"
              textColor="#000000"
            >
              Back
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button
              mode="contained"
              onPress={handleNextStep}
              style={styles.nextButton}
              icon="arrow-right"
              contentStyle={{
                ...styles.nextButtonContent,
                flexDirection: "row-reverse",
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit, handleInvalidSubmit)}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="check"
            >
              Submit Report
            </Button>
          )}
        </View>
      </View>

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
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#000",
  },
  stepIndicator: {
    color: "#666",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  stepSubtitle: {
    color: "#666",
    marginBottom: 24,
  },
  playerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#E1BEE7",
  },
  playerLabel: {
    color: "#424242",
    marginBottom: 4,
  },
  playerName: {
    fontWeight: "bold",
    color: "#000",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  gridButton: {
    flexBasis: "47%",
    flexGrow: 0,
    marginBottom: 8,
  },
  gridButtonContent: {
    paddingVertical: 12,
  },
  gridButtonLabel: {
    fontSize: 14,
  },
  sideLabel: {
    marginTop: 24,
    marginBottom: 12,
    fontWeight: "600",
    color: "#000",
  },
  sideButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sideButton: {
    flex: 1,
  },
  sideButtonContent: {
    paddingVertical: 12,
  },
  severityContainer: {
    gap: 16,
    marginTop: 8,
  },
  severityButton: {
    borderRadius: 12,
  },
  severityButtonSelected: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  severityButtonContent: {
    paddingVertical: 20,
  },
  severityButtonLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dateOptionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  dateOptionButton: {
    flex: 1,
  },
  dateOptionButtonContent: {
    paddingVertical: 16,
  },
  dateCard: {
    marginTop: 8,
    backgroundColor: "#F5F5F5",
  },
  dateLabel: {
    color: "#666",
    marginBottom: 4,
  },
  dateValue: {
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  changeDateButton: {
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: 20,
    backgroundColor: "#E3F2FD",
  },
  summaryTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#666",
    fontWeight: "500",
  },
  summaryValue: {
    color: "#000",
    fontWeight: "bold",
  },
  notesInput: {
    backgroundColor: "#fff",
    marginTop: 8,
  },
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  nextButtonContent: {
    paddingVertical: 6,
  },
  submitButton: {
    flex: 2,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  errorText: {
    color: "#B00020",
    marginTop: 8,
  },
});

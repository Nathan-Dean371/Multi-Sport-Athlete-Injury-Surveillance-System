import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format } from "date-fns";
import playerService from "../../services/player.service";
import { AcceptPlayerInvitationRequest } from "../../types/invite.types";

type FormValues = {
  token: string;
  password: string;
  dateOfBirth: Date;
};

const schema = yup.object().shape({
  token: yup.string().required("Invitation token is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
});

export default function AcceptAthleteInviteScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      token: "",
      password: "",
      dateOfBirth: new Date(),
    },
  });

  const dob = watch("dateOfBirth");

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const payload: AcceptPlayerInvitationRequest = {
        token: data.token,
        password: data.password,
        dateOfBirth: format(new Date(data.dateOfBirth), "yyyy-MM-dd"),
      };

      await playerService.acceptInvite(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to accept invitation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Accept Athlete Invitation
          </Text>

          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Invitation Token"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.token}
                style={styles.input}
                autoCapitalize="none"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.token}>
            {errors.token?.message}
          </HelperText>

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <View>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <TextInput
                    label="Date of Birth"
                    mode="outlined"
                    value={value ? format(new Date(value), "yyyy-MM-dd") : ""}
                    editable={false}
                    error={!!errors.dateOfBirth}
                    style={styles.input}
                    right={<TextInput.Icon icon="calendar" />}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        onChange(selectedDate);
                        setValue("dateOfBirth", selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            )}
          />
          <HelperText type="error" visible={!!errors.dateOfBirth}>
            {errors.dateOfBirth?.message}
          </HelperText>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={!!errors.password}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>

          {error ? (
            <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          {success ? (
            <HelperText type="info" visible style={styles.successText}>
              Invitation accepted. You can now sign in using your invited email.
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Accept Invitation
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate("Login")}
            style={styles.linkButton}
          >
            Back to Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 8,
  },
  errorText: {
    textAlign: "center",
  },
  successText: {
    textAlign: "center",
  },
});

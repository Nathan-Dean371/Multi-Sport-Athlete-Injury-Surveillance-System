import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import parentsService from "../../services/parents.service";
import { AcceptParentInvitationRequest } from "../../types/invite.types";

const schema = yup.object().shape({
  token: yup.string().required("Invitation token is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function AcceptParentInviteScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedPseudonymId, setAcceptedPseudonymId] = useState<string | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptParentInvitationRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      token: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  const onSubmit = async (data: AcceptParentInvitationRequest) => {
    try {
      setLoading(true);
      setError("");
      setAcceptedPseudonymId(null);

      const res = await parentsService.acceptInvitation(data);
      setAcceptedPseudonymId(res.pseudonymId);
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
            Accept Parent Invitation
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
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="First Name"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.firstName}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.firstName}>
            {errors.firstName?.message}
          </HelperText>

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Last Name"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.lastName}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.lastName}>
            {errors.lastName?.message}
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

          {acceptedPseudonymId ? (
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

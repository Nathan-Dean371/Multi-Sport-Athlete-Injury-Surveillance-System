import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Card,
  Divider,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import parentsService from "../../services/parents.service";
import { InviteAthleteRequest } from "../../types/invite.types";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
});

export default function InviteAthleteScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteAthleteRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: InviteAthleteRequest) => {
    try {
      setLoading(true);
      setError("");
      setToken(null);
      setInvitationLink(null);

      const res = await parentsService.inviteAthlete(data);
      setToken(res.token);
      setInvitationLink(res.invitationLink || null);
      reset({ email: "", firstName: "", lastName: "" });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to invite athlete. Please try again.",
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
          <Text variant="headlineMedium" style={styles.title}>
            Invite Athlete
          </Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Athlete First Name"
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
                label="Athlete Last Name"
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
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Athlete Email"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email?.message}
          </HelperText>

          {error ? (
            <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Send Invite
          </Button>

          {invitationLink ? (
            <Card style={styles.tokenCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.tokenTitle}>
                  Invitation Link
                </Text>
                <Divider style={styles.divider} />
                <Text selectable>{invitationLink}</Text>
              </Card.Content>
            </Card>
          ) : null}

          {token ? (
            <Card style={styles.tokenCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.tokenTitle}>
                  Invitation Token
                </Text>
                <Divider style={styles.divider} />
                <Text selectable>{token}</Text>
              </Card.Content>
            </Card>
          ) : null}

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.linkButton}
          >
            Back
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
    paddingTop: 24,
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
    marginTop: 12,
  },
  errorText: {
    textAlign: "center",
  },
  tokenCard: {
    marginTop: 16,
  },
  tokenTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 12,
  },
});

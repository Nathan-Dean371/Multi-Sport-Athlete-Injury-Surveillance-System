import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useAuth } from "../contexts/AuthContext";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { ActivityIndicator, View } from "react-native";
import { navigationRef, navigate } from "./navigationRef";

// Main authenticated app
function MainApp() {
  return <TabNavigator />;
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!isAuthenticated) return;

        const data: any = response.notification.request.content.data;
        if (data?.kind === "training-post-session") {
          navigate("Training", {
            screen: "TrainingReportWizard",
            params: {
              sessionId: data.sessionId,
              occurrenceDate: data.occurrenceDate,
            },
          });
        }
      },
    );

    return () => {
      sub.remove();
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainApp /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

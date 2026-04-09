import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import ErrorBoundary from "./src/components/common/ErrorBoundary";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // SDK 54 NotificationBehavior
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <ErrorBoundary>
      <PaperProvider>
        <AuthProvider>
          <AppNavigator />
          <Toast />
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}

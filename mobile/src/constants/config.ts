import Constants from "expo-constants";
import { Platform } from "react-native";

const PROD_API_URL = "http://54.194.7.2:3000";
const expoEnv = (globalThis as any).process?.env ?? {};

const getExpoHost = (): string | undefined => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== "string") {
    return undefined;
  }

  return hostUri.split(":")[0];
};

const getDevApiUrl = (): string => {
  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

const getApiUrl = (): string => {
  const manualApiUrl = expoEnv.EXPO_PUBLIC_API_URL?.trim();
  if (manualApiUrl) {
    return manualApiUrl;
  }

  const appMode = (expoEnv.EXPO_PUBLIC_APP_MODE ?? "dev").toLowerCase();
  if (appMode === "prod") {
    return PROD_API_URL;
  }

  return getDevApiUrl();
};

const ENV = {
  appMode: (expoEnv.EXPO_PUBLIC_APP_MODE ?? "dev").toLowerCase(),
  apiUrl: getApiUrl(),
};

export default ENV;

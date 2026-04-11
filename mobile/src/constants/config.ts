import Constants from "expo-constants";
import { Platform } from "react-native";

const PROD_API_URL = "http://54.194.7.2:3000";
const EXPO_PUBLIC_API_URL: string | undefined =
  (typeof process !== "undefined"
    ? (process.env.EXPO_PUBLIC_API_URL as string | undefined)
    : undefined) ?? (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL;

const EXPO_PUBLIC_APP_MODE: string | undefined =
  (typeof process !== "undefined"
    ? (process.env.EXPO_PUBLIC_APP_MODE as string | undefined)
    : undefined) ?? (globalThis as any).process?.env?.EXPO_PUBLIC_APP_MODE;

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
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    if (!isLocalhostHost(browserHost)) {
      return `http://${browserHost}:3000`;
    }
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

const isLocalhostHost = (host: string): boolean => {
  return ["localhost", "127.0.0.1", "::1"].includes(host.toLowerCase());
};

const rewriteLocalhostApiUrl = (urlValue: string): string => {
  try {
    const parsed = new URL(urlValue);
    if (!isLocalhostHost(parsed.hostname)) {
      return urlValue;
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const browserHost = window.location.hostname;
      if (!isLocalhostHost(browserHost)) {
        parsed.hostname = browserHost;
        return parsed.toString().replace(/\/+$/, "");
      }
    }

    const expoHost = getExpoHost();
    if (expoHost) {
      parsed.hostname = expoHost;
      return parsed.toString().replace(/\/+$/, "");
    }

    if (Platform.OS === "android") {
      parsed.hostname = "10.0.2.2";
      return parsed.toString().replace(/\/+$/, "");
    }

    return urlValue;
  } catch {
    return urlValue;
  }
};

const getApiUrl = (): string => {
  const manualApiUrl = EXPO_PUBLIC_API_URL?.trim();
  if (manualApiUrl) {
    return rewriteLocalhostApiUrl(manualApiUrl);
  }

  const appMode = (EXPO_PUBLIC_APP_MODE ?? "dev").toLowerCase();
  if (appMode === "prod") {
    return PROD_API_URL;
  }

  return getDevApiUrl();
};

const ENV = {
  appMode: (EXPO_PUBLIC_APP_MODE ?? "dev").toLowerCase(),
  apiUrl: getApiUrl(),
};

export default ENV;

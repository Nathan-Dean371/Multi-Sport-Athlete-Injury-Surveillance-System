const DEFAULT_API_URL = "http://localhost:3000";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const isLocalhostHost = (host: string): boolean => {
  return LOCALHOST_HOSTS.has(host.toLowerCase());
};

const normalizeBaseUrl = (value: string): string => {
  return value.replace(/\/+$/, "");
};

const replaceLocalhostHost = (apiUrl: string, host: string): string => {
  try {
    const parsedUrl = new URL(apiUrl);
    if (!isLocalhostHost(parsedUrl.hostname)) {
      return normalizeBaseUrl(apiUrl);
    }

    parsedUrl.hostname = host;
    return normalizeBaseUrl(parsedUrl.toString());
  } catch {
    return normalizeBaseUrl(apiUrl);
  }
};

const inferApiHostFromAdminHost = (host: string): string | null => {
  const normalizedHost = host.trim().toLowerCase();
  if (normalizedHost.startsWith("admin.")) {
    return `api.${host.trim().slice("admin.".length)}`;
  }

  return null;
};

export const getApiBaseUrl = (): string => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

  if (typeof window === "undefined") {
    return normalizeBaseUrl(configuredUrl);
  }

  const browserHost = window.location.hostname;
  if (isLocalhostHost(browserHost)) {
    return normalizeBaseUrl(configuredUrl);
  }

  try {
    const parsedConfiguredUrl = new URL(configuredUrl);
    if (isLocalhostHost(parsedConfiguredUrl.hostname)) {
      const inferredApiHost = inferApiHostFromAdminHost(browserHost);
      if (inferredApiHost) {
        parsedConfiguredUrl.protocol = window.location.protocol;
        parsedConfiguredUrl.hostname = inferredApiHost;
        parsedConfiguredUrl.port = "";
        return normalizeBaseUrl(parsedConfiguredUrl.toString());
      }
    }
  } catch {
    // fall through
  }

  return replaceLocalhostHost(configuredUrl, browserHost);
};

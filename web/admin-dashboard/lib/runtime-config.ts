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

  return replaceLocalhostHost(configuredUrl, browserHost);
};

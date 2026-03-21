import { create } from "zustand";
import { apiClient } from "@/lib/api";

const AUTH_USER_STORAGE_KEY = "authUser";

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function isJwtExpired(token: string): boolean {
  // If we can't parse exp, assume it's not expired and rely on API 401s.
  if (typeof window === "undefined" || typeof atob !== "function") return false;
  const parts = token.split(".");
  if (parts.length < 2) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

interface User {
  id: string;
  email: string;
  identity_type: string;
  pseudonym_id: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  error: null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login({ email, password });
      apiClient.setToken(response.accessToken);
      writeStoredUser(response.user);
      set({
        isAuthenticated: true,
        user: response.user,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      set({
        isAuthenticated: false,
        user: null,
        error: errorMessage,
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    apiClient.clearToken();
    writeStoredUser(null);
    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  checkAuth: () => {
    const token = apiClient.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    if (isJwtExpired(token)) {
      apiClient.clearToken();
      writeStoredUser(null);
      set({ isAuthenticated: false, user: null });
      return;
    }

    const storedUser = readStoredUser();
    if (!storedUser) {
      // Token exists but we have no user context; treat as logged out to avoid infinite loading states.
      apiClient.clearToken();
      writeStoredUser(null);
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isAuthenticated: true, user: storedUser });
  },
}));

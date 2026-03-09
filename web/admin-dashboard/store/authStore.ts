import { create } from "zustand";
import { apiClient } from "@/lib/api";

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
    set({
      isAuthenticated: false,
      user: null,
      error: null,
    });
  },

  checkAuth: () => {
    const token = apiClient.getToken();
    if (token) {
      set({ isAuthenticated: true });
    }
  },
}));

import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (email: string, password: string) => {
    // Simulated authentication
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({
      isAuthenticated: true,
      user: {
        id: "1",
        name: "Coach Admin",
        email: email,
      },
    });
  },
  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
    });
  },
}));

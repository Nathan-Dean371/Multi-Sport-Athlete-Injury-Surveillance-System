import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import authService from "../services/auth.service";
import { getToken, getUser, removeToken, removeUser } from "../utils/storage";
import { isJwtExpired } from "../utils/jwt";
import { onUnauthorized } from "../utils/auth-events";
import { User, LoginRequest, RegisterRequest } from "../types/auth.types";

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      setUser(null);
    });

    return unsubscribe;
  }, []);

  async function loadStoredUser() {
    try {
      const token = await getToken();
      const storedUser = await getUser();

      if (!token || !storedUser) {
        setUser(null);
        return;
      }

      if (isJwtExpired(token, 30)) {
        await removeToken();
        await removeUser();
        setUser(null);
        return;
      }

      setUser(storedUser);
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(credentials: LoginRequest) {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  }

  async function signUp(data: RegisterRequest) {
    try {
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

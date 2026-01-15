import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    console.log('Checking stored auth:', { token, storedUser });
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Restored user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    console.log('Login response:', response.data);
    
    const { accessToken, user: userData } = response.data;
    
    // Store token and user in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('Stored in localStorage:', {
      token: accessToken,
      user: userData
    });
    
    setUser(userData);
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
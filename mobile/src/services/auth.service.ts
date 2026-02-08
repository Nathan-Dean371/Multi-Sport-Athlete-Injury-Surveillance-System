import apiService from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';
import { saveToken, saveUser, removeToken, removeUser } from '../utils/storage';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login with credentials:', { email: credentials.email });
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      // Save token and user data
      await saveToken(response.accessToken);
      await saveUser(response.user);
      
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.message === 'Network Error') {
        console.error('⚠️ Network Error - Cannot reach backend server');
        console.error('Make sure backend is running and accessible');
      }
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', data);
      
      // Save token and user data
      await saveToken(response.accessToken);
      await saveUser(response.user);
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Optional: Call backend logout endpoint if you have one
      // await apiService.post('/auth/logout');
      
      // Clear local storage
      await removeToken();
      await removeUser();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
}

export default new AuthService();

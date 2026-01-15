import axios from 'axios';
import type { LoginResponse, Player, Injury, CreateInjuryDto, UpdateInjuryDto } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    identityType: string;
  }) => api.post<LoginResponse>('/auth/register', data),
};

export const playersApi = {
  getAll: () => api.get<Player[]>('/players'),
  getById: (id: string) => api.get<Player>(`/players/${id}`),
  getInjuries: (id: string) => api.get<Injury[]>(`/players/${id}/injuries`),
};

export const injuriesApi = {
  create: (data: CreateInjuryDto) => api.post<Injury>('/injuries', data),
  getById: (id: string) => api.get<Injury>(`/injuries/${id}`),
  update: (id: string, data: UpdateInjuryDto) => api.patch<Injury>(`/injuries/${id}`, data),
};

export default api;
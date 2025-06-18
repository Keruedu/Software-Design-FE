import api from './api';
import { User, LoginResponse, RegisterRequest, LoginRequest } from '../types/auth';

export const authService = {
  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post('/user/register', userData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/user/login', credentials, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  async logout(): Promise<void> {
    await api.post('/user/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/user/me');
    return response.data;
  },

  async refreshToken(): Promise<LoginResponse> {
    const response = await api.post('/user/refresh');
    return response.data;
  }
};

import api from './api';
import { User, LoginResponse, RegisterRequest, LoginRequest } from '../types/auth';

export const authService = {
  async register(userData: RegisterRequest): Promise<User> {
    const formData = new FormData();
    formData.append('username', userData.username);
    formData.append('email', userData.email);
    formData.append('password', userData.password);

    const response = await api.post('/user/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/user/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// Base API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle different error statuses
    const { response } = error;
    
    if (response && response.status === 401) {
      try {
        // Try to refresh token
        const refreshResponse = await api.post('/user/refresh');
        localStorage.setItem('access_token', refreshResponse.data.access_token);
        
        // Retry original request
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
        return api.request(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

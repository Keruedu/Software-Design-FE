import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface AuthContextType {
  auth: AuthState;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(initialState);
  
  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAuth({ ...initialState, loading: false });
        return;
      }

      const user = await authService.getCurrentUser();
      setAuth({
        isAuthenticated: true,
        user,
        token,
        loading: false
      });
    } catch (error) {
      localStorage.removeItem('access_token');
      setAuth({ ...initialState, loading: false });
    }
  };
  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    try {
      // For now, always send as username field since backend expects it
      // In future, backend should handle both email and username
      const response = await authService.login({ username: usernameOrEmail, password });
      localStorage.setItem('access_token', response.access_token);
      
      const user = await authService.getCurrentUser();
      setAuth({
        isAuthenticated: true,
        user,
        token: response.access_token,
        loading: false
      });
    } catch (error) {
      throw new Error('Invalid email/username or password');
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      await authService.register({ username, email, password });
      // Auto login after register
      await login(email, password);
    } catch (error) {
      throw new Error('Registration failed');
    }
  };
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      setAuth({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    }
  };
  
  const value = {
    auth,
    login,
    logout,
    register
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

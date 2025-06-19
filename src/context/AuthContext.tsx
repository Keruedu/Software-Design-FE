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
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  };  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    try {
      setAuth(prev => ({ ...prev, loading: true }));
      
      // Demo login first for development
      if (usernameOrEmail === 'demo@example.com' && password === 'password') {
        const demoUser: User = {
          id: 'demo_user_123',
          username: 'demo_user',
          email: 'demo@example.com',
          fullName: 'Demo User',
          avatar: '/assets/images/avatars/demo-avatar.jpg'
        };
        const demoToken = 'demo_token_' + Date.now();
        
        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('user_data', JSON.stringify(demoUser));
        
        setAuth({
          isAuthenticated: true,
          user: demoUser,
          token: demoToken,
          loading: false
        });
        return;
      }
      
      // Try real API login
      try {
        const response = await authService.login({ username: usernameOrEmail, password });
        localStorage.setItem('access_token', response.access_token);
        
        // Try to get user data from login response first
        let user = response.user;
        if (!user) {
          // Fallback: try to get current user
          user = await authService.getCurrentUser();
        }
        
        localStorage.setItem('user_data', JSON.stringify(user));
        
        setAuth({
          isAuthenticated: true,
          user,
          token: response.access_token,
          loading: false
        });
      } catch (apiError) {
        setAuth(prev => ({ ...prev, loading: false }));
        throw new Error('Invalid email/username or password');
      }
    } catch (error) {
      setAuth(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      await authService.register({ username, email, password });
      // Auto login after register
      // await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.loading,
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

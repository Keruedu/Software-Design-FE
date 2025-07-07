import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User } from '../types/auth';
import { useRouter } from 'next/router';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface AuthContextType {
  auth: AuthState;
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, fullName: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
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
  const router = useRouter();
  
  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const processHashToken = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const accessTokenMatch = hash.match(/access_token=([^&]*)/);
      
      if (accessTokenMatch && accessTokenMatch[1]) {
        const token = accessTokenMatch[1];
        localStorage.setItem('access_token', token);
        
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );
        
        return token;
      }
    }
    return null;
  };

  const checkAuthStatus = async () => {
    try {
      const hashToken = processHashToken();
      const token = hashToken || localStorage.getItem('access_token');
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
    const loginWithGoogle = async (): Promise<void> => {
    try {
      const response = await authService.getGoogleAuthUrl();
      window.location.href = response.auth_url;
    } catch (error) {
      throw new Error('Không thể bắt đầu đăng nhập Google');
    }
  };

  const loginWithFacebook = async (): Promise<void> => {
    try {
      const response = await authService.getFacebookAuthUrl();
      window.location.href = response.auth_url;
    } catch (error) {
      throw new Error('Không thể bắt đầu đăng nhập Facebook');
    }
  };

  const register = async (username: string, email: string, fullName: string, password: string): Promise<void> => {
    try {
      await authService.register({ username, email, fullName, password });
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
      router.push('/auth/login');
    }
  }
  
  const value = {
    auth,
    // user: auth.user,
    // token: auth.token,
    // isAuthenticated: auth.isAuthenticated,
    // isLoading: auth.loading,
    setAuth,
    login,
    logout,
    loginWithGoogle,
    loginWithFacebook,
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


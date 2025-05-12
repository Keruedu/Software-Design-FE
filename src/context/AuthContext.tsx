import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock auth functions for demo
const mockLogin = async (email: string, password: string): Promise<{user: User, token: string}> => {
  // Simulate API request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (email === 'demo@example.com' && password === 'password') {
    return {
      user: {
        id: 'user1',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User'
      },
      token: 'mock-auth-token'
    };
  }
  
  throw new Error('Invalid credentials');
};

const mockRegister = async (name: string, email: string, password: string): Promise<{user: User, token: string}> => {
  // Simulate API request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === 'demo@example.com') {
    throw new Error('Email already exists');
  }
  
  return {
    user: {
      id: 'user2',
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
    },
    token: 'mock-auth-token'
  };
};

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(initialState);
  
  useEffect(() => {
    // Check for saved token on initial load
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setAuth({
          isAuthenticated: true,
          user,
          token,
          loading: false
        });
      } catch (error) {
        console.error('Failed to parse saved user data');
        setAuth({...initialState, loading: false});
      }
    } else {
      setAuth({...initialState, loading: false});
    }
  }, []);
  
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { user, token } = await mockLogin(email, password);
      
      // Save auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      setAuth({
        isAuthenticated: true,
        user,
        token,
        loading: false
      });
    } catch (error) {
      throw error;
    }
  };
  
  const logout = (): void => {
    // Clear saved auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    setAuth({...initialState, loading: false});
  };
  
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const { user, token } = await mockRegister(name, email, password);
      
      // Save auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      setAuth({
        isAuthenticated: true,
        user,
        token,
        loading: false
      });
    } catch (error) {
      throw error;
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

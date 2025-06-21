import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthDebugPage: React.FC = () => {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      console.log('Token from localStorage:', token);
      
      try {
        if (token) {
          const user = await authService.getCurrentUser();
          console.log('Current user:', user);
          setAuthInfo({
            hasToken: !!token,
            token: token?.substring(0, 20) + '...',
            user: user,
            error: null
          });
        } else {
          setAuthInfo({
            hasToken: false,
            token: null,
            user: null,
            error: 'No token found'
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        setAuthInfo({
          hasToken: !!token,
          token: token?.substring(0, 20) + '...',
          user: null,
          error: error
        });
      }
    };

    checkAuth();
  }, []);

  const testLogin = async () => {
    try {
      // Test with demo credentials
      const response = await authService.login({ username: 'testuser', password: 'testpass123' });
      console.log('Login response:', response);
      location.reload();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Auth Status:</h3>
        <pre>{JSON.stringify(authInfo, null, 2)}</pre>
      </div>

      <button onClick={testLogin} style={{ marginRight: '10px' }}>
        Test Login
      </button>
      
      <button onClick={() => { localStorage.removeItem('access_token'); location.reload(); }}>
        Clear Token
      </button>
    </div>
  );
};

export default AuthDebugPage;

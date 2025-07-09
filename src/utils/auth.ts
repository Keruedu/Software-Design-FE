// Authentication utilities
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try multiple possible token storage locations
  const possibleTokenKeys = [
    'token',
    'authToken', 
    'access_token',
    'accessToken',
    'jwt_token',
    'bearerToken'
  ];
  
  // Check localStorage first
  for (const key of possibleTokenKeys) {
    const token = localStorage.getItem(key);
    if (token && token.trim()) {
      return token.trim();
    }
  }
  
  // Check sessionStorage
  for (const key of possibleTokenKeys) {
    const token = sessionStorage.getItem(key);
    if (token && token.trim()) {
      return token.trim();
    }
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  
  const possibleKeys = [
    'token',
    'authToken', 
    'access_token',
    'accessToken',
    'jwt_token',
    'bearerToken',
    'user',
    'userData',
    'currentUser'
  ];
  
  // Clear from localStorage
  possibleKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Clear from sessionStorage
  possibleKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
};

export const redirectToLogin = (message?: string): void => {
  if (typeof window === 'undefined') return;
  
  if (message) {
    alert(message);
  }
  
  // Store current location to redirect back after login
  const currentPath = window.location.pathname + window.location.search;
  sessionStorage.setItem('redirectAfterLogin', currentPath);
  
  window.location.href = '/auth/login';
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('token', token);
  localStorage.setItem('authToken', token); // Backup storage
};

export const validateToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if token is expired (if it's a JWT)
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    
    return true;
  } catch {
    // If it's not a JWT, just check if it exists and has reasonable length
    return token.length > 10;
  }
};

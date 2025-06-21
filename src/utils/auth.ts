/**
 * Auth utilities
 */

export const isTokenValid = (token: string): boolean => {
  try {
    if (!token) return false;
    
    // Decode JWT token without verification (for checking expiry)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const getValidToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  if (!isTokenValid(token)) {
    localStorage.removeItem('access_token');
    return null;
  }
  
  return token;
};

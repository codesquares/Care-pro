import { useState, useEffect, useCallback } from 'react';
import { logout as authServiceLogout } from '../services/auth';

/**
 * Custom hook for managing JWT token expiration
 * Provides proactive token validation and expiration warnings
 */
export const useTokenExpiration = () => {
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);

  // Parse JWT token to extract expiration
  const parseToken = useCallback((token) => {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }, []);

  // Check token validity and calculate time until expiry
  const checkToken = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsTokenValid(false);
        setTimeUntilExpiry(0);
        return;
      }

      const payload = parseToken(token);
      
      if (!payload || !payload.exp) {
        setIsTokenValid(false);
        setTimeUntilExpiry(0);
        authServiceLogout();
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const timeLeft = expirationTime - currentTime;

      setTimeUntilExpiry(timeLeft);

      if (timeLeft <= 0) {
        setIsTokenValid(false);
        authServiceLogout();
      } else {
        setIsTokenValid(true);
        
        // Show warning when 5 minutes or less remain
        if (timeLeft <= 300 && timeLeft > 0) {
          if (typeof window.showExpirationWarning === 'function') {
            window.showExpirationWarning(timeLeft);
          }
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setIsTokenValid(false);
      setTimeUntilExpiry(0);
      authServiceLogout();
    }
  }, [parseToken]);

  // Monitor token expiration every minute
  useEffect(() => {
    // Initial check
    checkToken();

    // Set up interval to check every minute
    const interval = setInterval(checkToken, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [checkToken]);

  // Also check token when localStorage might have changed
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkToken]);

  return {
    isTokenValid,
    timeUntilExpiry
  };
};

/**
 * Token Expiration Provider component
 * Wraps the app to provide global token monitoring
 */
export const TokenExpirationProvider = ({ children }) => {
  useTokenExpiration();
  return children;
};

export default useTokenExpiration;
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for cross-tab authentication synchronization
 * Handles storage events and message passing between browser tabs
 */
export const useCrossTabSync = ({
  setIsAuthenticated,
  setUser,
  setUserRole
} = {}) => {
  const navigate = useNavigate();

  /**
   * Handle storage events from other tabs
   */
  const handleStorageChange = useCallback((e) => {
    if (!e || !e.key) return;

    if (e.key === 'authToken' && !e.newValue) {
      // Token removed in another tab
      if (setIsAuthenticated) setIsAuthenticated(false);
      if (setUser) setUser(null);
      if (setUserRole) setUserRole(null);
      navigate('/login', { replace: true });
    } else if (e.key === 'userDetails') {
      if (!e.newValue) {
        // User details removed in another tab
        if (setIsAuthenticated) setIsAuthenticated(false);
        if (setUser) setUser(null);
        if (setUserRole) setUserRole(null);
        navigate('/login', { replace: true });
      } else {
        // User details updated in another tab
        try {
          const newUserData = JSON.parse(e.newValue);
          if (setUser) setUser(newUserData);
          if (setUserRole) setUserRole(newUserData.role);
          if (setIsAuthenticated) setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
          if (setIsAuthenticated) setIsAuthenticated(false);
          if (setUser) setUser(null);
          if (setUserRole) setUserRole(null);
          navigate('/login', { replace: true });
        }
      }
    }
  }, [navigate, setIsAuthenticated, setUser, setUserRole]);

  /**
   * Handle message events from other tabs
   */
  const handleMessage = useCallback((e) => {
    if (!e.data || !e.origin) return;
    
    // Only process messages from same origin for security
    if (e.origin !== window.location.origin && window.location.origin) {
      return;
    }

    if (e.data.type === 'LOGOUT') {
      // Logout triggered from another tab
      if (setIsAuthenticated) setIsAuthenticated(false);
      if (setUser) setUser(null);
      if (setUserRole) setUserRole(null);
      navigate('/login', { replace: true });
    } else if (e.data.type === 'USER_UPDATE' && e.data.userData) {
      // User update from another tab
      const userData = e.data.userData;
      if (setUser) setUser(userData);
      if (setUserRole) setUserRole(userData.role);
      if (setIsAuthenticated) setIsAuthenticated(true);
    }
  }, [navigate, setIsAuthenticated, setUser, setUserRole]);

  /**
   * Broadcast logout message to other tabs
   */
  const broadcastLogout = useCallback(() => {
    try {
      window.postMessage({ type: 'LOGOUT' }, window.location.origin);
    } catch (error) {
      console.warn('Failed to broadcast logout:', error);
    }
  }, []);

  /**
   * Broadcast user update message to other tabs
   */
  const broadcastUserUpdate = useCallback((userData) => {
    try {
      window.postMessage({ 
        type: 'USER_UPDATE', 
        userData 
      }, window.location.origin);
    } catch (error) {
      console.warn('Failed to broadcast user update:', error);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, [handleStorageChange, handleMessage]);

  return {
    broadcastLogout,
    broadcastUserUpdate
  };
};

export default useCrossTabSync;
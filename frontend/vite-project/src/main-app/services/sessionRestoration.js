import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Session restoration utilities for preserving user journey
 */
export const preserveUserJourney = {
  /**
   * Save current user session for restoration after re-authentication
   * @param {string} path - Current path to preserve
   * @param {Object} state - Additional state to preserve
   */
  save: (path, state = {}) => {
    try {
      const sessionData = {
        path,
        state,
        timestamp: Date.now(),
        formData: state.formData || null,
        scrollPosition: state.scrollPosition || window.scrollY || 0
      };
      
      localStorage.setItem('preservedSession', JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to preserve session:', error);
    }
  },

  /**
   * Restore preserved session data
   * @returns {Object|null} Restored session data or null if expired/invalid
   */
  restore: () => {
    try {
      const saved = localStorage.getItem('preservedSession');
      if (!saved) return null;

      const sessionData = JSON.parse(saved);
      const age = Date.now() - sessionData.timestamp;

      // Session valid for 30 minutes
      if (age > 1800000) {
        localStorage.removeItem('preservedSession');
        return null;
      }

      return sessionData;
    } catch (error) {
      localStorage.removeItem('preservedSession');
      return null;
    }
  },

  /**
   * Clear preserved session data
   */
  clear: () => {
    try {
      localStorage.removeItem('preservedSession');
    } catch (error) {
      console.warn('Failed to clear preserved session:', error);
    }
  }
};

/**
 * Hook for session restoration functionality
 */
export const useSessionRestoration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Preserve current journey for restoration after logout/login
   * @param {Object} additionalState - Additional state to preserve
   */
  const preserveCurrentJourney = useCallback((additionalState = {}) => {
    const currentState = {
      ...additionalState,
      scrollPosition: window.scrollY
    };
    
    preserveUserJourney.save(location.pathname, currentState);
  }, [location.pathname]);

  /**
   * Handle post-login restoration
   */
  const handlePostLoginRestoration = useCallback(() => {
    const preserved = preserveUserJourney.restore();
    
    if (preserved) {
      navigate(preserved.path, {
        state: preserved.state,
        replace: true
      });
      
      // Restore scroll position after navigation
      setTimeout(() => {
        if (preserved.state.scrollPosition) {
          window.scrollTo(0, preserved.state.scrollPosition);
        }
      }, 100);
      
      preserveUserJourney.clear();
    }
  }, [navigate]);

  return {
    preserveCurrentJourney,
    handlePostLoginRestoration
  };
};

/**
 * Session Restoration Provider component
 */
export const SessionRestorationProvider = ({ children }) => {
  // This provider could be extended with context if needed
  return children;
};

/**
 * Extract form data from current page for preservation
 * @returns {Object} Form data object
 */
export const extractFormData = () => {
  try {
    const formData = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      if (input.name && input.value) {
        // Only preserve non-sensitive form data
        if (!input.type.includes('password') && !input.type.includes('hidden')) {
          formData[input.name] = input.value;
        }
      }
    });

    return formData;
  } catch (error) {
    console.warn('Failed to extract form data:', error);
    return {};
  }
};

export default {
  preserveUserJourney,
  useSessionRestoration,
  SessionRestorationProvider,
  extractFormData
};
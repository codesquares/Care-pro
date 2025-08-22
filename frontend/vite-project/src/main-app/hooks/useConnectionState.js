import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing connection state with optimized updates
 * Prevents unnecessary re-renders by only updating when state actually changes
 */
const useConnectionState = (initialState = 'Disconnected') => {
  const [connectionState, setConnectionState] = useState(initialState);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const previousStateRef = useRef(initialState);
  
  // Optimized connection state updater - only updates if state actually changed
  const updateConnectionState = useCallback((newState) => {
    if (previousStateRef.current !== newState) {
      console.log(`Connection state changing from ${previousStateRef.current} to ${newState}`);
      previousStateRef.current = newState;
      setConnectionState(newState);
    }
  }, []);
  
  // Optimized polling state updater
  const updatePollingState = useCallback((isActive) => {
    setIsPollingActive(prevState => {
      if (prevState !== isActive) {
        console.log(`Polling state changing to: ${isActive}`);
        return isActive;
      }
      return prevState;
    });
  }, []);
  
  // Reset function for cleanup
  const reset = useCallback(() => {
    setConnectionState(initialState);
    setIsPollingActive(false);
    previousStateRef.current = initialState;
  }, [initialState]);
  
  return {
    connectionState,
    isPollingActive,
    updateConnectionState,
    updatePollingState,
    reset
  };
};

export default useConnectionState;

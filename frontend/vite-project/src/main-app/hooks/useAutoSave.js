import { useEffect, useRef, useCallback } from 'react';

export const useAutoSave = (data, saveFunction, delay = 5000, options = {}) => {
  const {
    enabled = true,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    skipInitial = true
  } = options;

  const timeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const isInitialMountRef = useRef(true);

  const saveData = useCallback(async () => {
    if (!enabled) return;

    try {
      onSaveStart?.();
      const result = await saveFunction(data);
      lastSavedDataRef.current = JSON.stringify(data);
      onSaveSuccess?.(result);
    } catch (error) {
      console.error('Auto-save failed:', error);
      onSaveError?.(error);
    }
  }, [data, saveFunction, enabled, onSaveStart, onSaveSuccess, onSaveError]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (enabled) {
      timeoutRef.current = setTimeout(saveData, delay);
    }
  }, [saveData, delay, enabled]);

  const saveImmediately = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveData();
  }, [saveData]);

  useEffect(() => {
    if (isInitialMountRef.current && skipInitial) {
      isInitialMountRef.current = false;
      lastSavedDataRef.current = JSON.stringify(data);
      return;
    }

    // Check if data has actually changed
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, resetTimer, skipInitial]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveImmediately,
    resetTimer
  };
};
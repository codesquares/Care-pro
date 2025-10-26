import { useCallback, useRef } from 'react';

/**
 * Custom hook for creating debounced functions
 * Helps prevent rapid successive calls that can cause race conditions
 */
const useDebounce = () => {
  const timeoutRefs = useRef({});
  
  const debounce = useCallback((func, wait, key = 'default') => {
    return (...args) => {
      // Clear existing timeout for this key
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
      }
      
      // Set new timeout
      timeoutRefs.current[key] = setTimeout(() => {
        delete timeoutRefs.current[key];
        func.apply(null, args);
      }, wait);
    };
  }, []);
  
  const cancelDebounce = useCallback((key = 'default') => {
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
      delete timeoutRefs.current[key];
    }
  }, []);
  
  const cancelAllDebounces = useCallback(() => {
    Object.keys(timeoutRefs.current).forEach(key => {
      clearTimeout(timeoutRefs.current[key]);
    });
    timeoutRefs.current = {};
  }, []);
  
  return {
    debounce,
    cancelDebounce,
    cancelAllDebounces
  };
};

export default useDebounce;

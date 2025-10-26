import { useRef, useCallback } from 'react';

/**
 * Custom hook for API request deduplication
 * Prevents multiple identical API calls from executing simultaneously
 */
const useApiDeduplication = () => {
  const pendingRequests = useRef(new Map());
  
  const deduplicate = useCallback(async (key, apiCall, options = {}) => {
    const { timeout = 30000, forceRefresh = false } = options;
    
    // If forceRefresh is true, remove any existing request
    if (forceRefresh && pendingRequests.current.has(key)) {
      pendingRequests.current.delete(key);
    }
    
    // Return existing promise if request is already in progress
    if (pendingRequests.current.has(key)) {
      console.log(`Deduplicating API call for key: ${key}`);
      return pendingRequests.current.get(key);
    }
    
    // Create new request promise
    const requestPromise = Promise.race([
      apiCall(),
      // Add timeout to prevent hanging requests
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Request timeout for ${key}`)), timeout)
      )
    ]);
    
    // Store the promise
    pendingRequests.current.set(key, requestPromise);
    
    try {
      const result = await requestPromise;
      pendingRequests.current.delete(key);
      return result;
    } catch (error) {
      pendingRequests.current.delete(key);
      throw error;
    }
  }, []);
  
  const isPending = useCallback((key) => {
    return pendingRequests.current.has(key);
  }, []);
  
  const cancelRequest = useCallback((key) => {
    if (pendingRequests.current.has(key)) {
      pendingRequests.current.delete(key);
      console.log(`Cancelled API request for key: ${key}`);
    }
  }, []);
  
  const cancelAllRequests = useCallback(() => {
    const keys = Array.from(pendingRequests.current.keys());
    pendingRequests.current.clear();
    console.log(`Cancelled ${keys.length} pending API requests`);
  }, []);
  
  return {
    deduplicate,
    isPending,
    cancelRequest,
    cancelAllRequests
  };
};

export default useApiDeduplication;

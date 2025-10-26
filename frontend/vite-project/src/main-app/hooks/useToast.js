import { useState, useCallback, useEffect } from 'react';

// Global toast state (you could also use Context API for this)
let globalToastSetters = [];

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Register this component's setter
  useEffect(() => {
    globalToastSetters.push(setToasts);
    return () => {
      globalToastSetters = globalToastSetters.filter(setter => setter !== setToasts);
    };
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, show: true };
    
    // Update all registered components
    globalToastSetters.forEach(setter => {
      setter(prev => [...prev, newToast]);
    });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      globalToastSetters.forEach(setter => {
        setter(prev => prev.filter(toast => toast.id !== id));
      });
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    globalToastSetters.forEach(setter => {
      setter(prev => prev.filter(toast => toast.id !== id));
    });
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (message) => addToast(message, 'success'),
    showError: (message) => addToast(message, 'error'),
    showInfo: (message) => addToast(message, 'info'),
    showWarning: (message) => addToast(message, 'warning')
  };
};

export default useToast;

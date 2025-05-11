import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create context
const NotificationContext = createContext();

// Custom hook to use the Notification context
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Add a notification
  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Automatically remove notification after 5 seconds (unless user interacts)
    setTimeout(() => {
      setNotifications(current => current.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  }, []);
  
  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === id) {
        return { ...notification, read: true };
      }
      return notification;
    }));
  }, []);
  
  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Check if browser permissions are granted for notifications
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      }
    }
  }, []);
  
  // Request permission for browser notifications
  const requestPermission = useCallback(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setPermissionGranted(true);
        }
      });
    }
  }, []);
  
  // Listen for custom message events to create notifications
  useEffect(() => {
    const handleNewMessage = (event) => {
      const { title, message, senderId } = event.detail;
      
      addNotification({
        title,
        message,
        type: 'message',
        action: `/messages?user=${senderId}`,
      });
      
      // Also show browser notification if permission granted
      if (permissionGranted) {
        const notification = new Notification(title, { 
          body: message,
          icon: '/notification-icon.png'
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.href = `/messages?user=${senderId}`;
        };
      }
    };
    
    window.addEventListener('new-message', handleNewMessage);
    
    return () => {
      window.removeEventListener('new-message', handleNewMessage);
    };
  }, [addNotification, permissionGranted]);
  
  const value = {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    permissionGranted,
    requestPermission
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

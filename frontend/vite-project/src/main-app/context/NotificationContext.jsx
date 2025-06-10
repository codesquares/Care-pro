import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize SignalR connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${process.env.VITE_API_BASE_URL}/notificationHub`, {
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);
    }
    return () => {
      connection?.stop();
    };
  }, [isAuthenticated, user]);

  // Check if browser permissions are granted for notifications
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
          console.log("Notification permission granted");
        } else {
          console.log("Notification permission denied");
        }
      });
    }
  }, []);

  // Start connection and set up listeners
  useEffect(() => {
    if (connection && isAuthenticated) {
      connection.start()
        .then(() => {
          console.log('NotificationHub connected');
          
          connection.on('ReceiveNotification', notification => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission granted
            if (permissionGranted) {
              const notificationTitle = notification.type === 'Message' ? 'New message' : 
                                        notification.type === 'Payment' ? 'Payment update' : 
                                        'New notification';
              
              const browserNotification = new Notification(notificationTitle, { 
                body: notification.content,
                icon: '/notification-icon.png'
              });
              
              browserNotification.onclick = () => {
                window.focus();
                // Navigate to appropriate page based on notification type
                if (notification.type === 'Message') {
                  window.location.href = `/app/${user?.role?.toLowerCase()}/message`;
                }
              };
            }
          });
        })
        .catch(err => console.error('Error starting NotificationHub connection:', err));
    }
  }, [connection, isAuthenticated, permissionGranted, user]);

  // Load initial notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      setLoading(true);
      
      // Get notifications from API
      getNotifications()
        .then(data => {
          setNotifications(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching notifications:', err);
          setLoading(false);
        });
      
      // Get unread count
      getUnreadCount()
        .then(data => {
          setUnreadCount(data.count);
        })
        .catch(err => {
          console.error('Error fetching unread count:', err);
        });
    }
  }, [isAuthenticated, user]);

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add a notification (for UI display)
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    return id;
  }, []);
  
  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(notification => notification.id !== id);
    });
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        // Add these for compatibility with NotificationsContext
        permissionGranted,
        requestPermission,
        addNotification,
        removeNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for consuming NotificationContext
export const useNotifications = () => {
  return useContext(NotificationContext);
};

// This is needed for backward compatibility with components using useNotificationContext
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;

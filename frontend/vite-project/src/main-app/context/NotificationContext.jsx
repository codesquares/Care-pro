import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize SignalR connection
  useEffect(() => {
    if (isAuthenticated && user && token) {
      try {
        // In development mode, use relative URL to leverage Vite's proxy
        // In production, use the full URL from the environment variable
        const isDev = import.meta.env.DEV;
        const hubUrl = isDev 
          ? '/notificationHub' // This will be proxied by Vite
          : `${import.meta.env.VITE_API_BASE_URL || 'https://carepro-api20241118153443.azurewebsites.net'}/notificationHub`;
        
        console.log(`Connecting to SignalR hub at: ${hubUrl} (${isDev ? 'development proxy' : 'direct connection'})`);
        
        const newConnection = new HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: true,
            transport: HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry with backoff
          .configureLogging(LogLevel.Information)
          .build();

        setConnection(newConnection);
        setConnectionError(null);
      } catch (error) {
        console.error('Error creating SignalR connection:', error);
        setConnectionError('Failed to create notification connection');
      }
    }
    
    return () => {
      if (connection) {
        try {
          connection.stop();
        } catch (err) {
          console.error('Error stopping connection:', err);
        }
      }
    };
  }, [isAuthenticated, user, token]);

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
      // Detect if we're in development mode and provide debug info
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('Running in development mode with the following config:');
        console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
        console.log('Using authentication token:', token ? 'Yes (token exists)' : 'No (missing token)');
      }
      
      connection.start()
        .then(() => {
          console.log('NotificationHub connected successfully');
          setConnectionError(null);
          
          // Remove any existing handler to avoid duplicates
          connection.off('ReceiveNotification');
          
          // Add the notification handler
          connection.on('ReceiveNotification', notification => {
            console.log('Received notification:', notification);
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
          
          // Set up reconnection handler
          connection.onreconnecting(error => {
            console.log('SignalR reconnecting:', error);
            setConnectionError('Connection lost. Reconnecting...');
          });
          
          connection.onreconnected(connectionId => {
            console.log('SignalR reconnected:', connectionId);
            setConnectionError(null);
          });
          
          connection.onclose(error => {
            console.log('SignalR connection closed:', error);
            setConnectionError('Connection closed. Please refresh the page.');
          });
        })
        .catch(err => {
          console.error('Error starting NotificationHub connection:', err);
          
          // Handle CORS errors specifically
          if (err.toString().includes('Failed to fetch') || 
              err.toString().includes('CORS') ||
              err.toString().includes('NetworkError')) {
            setConnectionError('CORS or network error. The app may still work but notifications will be unavailable.');
            
            // If in development mode, show more helpful message
            if (isDev) {
              console.warn('CORS ERROR DETECTED: This is likely because the backend API is not configured to accept connections from your development server.');
              console.warn('Options to fix this:');
              console.warn('1. Ensure backend API CORS policy allows http://localhost:5173');
              console.warn('2. Use a local proxy in your development server');
              console.warn('3. Run frontend on an allowed origin like https://care-pro-frontend.onrender.com');
            }
          } else {
            setConnectionError(`Failed to connect to notifications: ${err.message}`);
          }
        });
    }
  }, [connection, isAuthenticated, permissionGranted, user, token]);

  // Load notifications from API
  const fetchNotifications = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoading(true);
      
      try {
        // Get notifications from API
        const data = await getNotifications();
        console.log('Notifications loaded:', data);
        
        // Ensure we always set an array, even if the API returns unexpected data
        if (data && data.items && Array.isArray(data.items)) {
          setNotifications(data.items);
        } else if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          console.warn('Unexpected notification data format, using empty array', data);
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        // In development mode, provide fallback data
        if (import.meta.env.DEV) {
          setNotifications([
            {
              id: 'dev-1',
              type: 'System',
              content: 'Welcome to CarePro! This is a development mode notification.',
              isRead: false,
              createdAt: new Date().toISOString()
            }
          ]);
        } else {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
      
      // Get unread count
      try {
        const countData = await getUnreadCount();
        console.log('Unread count:', countData);
        
        if (countData && typeof countData.count === 'number') {
          setUnreadCount(countData.count);
        } else if (typeof countData === 'number') {
          setUnreadCount(countData);
        } else {
          console.warn('Unexpected unread count format, using 0', countData);
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, user]);

  // Fetch notifications when auth state changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
        removeNotification,
        // Add error state
        connectionError
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

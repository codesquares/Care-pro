// This file demonstrates how to use our messaging features in other parts of the application

import { useEffect, useCallback } from 'react';
import { useMessageContext } from '../context/MessageContext.jsx';
import { useNotificationContext } from '../context/NotificationsContext.jsx';

// A custom hook that provides messaging features to any component
export const useMessaging = (userId) => {
  const { 
    conversations,
    initializeChat, 
    handleSendMessage,
    selectChat,
    unreadMessages,
    onlineUsers,
    recipient,
    messages,
    isLoading,
    error
  } = useMessageContext();

  const { 
    addNotification,
    requestPermission,
    permissionGranted 
  } = useNotificationContext();

  // Get the total count of unread messages across all conversations
  const totalUnreadMessages = Object.values(unreadMessages || {}).reduce((sum, count) => sum + count, 0);

  // Initialize chat connection when the component mounts
  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('token');
      
      // Request notification permissions on init if not already granted
      if (!permissionGranted) {
        requestPermission();
      }
      
      initializeChat(userId, token);
    }
    
    // Cleanup on unmount
    return () => {
      // Cleanup happens automatically in MessageContext
    };
  }, [userId, initializeChat, permissionGranted, requestPermission]);

  // Send a message to a user
  const sendMessage = useCallback((recipientId, messageText) => {
    if (userId && recipientId && messageText) {
      handleSendMessage(userId, recipientId, messageText);
      return true;
    }
    return false;
  }, [userId, handleSendMessage]);

  // Show a notification - can be used anywhere in the app
  const showNotification = useCallback((title, message, type = 'info') => {
    addNotification({
      title,
      message,
      type
    });
  }, [addNotification]);
  
  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers[userId] === true;
  }, [onlineUsers]);

  return {
    // Data
    conversations,
    recipient,
    messages,
    totalUnreadMessages,
    unreadMessages,
    isLoading,
    error,
    
    // Methods
    sendMessage,
    showNotification,
    selectChat,
    isUserOnline
  };
};

export default useMessaging;
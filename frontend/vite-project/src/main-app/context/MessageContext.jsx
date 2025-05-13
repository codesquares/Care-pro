import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectToChat, sendMessage, disconnectFromChat } from '../utilities/ChatServiceUtils';
import axios from 'axios';
import config from '../config';

// Create context
const MessageContext = createContext();

// Custom hook to use the Message context
export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [recipient, setRecipient] = useState({});
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch conversations (users you have chatted with)
  const fetchConversations = useCallback(async (userId) => {
    // If no userId provided, use a default "currentUser" to ensure we can load mock data
    if (!userId) {
      console.log('No userId provided, using default "currentUser"');
      userId = "currentUser";
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.BASE_URL}/chat/history`);
      
      // Process the conversations to include unread message counts
      const processedConversations = response.data.map(convo => ({
        ...convo,
        unreadCount: unreadMessages[convo.id] || 0,
        isOnline: onlineUsers[convo.id] || false
      }));
      
      // If we have conversations from API, use them; otherwise load mock data
      if (processedConversations.length) {
        console.log('Using API conversations:', processedConversations);
        setConversations(processedConversations);
      } else {
        console.log('No conversations found, loading mock data. userId:', userId);
        // Force load mock data regardless of environment
        try {
          import('../utilities/mockData').then(module => {
            console.log('Mock data loaded:', module.conversations);
            setConversations(module.conversations);
          });
        } catch (mockError) {
          console.error('Error loading mock data:', mockError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load your conversations. Please try again.');
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        import('../utilities/mockData').then(module => {
          setConversations(module.conversations);
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [unreadMessages, onlineUsers]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (user1Id, user2Id) => {
    if (!user1Id || !user2Id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${config.BASE_URL}/chat/chatPreview`);
      setMessages(response.data);
      
      // Clear unread messages for this conversation
      if (unreadMessages[user2Id]) {
        setUnreadMessages(prev => ({
          ...prev,
          [user2Id]: 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load your messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [unreadMessages]);

  // Handle selecting a chat
  const selectChat = useCallback((chatId) => {
    const chat = conversations.find((c) => c.id === chatId);
    
    if (chat) {
      setSelectedChatId(chatId);
      setRecipient(chat);
      fetchMessages(localStorage.getItem('userId'), chatId);
      
      // Clear unread count for this chat
      setUnreadMessages(prev => ({
        ...prev,
        [chatId]: 0
      }));
    }
  }, [conversations, fetchMessages]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (senderId, receiverId, messageText) => {
    if (!messageText.trim() || !senderId || !receiverId) return;
    
    try {
      // Add message to local state first with temporary ID and 'sending' status
      const tempMessageId = `temp-${Date.now()}`;
      const newMessage = { 
        id: tempMessageId,
        senderId, 
        text: messageText, 
        status: 'sending',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Send via SignalR
      const messageId = await sendMessage(senderId, receiverId, messageText);
      
      // Update message with real ID and 'sent' status
      setMessages(prev => prev.map(msg => {
        if (msg.id === tempMessageId) {
          return { ...msg, id: messageId, status: 'sent' };
        }
        return msg;
      }));
      
      setMessage('');
      
      // Update conversations list if needed
      if (!conversations.some(c => c.id === receiverId)) {
        fetchConversations(senderId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send your message. Please try again.');
      
      // Mark the message as failed
      setMessages(prev => prev.map(msg => {
        if (msg.status === 'sending') {
          return { ...msg, status: 'failed' };
        }
        return msg;
      }));
    }
  }, []);

  // Handle incoming message
  const handleIncomingMessage = useCallback((senderId, messageText, messageId, status = 'delivered') => {
    // Add message to conversation if it's the active one
    if (selectedChatId === senderId) {
      setMessages(prev => [
        ...prev, 
        { 
          id: messageId,
          senderId, 
          text: messageText, 
          status, // Use the status from server
          timestamp: new Date().toISOString()
        }
      ]);
    } else {
      // Increment unread count for this sender
      setUnreadMessages(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));
    }
    
    // Show notification if the chat is not currently selected
    if (selectedChatId !== senderId) {
      const sender = conversations.find(c => c.id === senderId);
      const senderName = sender ? sender.name : senderId;
      
      // This will trigger a notification via the NotificationContext
      const notificationEvent = new CustomEvent('new-message', {
        detail: {
          title: `New message from ${senderName}`,
          message: messageText,
          senderId
        }
      });
      window.dispatchEvent(notificationEvent);
    }
  }, [selectedChatId, conversations]);

  // Initialize chat connection
  const initializeChat = useCallback((userId, token) => {
    // Handle user status changes
    const handleUserStatusChange = (userId, status) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: status === 'Online'
      }));
    };
    
    // Connect to SignalR hub with both message and status handlers
    connectToChat(token, handleIncomingMessage, handleUserStatusChange);
    
    // Fetch conversations on init
    fetchConversations(userId);
    
    return () => {
      disconnectFromChat();
    };
  }, [fetchConversations, handleIncomingMessage]);

  // Track online status of users (simplified mock implementation)
  useEffect(() => {
    // In a real app, you would get this from SignalR
    const mockOnlineStatusCheck = setInterval(() => {
      if (conversations.length) {
        const randomOnline = conversations.reduce((acc, convo) => {
          acc[convo.id] = Math.random() > 0.5;
          return acc;
        }, {});
        setOnlineUsers(randomOnline);
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(mockOnlineStatusCheck);
  }, [conversations]);

  const value = {
    conversations,
    selectedChatId,
    recipient,
    messages,
    message,
    unreadMessages,
    onlineUsers,
    isLoading,
    error,
    setMessage,
    fetchConversations,
    selectChat,
    handleSendMessage,
    initializeChat,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
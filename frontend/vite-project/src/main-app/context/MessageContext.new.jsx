import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import config from "../config"; // Import centralized config for API URLs

// FIXED: Use centralized config instead of hardcoded Azure staging API URL
const API_BASE_URL = config.BASE_URL.replace('/api', ''); // Remove /api suffix for SignalR hub

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
  const [unreadMessages, setUnreadMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Effect to update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionState(chatService.getConnectionState());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Function to update conversations list with a new message
  const updateConversationsList = useCallback(async (senderId) => {
    // Check if we already have this conversation
    const existingConversation = conversations.find(c => c.id === senderId);
    
    if (!existingConversation && currentUserId) {
      try {
        // Fetch user info
        const response = await axios.get(`${API_BASE_URL}/api/users/${senderId}`);
        const userData = response.data;
        
        // Add to conversations
        setConversations(prev => [
          {
            id: senderId,
            name: userData.fullName || userData.username,
            avatar: userData.profileImage || '/default-avatar.png',
            lastMessage: 'New message',
            unreadCount: unreadMessages[senderId] || 0,
            isOnline: onlineUsers[senderId] || false
          },
          ...prev
        ]);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    } else if (existingConversation) {
      // Update existing conversation
      setConversations(prev => prev.map(c => {
        if (c.id === senderId) {
          return {
            ...c,
            lastMessage: 'New message',
            unreadCount: unreadMessages[senderId] || 0
          };
        }
        return c;
      }));
    }
  }, [conversations, currentUserId, onlineUsers, unreadMessages]);
  
  // Fetch conversations
  const fetchConversations = useCallback(async (userId) => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations/${userId}`);
      
      // Process conversations and add online status
      const conversationsWithStatus = await Promise.all(
        response.data.map(async (conversation) => {
          // Try to get online status for each user
          let isOnline = false;
          try {
            isOnline = await chatService.isUserOnline(conversation.id);
          } catch (e) {
            console.warn('Error getting online status:', e);
          }
          
          return {
            ...conversation,
            isOnline,
            unreadCount: unreadMessages[conversation.id] || 0
          };
        })
      );
      
      setConversations(conversationsWithStatus);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError('Failed to load conversations: ' + (error.message || 'Unknown error'));
      
      // Use empty array in case of error
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [unreadMessages]);

  // Initialize chat connection
  const initializeChat = useCallback(async (userId, token) => {
    if (!userId || !token) {
      console.error('User ID and token are required');
      return () => {};
    }
    
    setIsLoading(true);
    setError(null);
    setCurrentUserId(userId);
    
    try {
      // Set up SignalR event handlers
      const handlersToRemove = [
        // Connection established handler
        chatService.on('onConnected', async () => {
          console.log('Connected to chat');
          try {
            // When connected, fetch online users
            const users = await chatService.getOnlineUsers();
            const onlineUsersMap = {};
            users.forEach(user => {
              onlineUsersMap[user] = true;
            });
            setOnlineUsers(onlineUsersMap);
          } catch (err) {
            console.error('Error fetching online users:', err);
          }
        }),
        
        // New message handler
        chatService.on('onMessage', (messageData) => {
          const { senderId, message, messageId, status } = messageData;
          
          // Add to messages if this is the active chat
          if (senderId === selectedChatId || senderId === recipient.id) {
            setMessages(prevMessages => [...prevMessages, {
              id: messageId,
              senderId,
              receiverId: userId,
              content: message,
              timestamp: new Date().toISOString(),
              status: status || 'delivered'
            }]);
            
            // Mark as read if this is the active chat
            chatService.markMessageRead(messageId)
              .catch(err => console.error('Error marking message as read:', err));
          } else {
            // Update unread count
            setUnreadMessages(prevCounts => ({
              ...prevCounts,
              [senderId]: (prevCounts[senderId] || 0) + 1
            }));
            
            // Trigger browser notification
            const event = new CustomEvent('new-message', {
              detail: {
                title: 'New Message',
                message: message,
                senderId: senderId
              }
            });
            window.dispatchEvent(event);
          }
          
          // Update conversations list if needed
          updateConversationsList(senderId);
        }),
        
        // User status change handler
        chatService.on('onUserStatusChanged', ({ userId, status }) => {
          setOnlineUsers(prev => ({
            ...prev,
            [userId]: status === 'Online'
          }));
        }),
        
        // Error handler
        chatService.on('onError', (error) => {
          console.error('SignalR error:', error);
          setError('Connection error: ' + (error.message || 'Unknown error'));
        }),
        
        // Disconnection handler
        chatService.on('onDisconnected', () => {
          console.log('Disconnected from chat');
          setConnectionState('Disconnected');
        }),
        
        // Reconnecting handler
        chatService.on('onReconnecting', () => {
          console.log('Reconnecting to chat...');
          setConnectionState('Reconnecting');
        }),
        
        // Reconnected handler
        chatService.on('onReconnected', () => {
          console.log('Reconnected to chat');
          setConnectionState('Connected');
          
          // Reload conversations when reconnected
          fetchConversations(userId);
        })
      ];
      
      // Connect to hub
      await chatService.connect(userId, token);
      
      // Fetch conversations after successful connection
      fetchConversations(userId);
      
      setIsLoading(false);
      
      // Return cleanup function
      return () => {
        // Remove all event handlers
        handlersToRemove.forEach(remove => remove());
        
        // Disconnect from hub
        chatService.disconnect()
          .catch(err => console.error('Error disconnecting:', err));
      };
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to connect: ' + (error.message || 'Unknown error'));
      setIsLoading(false);
      return () => {}; // Return empty cleanup if initialization fails
    }
  }, [fetchConversations, recipient, selectedChatId, updateConversationsList]);

  // Send message
  const handleSendMessage = useCallback(async (senderId, receiverId, messageText) => {
    if (!messageText.trim()) return;
    
    // Add message to UI immediately for better UX
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      senderId,
      receiverId,
      content: messageText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    try {
      // Send message through SignalR
      const messageId = await chatService.sendMessage(senderId, receiverId, messageText);
      
      // Update message with real ID and status
      setMessages(prev => prev.map(message => 
        message.id === tempId ? { 
          ...message, 
          id: messageId,
          status: 'sent' 
        } : message
      ));
      
      // Update conversations list
      setConversations(prev => prev.map(conversation => {
        if (conversation.id === receiverId) {
          return {
            ...conversation,
            lastMessage: messageText,
            timestamp: new Date().toISOString()
          };
        }
        return conversation;
      }));
      
      return messageId;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update message status to failed
      setMessages(prev => prev.map(message => 
        message.id === tempId ? { 
          ...message, 
          status: 'failed' 
        } : message
      ));
      
      throw error;
    }
  }, []);

  // Select chat
  const selectChat = useCallback(async (chatId) => {
    setSelectedChatId(chatId);
    setIsLoading(true);
    
    try {
      // Find recipient in conversations
      const selectedRecipient = conversations.find(c => c.id === chatId);
      if (selectedRecipient) {
        setRecipient(selectedRecipient);
      }
      
      // Reset unread count for this chat
      setUnreadMessages(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      // Fetch message history if we have both users
      if (chatId && currentUserId) {
        const messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
        
        // Process and sort messages
        const processedMessages = messageHistory
          .map(message => ({
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
            timestamp: message.timestamp,
            status: message.status || 'delivered'
          }))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        setMessages(processedMessages);
        
        // Mark unread messages as read
        processedMessages.forEach(message => {
          if (message.senderId === chatId && message.status !== 'read') {
            chatService.markMessageRead(message.id)
              .catch(err => console.error('Error marking message as read:', err));
          }
        });
      }
    } catch (error) {
      console.error('Failed to select chat:', error);
      setError('Failed to load messages: ' + (error.message || 'Unknown error'));
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversations, currentUserId]);

  // Context value
  const value = {
    conversations,
    selectedChatId,
    recipient,
    messages,
    unreadMessages,
    onlineUsers,
    isLoading,
    error,
    connectionState,
    
    // Methods
    initializeChat,
    handleSendMessage,
    selectChat,
    fetchConversations
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;

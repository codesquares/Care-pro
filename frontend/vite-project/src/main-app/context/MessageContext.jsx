import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import chatService from '../services/signalRChatService';
import axios from 'axios';
import config from '../config';

// Constants
const API_BASE_URL = "https://carepro-api20241118153443.azurewebsites.net";

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
  
  // Effect to update connection state periodically (now with much longer interval)
  useEffect(() => {
    // Only poll if we have an active connection
    if (!chatService || !chatService.connection) {
      return () => {};
    }
    
    // Reduce polling frequency to once every 30 seconds to reduce network traffic
    const interval = setInterval(() => {
      setConnectionState(chatService.getConnectionState());
    }, 30000); // 30 seconds instead of 5 seconds
    
    // Clean up interval on unmount
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
  
  // Fetch conversations with caching, timeout and rate limiting
  const fetchConversations = useCallback(async (userId) => {
    if (!userId) return;
    
    // Prevent excessive requests by using a debounce mechanism
    const now = Date.now();
    const lastFetch = fetchConversations.lastFetchTime || 0;
    const minInterval = 5000; // Minimum 5 seconds between fetches
    
    // Skip if we've recently fetched and already have data
    if (now - lastFetch < minInterval && conversations.length > 0) {
      console.log('Skipping conversation fetch - too soon since last fetch');
      return;
    }
    
    // Mark the last fetch time
    fetchConversations.lastFetchTime = now;
    
    setIsLoading(true);
    
    // Create an abort controller for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/ChatPreview?userId=${userId}`, {
        signal: controller.signal
      });
      
      // Successfully got data, clear the timeout
      clearTimeout(timeoutId);
      
      // Limit processing conversations to avoid excessive API calls
      const maxConversationsToProcess = 10;
      const limitedConversations = response.data.slice(0, maxConversationsToProcess);
      
      // Process conversations and add online status - avoid parallel API calls
      const conversationsWithStatus = [];
      for (const conversation of limitedConversations) {
        // Default to false for online status rather than making API calls
        let isOnline = false;
        
        // Only check online status for selected conversation to reduce API calls
        if (conversation.id === selectedChatId) {
          try {
            isOnline = await chatService.isUserOnline(conversation.id);
          } catch (e) {
            console.warn('Error getting online status, assuming offline:', e);
          }
        }
        
        conversationsWithStatus.push({
          ...conversation,
          isOnline,
          unreadCount: unreadMessages[conversation.id] || 0
        });
      }
      
      setConversations(conversationsWithStatus);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Conversation fetch timed out, using cached data');
        // Don't update state on timeout, keep existing conversations
      } else {
        console.error('Failed to fetch conversations:', error);
        setError('Failed to load conversations: ' + (error.message || 'Unknown error'));
        
        // Use empty array in case of error
        setConversations([]);
      }
    } finally {
      // Clear timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [selectedChatId, unreadMessages]);

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
            try {
              const users = await chatService.getOnlineUsers();
              const onlineUsersMap = {};
              // Check if users is an array before proceeding
              if (Array.isArray(users)) {
                users.forEach(user => {
                  onlineUsersMap[user] = true;
                });
                setOnlineUsers(onlineUsersMap);
              } else {
                // If no users are online or there's no chat history, that's okay
                console.log('No online users found or empty chat history');
                setOnlineUsers({});
              }
              
              // Clear any error message related to online users
              if (error && error.includes('failed to get online users')) {
                setError(null);
              }
            } catch (e) {
              // This is expected when there's no chat history, so don't treat as an error
              console.log('No chat history available yet, continuing without online status');
              setOnlineUsers({});
            }
          } catch (err) {
            console.error('Error fetching online users:', err);
          }
        }),
        
        // New message handler
        chatService.on('onMessage', async (messageData) => {
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
            
            // First mark as delivered
            try {
              await chatService.markMessageAsDelivered(messageId, userId);
            } catch (err) {
              console.error('Error marking message as delivered:', err);
            }
            
            // Then mark as read if this is the active chat
            try {
              await chatService.markMessageRead(messageId);
            } catch (err) {
              console.error('Error marking message as read:', err);
            }
          } else {
            // Update unread count
            setUnreadMessages(prevCounts => ({
              ...prevCounts,
              [senderId]: (prevCounts[senderId] || 0) + 1
            }));
            
            // For messages not in active chat, just mark as delivered but not read
            try {
              await chatService.markMessageAsDelivered(messageId, userId);
            } catch (err) {
              console.error('Error marking message as delivered:', err);
            }
            
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

        // Message read receipt handler
        chatService.on('onMessageRead', (data) => {
          const { messageId, timestamp, status } = data;
          
          // Update message status in state
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: 'read', readAt: timestamp } 
                : msg
            )
          );
          
          console.log(`Message ${messageId} marked as read at ${timestamp}`);
        }),
        
        // Message delivered receipt handler
        chatService.on('onMessageDelivered', (data) => {
          const { messageId, timestamp, status } = data;
          
          // Update message status in state
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId && msg.status !== 'read'
                ? { ...msg, status: 'delivered', deliveredAt: timestamp } 
                : msg
            )
          );
          
          console.log(`Message ${messageId} marked as delivered at ${timestamp}`);
        }),

        // Message deleted handler
        chatService.on('onMessageDeleted', (data) => {
          const { messageId } = data;
          
          // Update message in state
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, isDeleted: true, content: "This message was deleted" } 
                : msg
            )
          );
          
          console.log(`Message ${messageId} was deleted`);
        }),
        
        // All messages read handler
        chatService.on('onAllMessagesRead', (data) => {
          const { userId, timestamp } = data;
          
          // Update all messages from this user to read
          if (userId === selectedChatId) {
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.senderId === userId && !msg.isDeleted
                  ? { ...msg, status: 'read', readAt: timestamp } 
                  : msg
              )
            );
            
            console.log(`All messages from ${userId} marked as read at ${timestamp}`);
          }
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
        // Remove all event handlers by using chatService.off
        // Instead of trying to call the returned values which might not be functions
        if (chatService) {
          // List of events we need to unregister
          const events = [
            'onConnected', 'onMessage', 'onMessageRead', 'onMessageDelivered', 
            'onMessageDeleted', 'onAllMessagesRead', 'onUserStatusChanged', 
            'onError', 'onDisconnected', 'onReconnecting', 'onReconnected'
          ];
          
          // Unregister all events (we can't access the specific handlers,
          // but this will remove all handlers for these events)
          events.forEach(eventName => {
            try {
              chatService.off(eventName);
            } catch (e) {
              console.warn(`Error removing handler for ${eventName}:`, e);
            }
          });
        }
        
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

  // Delete message
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!currentUserId || !messageId) return false;
    
    try {
      // Find the message to verify ownership
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        console.error('Message not found:', messageId);
        return false;
      }
      
      // Verify user is the sender
      if (message.senderId !== currentUserId) {
        console.error('Cannot delete messages sent by others');
        return false;
      }
      
      // Optimistically update UI
      setMessages(prev => prev.map(message => 
        message.id === messageId 
          ? { ...message, isDeleted: true, content: "This message was deleted" } 
          : message
      ));
      
      // Send delete request to server
      const success = await chatService.deleteMessage(messageId, currentUserId);
      
      if (!success) {
        // Revert optimistic update if delete failed
        setMessages(prev => prev.map(message => 
          message.id === messageId && message.isDeleted
            ? { ...message, isDeleted: false, content: message.originalContent } 
            : message
        ));
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, [currentUserId, messages]);
  
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
        try {
          const messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
          
          // Process and sort messages - ensure messageHistory is an array
          const processedMessages = Array.isArray(messageHistory) ? messageHistory
            .map(message => ({
              id: message.id || message.messageId,
              senderId: message.senderId,
              receiverId: message.receiverId,
              content: message.content || message.message, // Handle different property names
              timestamp: message.timestamp,
              status: message.status || 'delivered'
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          : [];
          
          setMessages(processedMessages);
          
          // Mark all messages from this sender as read in one batch operation
          if (processedMessages.some(message => message.senderId === chatId && message.status !== 'read')) {
            chatService.markAllMessagesAsRead(chatId, currentUserId)
              .then(() => {
                // Update local message statuses
                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    msg.senderId === chatId && !msg.isDeleted && msg.status !== 'read'
                      ? { ...msg, status: 'read', readAt: new Date().toISOString() } 
                      : msg
                  )
                );
              })
              .catch(err => console.error('Error marking all messages as read:', err));
          }
        } catch (historyError) {
          console.error('Failed to load message history:', historyError);
          setMessages([]);
          // Don't fail the entire chat selection just because history failed
        }
      }
    } catch (error) {
      console.error('Failed to select chat:', error);
      setError('Failed to load messages: ' + (error.message || 'Unknown error'));
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
    fetchConversations,
    handleDeleteMessage
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;

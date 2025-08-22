import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import chatService from '../services/signalRChatService';
import axios from 'axios';
import config from '../config';
import useDebounce from '../hooks/useDebounce';
import useApiDeduplication from '../hooks/useApiDeduplication';

// Constants
const API_BASE_URL = "https://carepro-api20241118153443.azurewebsites.net";

// Reducer for batched message state updates
const messageStateReducer = (state, action) => {
  switch (action.type) {
    case 'NEW_MESSAGE_RECEIVED':
      const { message, senderId, isActiveChat } = action.payload;
      const messageId = message.id || message.messageId;
      
      // Check for duplicates
      if (state.messageIds.has(messageId)) {
        return state;
      }
      
      const newMessageIds = new Set(state.messageIds);
      newMessageIds.add(messageId);
      
      return {
        ...state,
        messages: [...state.messages, message],
        messageIds: newMessageIds,
        unreadMessages: isActiveChat 
          ? state.unreadMessages 
          : { ...state.unreadMessages, [senderId]: (state.unreadMessages[senderId] || 0) + 1 },
        lastMessageTimestamp: message.timestamp
      };
      
    case 'MESSAGE_STATUS_UPDATE':
      const { messageId: updateId, status, timestamp, field } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === updateId 
            ? { ...msg, status, [field]: timestamp } 
            : msg
        )
      };
      
    case 'MESSAGE_DELETED':
      const { messageId: deletedId } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === deletedId 
            ? { ...msg, isDeleted: true, content: "This message was deleted" } 
            : msg
        )
      };
      
    case 'CLEAR_CHAT_MESSAGES':
      return {
        ...state,
        messages: [],
        messageIds: new Set(),
        lastMessageTimestamp: null
      };
      
    case 'SET_MESSAGES':
      const { messages: newMessages } = action.payload;
      const messageIdsSet = new Set();
      const validMessages = newMessages.filter(msg => {
        const id = msg.id || msg.messageId;
        if (id && !messageIdsSet.has(id)) {
          messageIdsSet.add(id);
          return true;
        }
        return false;
      });
      
      return {
        ...state,
        messages: validMessages,
        messageIds: messageIdsSet
      };
      
    case 'RESET_UNREAD_COUNT':
      const { chatId } = action.payload;
      return {
        ...state,
        unreadMessages: {
          ...state.unreadMessages,
          [chatId]: 0
        }
      };
      
    case 'ADD_MESSAGE':
      const { message: newMsg } = action.payload;
      return {
        ...state,
        messages: [...state.messages, newMsg]
      };
      
    case 'UPDATE_MESSAGE_STATUS':
      const { messageId: msgId, status: newStatus, timestamp: statusTimestamp, newId, ...otherFields } = action.payload;
      return {
        ...state,
        messages: state.messages.map(message => 
          message.id === msgId 
            ? { 
                ...message, 
                id: newId || message.id,
                status: newStatus, 
                timestamp: statusTimestamp || message.timestamp,
                ...otherFields
              }
            : message
        )
      };
      
    case 'SET_MESSAGES': {
      const { messages: messagesToSet } = action.payload;
      const messageIdSet = new Set();
      const processedMessages = messagesToSet.filter(msg => {
        const id = msg.id || msg.messageId;
        if (id && !messageIdSet.has(id)) {
          messageIdSet.add(id);
          return true;
        }
        return false;
      });
      
      // Get last message timestamp
      let lastTimestamp = null;
      if (processedMessages.length > 0) {
        const lastMsg = processedMessages[processedMessages.length - 1];
        lastTimestamp = lastMsg.timestamp;
      }
      
      return {
        ...state,
        messages: processedMessages,
        messageIds: messageIdSet,
        lastMessageTimestamp: lastTimestamp
      };
    }
      
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        messageIds: new Set(),
        lastMessageTimestamp: null
      };
      
    default:
      return state;
  }
};

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
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Start with loading to prevent flash
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('Connecting'); // Start with Connecting instead of Disconnected
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isPollingActive, setIsPollingActive] = useState(false);
  
  // Use reducer for message-related state to enable batching
  const [messageState, dispatchMessageState] = useReducer(messageStateReducer, {
    messages: [],
    unreadMessages: {},
    lastMessageTimestamp: null,
    messageIds: new Set()
  });
  
  // Destructure for backward compatibility
  const { messages, unreadMessages, lastMessageTimestamp, messageIds } = messageState;
  
  // Use custom hooks for performance optimization - TEMPORARILY SIMPLIFIED
  // const debounceHook = useDebounce();
  // const deduplicationHook = useApiDeduplication();
  
  // Simple inline implementations to avoid hook issues
  const safeDebounce = useCallback((func, wait) => {
    return (...args) => {
      setTimeout(() => func.apply(null, args), wait);
    };
  }, []);
  
  const safeDeduplicate = useCallback((key, apiCall) => {
    return apiCall();
  }, []);
  
  // Log hook initialization status (moved to useEffect to avoid conditional logic in render)
  useEffect(() => {
    console.log('MessageProvider hooks initialized successfully');
    // Set loading to false after a brief delay to allow initial state setup
    const initTimer = setTimeout(() => {
      if (!currentUserId) {
        setIsLoading(false);
      }
    }, 50);
    
    return () => clearTimeout(initTimer);
  }, [currentUserId]);
  
  // Add a function to refresh the current user ID from localStorage if needed
  const refreshCurrentUserId = useCallback(() => {
    if (!currentUserId) {
      try {
        const userDetails = localStorage.getItem("userDetails");
        if (userDetails) {
          const user = JSON.parse(userDetails);
          if (user?.id) {
            setCurrentUserId(user.id);
            return user.id;
          }
        }
      } catch (e) {
        console.error("Error refreshing user ID from localStorage:", e);
      }
    }
    return currentUserId;
  }, [currentUserId]);

  // Optimized message deduplication using reducer
  const addMessageWithDeduplication = useCallback((newMessage, isActiveChat = false) => {
    const messageId = newMessage.id || newMessage.messageId;
    if (!messageId) {
      console.warn('Message without ID received, skipping:', newMessage);
      return false;
    }

    const messageToAdd = {
      id: messageId,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId || currentUserId,
      content: newMessage.content || newMessage.message,
      timestamp: newMessage.timestamp || new Date().toISOString(),
      status: newMessage.status || 'delivered'
    };

    dispatchMessageState({
      type: 'NEW_MESSAGE_RECEIVED',
      payload: {
        message: messageToAdd,
        senderId: newMessage.senderId,
        isActiveChat
      }
    });

    return true;
  }, [currentUserId]);

  // Polling function to fetch messages as fallback
  const pollForMessages = useCallback(async () => {
    if (!selectedChatId || !currentUserId || !isPollingActive) {
      return;
    }

    try {
      console.log('Polling for messages in chat:', selectedChatId);
      // Use the correct API endpoint format that matches the existing working endpoints
      const response = await axios.get(
        `${API_BASE_URL}/api/Chat/conversations/${currentUserId}`,
        { timeout: 5000 }
      );

      // The response should be conversations list, find our selected conversation
      if (response.data && Array.isArray(response.data)) {
        const selectedConversation = response.data.find(conv => 
          conv.id === selectedChatId || conv.userId === selectedChatId
        );
        
        if (selectedConversation && selectedConversation.messages) {
          const polledMessages = selectedConversation.messages;
          
          // Filter out messages we already have
          const newMessages = polledMessages.filter(msg => {
            const msgId = msg.id || msg.messageId;
            return msgId && !messageIds.has(msgId);
          });

          if (newMessages.length > 0) {
            console.log(`Found ${newMessages.length} new messages via polling`);
            newMessages.forEach(msg => addMessageWithDeduplication(msg));
          }
        }
      }
    } catch (error) {
      console.warn('Error polling for messages (this is expected if endpoint doesn\'t exist):', error.message);
      // Don't set error state for polling failures to avoid disrupting UI
      // Disable polling if we get 404s consistently
      if (error.response?.status === 404) {
        console.log('Disabling polling due to 404 errors');
        setIsPollingActive(false);
      }
    }
  }, [selectedChatId, currentUserId, isPollingActive, messageIds, addMessageWithDeduplication]);

  // Start/stop polling based on chat selection and connection state
  useEffect(() => {
    // TEMPORARY: Disable all polling to fix 404 errors
    // Polling will only activate if manually enabled during debugging
    console.log('Polling effect triggered but currently disabled to prevent 404 errors');
    setIsPollingActive(false);
    return () => {}; // No polling for now
    
    /* Original polling logic - disabled
    let pollInterval;
    
    // Only start polling if SignalR is actually disconnected or having issues
    // Don't poll if we have a good SignalR connection
    const shouldPoll = selectedChatId && currentUserId && 
      (connectionState === 'Disconnected' || connectionState === 'Reconnecting') &&
      isPollingActive;
    
    if (shouldPoll) {
      console.log('Starting message polling for chat due to poor connection:', selectedChatId);
      
      // Poll immediately, then every 10 seconds (increased from 8 to reduce load)
      pollForMessages();
      pollInterval = setInterval(pollForMessages, 10000);
    } else {
      if (selectedChatId && connectionState === 'Connected') {
        console.log('SignalR connected, disabling polling for chat:', selectedChatId);
        setIsPollingActive(false);
      }
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
    */
  }, [selectedChatId, currentUserId, connectionState, isPollingActive, pollForMessages]);
  
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
  
  // Function to update conversations list with a new message - now debounced
  const updateConversationsListImmediate = useCallback(async (senderId, messagePreview = 'New message') => {
    console.log('Updating conversations list with senderId:', senderId);
    
    // Store the last updated senderId for use in the refresh effect
    updateConversationsListImmediate.lastUpdatedSenderId = senderId;
    
    // Check if we already have this conversation
    const existingConversation = conversations.find(c => c.id === senderId);
    
    if (!existingConversation && currentUserId) {
      try {
        console.log('Fetching user info for new conversation partner:', senderId);
        // Fetch user info
        const response = await axios.get(`${API_BASE_URL}/api/users/${senderId}`);
        const userData = response.data;
        console.log('User data received for new conversation:', userData);
        
        // Add to conversations
        setConversations(prev => {
          const newConversation = {
            id: senderId,
            name: userData.fullName || userData.username || userData.firstName + ' ' + userData.lastName,
            avatar: userData.profileImage || '/default-avatar.png',
            lastMessage: messagePreview,
            timestamp: new Date().toISOString(),
            unreadCount: unreadMessages[senderId] || 0,
            isOnline: onlineUsers[senderId] || false,
            previewMessage: messagePreview
          };
          console.log('Adding new conversation to list:', newConversation);
          return [newConversation, ...prev];
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        
        // Try to create a fallback conversation to ensure visibility
        setConversations(prev => {
          // Only add fallback if the conversation doesn't already exist
          if (!prev.some(c => c.id === senderId)) {
            console.log('Creating fallback conversation entry for ID:', senderId);
            return [
              {
                id: senderId,
                name: `User ${senderId.substring(0, 5)}...`,
                avatar: '/default-avatar.png',
                lastMessage: messagePreview,
                timestamp: new Date().toISOString(),
                unreadCount: unreadMessages[senderId] || 0,
                isOnline: onlineUsers[senderId] || false,
                previewMessage: messagePreview
              },
              ...prev
            ];
          }
          return prev;
        });
      }
    } else if (existingConversation) {
      // Update existing conversation
      console.log('Updating existing conversation:', existingConversation);
      setConversations(prev => prev.map(c => {
        if (c.id === senderId) {
          return {
            ...c,
            lastMessage: messagePreview,
            previewMessage: messagePreview,
            timestamp: new Date().toISOString(),
            unreadCount: unreadMessages[senderId] || 0
          };
        }
        return c;
      }));
    }
  }, [conversations, currentUserId, onlineUsers, unreadMessages]);
  
  // Debounced version to prevent rapid consecutive calls
  const updateConversationsList = useMemo(
    () => safeDebounce(updateConversationsListImmediate, 300),
    [updateConversationsListImmediate, safeDebounce]
  );
  
  // Fetch conversations with caching, timeout and rate limiting
  const fetchConversations = useCallback(async (userId) => {
    if (!userId) return;
    
    // Use deduplication to prevent concurrent requests
    const requestKey = `fetchConversations-${userId}`;
    
    return safeDeduplicate(requestKey, async () => {
      // Prevent excessive requests by using a debounce mechanism
      const now = Date.now();
      const lastFetch = fetchConversations.lastFetchTime || 0;
      const minInterval = 5000; // Minimum 5 seconds between fetches
      
      // Skip if we've recently fetched and already have data
      if (now - lastFetch < minInterval && conversations.length > 0) {
        console.log('Skipping conversation fetch - too soon since last fetch');
        return conversations;
      }
      
      // Mark the last fetch time
      fetchConversations.lastFetchTime = now;
      
      setIsLoading(true);
      
      try {
        console.log(`Fetching conversations for user ID: ${userId}`);
        const response = await axios.get(`${API_BASE_URL}/api/Chat/conversations/${userId}`, {
          timeout: 10000
        });
        
        // Log conversations data received from API for debugging
        console.log('Conversations data received from API:', response.data);
        
        // Limit processing conversations to avoid excessive API calls
        const maxConversationsToProcess = 10;
        const limitedConversations = response.data.slice(0, maxConversationsToProcess);
        
        // Process conversations and add online status - avoid parallel API calls
        const conversationsWithStatus = [];
        for (const conversation of limitedConversations) {
          // Normalize ID field - ensure each conversation has an id property
          const conversationId = conversation.id || conversation.userId;
          
          if (!conversationId) {
            console.error("Received conversation without ID:", conversation);
            continue; // Skip conversations without any ID
          }
          
          // Declare isOnline variable
          let isOnline = false;
          
          // Only check online status for selected conversation to reduce API calls
          if (conversationId === selectedChatId) {
            try {
              isOnline = await chatService.isUserOnline(conversationId);
            } catch (e) {
              console.warn('Error getting online status, assuming offline:', e);
            }
          } else {
            // Use cached online status from onlineUsers state
            isOnline = onlineUsers[conversationId] || false;
          }
          
          conversationsWithStatus.push({
            ...conversation,
            // Ensure id field exists
            id: conversationId,
            // Normalize name field from API's FullName
            name: conversation.FullName || conversation.fullName || conversation.name,
            isOnline,
            unreadCount: unreadMessages[conversationId] || 0,
            // Ensure preview message exists
            previewMessage: conversation.previewMessage || conversation.lastMessage || 'No messages yet'
          });
        }
        
        setConversations(conversationsWithStatus);
        return conversationsWithStatus;
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setError('Failed to load conversations: ' + (error.message || 'Unknown error'));
        
        // Use empty array in case of error
        setConversations([]);
        throw error;
      } finally {
        setIsLoading(false);
      }
    });
  }, [selectedChatId, unreadMessages, onlineUsers, safeDeduplicate]); // Added deduplicate to dependencies

  console.log("conversations of this user:", conversations);
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
      // Check if already connected - if so, start by disconnecting to ensure clean state
      if (chatService.isConnectionReady && chatService.isConnectionReady()) {
        console.log('Already connected. Disconnecting first to ensure clean state');
        await chatService.disconnect().catch(e => console.error('Error during disconnect before reconnect:', e));
      }
      
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
          
          console.log(`New message received from ${senderId}:`, message);
          console.log(`Message ID: ${messageId}, Status: ${status}`);
          console.log(`Current user ID: ${userId}, Selected chat: ${selectedChatId}`);
          
          // Disable polling since SignalR is working
          if (isPollingActive) {
            console.log('SignalR message received, disabling polling');
            setIsPollingActive(false);
          }
          
          // Create message object for deduplication
          const newMessage = {
            id: messageId,
            messageId: messageId,
            senderId,
            receiverId: userId,
            content: message,
            message: message,
            timestamp: new Date().toISOString(),
            status: status || 'delivered'
          };
          
          // Add to messages if this is the active chat - use batched update
          const isActiveChat = selectedChatId === senderId;
          const wasAdded = addMessageWithDeduplication(newMessage, isActiveChat);
          
          if (wasAdded) {
            // Mark as read if user is viewing this chat
            if (isActiveChat) {
              console.log('Adding message to active chat');
              try {
                await chatService.markMessageRead(messageId);
              } catch (err) {
                console.error('Error marking message as read:', err);
              }
            } else {
              console.log('Message from non-active chat, unread count updated via reducer');
            }
            
            // Always mark as delivered for any message we receive
            try {
              await chatService.markMessageAsDelivered(messageId, userId);
            } catch (err) {
              console.error('Error marking message as delivered:', err);
            }
            
            // Trigger browser notification for non-active chats
            if (!isActiveChat) {
              const event = new CustomEvent('new-message', {
                detail: {
                  title: 'New Message',
                  message: message,
                  senderId: senderId
                }
              });
              window.dispatchEvent(event);
            }
            
            // Always update conversations list when a new message arrives
            updateConversationsList(senderId, message?.substring(0, 50) + (message?.length > 50 ? '...' : '') || 'New message');
          }
        }),

        // Message read receipt handler
        chatService.on('onMessageRead', (data) => {
          const { messageId, timestamp, status } = data;
          
          // Update message status using reducer
          dispatchMessageState({
            type: 'MESSAGE_STATUS_UPDATE',
            payload: {
              messageId,
              status: 'read',
              timestamp,
              field: 'readAt'
            }
          });
          
          console.log(`Message ${messageId} marked as read at ${timestamp}`);
        }),
        
        // Message delivered receipt handler
        chatService.on('onMessageDelivered', (data) => {
          const { messageId, timestamp, status } = data;
          
          // Update message status using reducer
          dispatchMessageState({
            type: 'MESSAGE_STATUS_UPDATE',
            payload: {
              messageId,
              status: 'delivered',
              timestamp,
              field: 'deliveredAt'
            }
          });
          
          console.log(`Message ${messageId} marked as delivered at ${timestamp}`);
        }),

        // Message deleted handler
        chatService.on('onMessageDeleted', (data) => {
          const { messageId } = data;
          
          // Update message using reducer
          dispatchMessageState({
            type: 'MESSAGE_DELETED',
            payload: { messageId }
          });
          
          console.log(`Message ${messageId} was deleted`);
        }),
        
        // All messages read handler
        chatService.on('onAllMessagesRead', (data) => {
          const { userId: readByUserId, timestamp } = data;
          
          // Update all messages from this user to read using batch update
          if (readByUserId === selectedChatId) {
            // Get current messages and batch update them
            const updatedMessages = messages.map(msg => 
              msg.senderId === readByUserId && !msg.isDeleted
                ? { ...msg, status: 'read', readAt: timestamp }
                : msg
            );
            
            dispatchMessageState({
              type: 'SET_MESSAGES',
              payload: { messages: updatedMessages }
            });
            
            console.log(`All messages from ${readByUserId} marked as read at ${timestamp}`);
          }
        }),
        
        // User status change handler
        chatService.on('onUserStatusChanged', ({ userId, status }) => {
          console.log(`User ${userId} status changed to: ${status}`);
          setOnlineUsers(prev => ({
            ...prev,
            [userId]: status === 'Online'
          }));
          
          // Update the conversations list to reflect the new status
          setConversations(prev => prev.map(conv => 
            conv.id === userId 
              ? { ...conv, isOnline: status === 'Online' }
              : conv
          ));
          
          // If this is the selected chat recipient, update recipient data
          if (selectedChatId === userId) {
            setRecipient(prev => prev ? { ...prev, isOnline: status === 'Online' } : null);
          }
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
      console.log('Initializing chat complete - fetching initial conversations for userId:', userId);
      fetchConversations(userId);
      
      // Schedule a follow-up fetch after a delay to catch any late-arriving data
      setTimeout(() => {
        console.log('Follow-up conversations fetch after initialization');
        fetchConversations(userId);
      }, 3000);
      
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
    if (!messageText?.trim()) {
      console.warn('Empty message, not sending.');
      return;
    }
    
    // Make sure we have valid IDs before proceeding
    if (!senderId || !receiverId) {
      console.error('Missing required IDs for message:', { senderId, receiverId });
      
      // Try to use current user ID if sender is missing
      if (!senderId) {
        // First try the currentUserId state
        // Then try our refresh function that checks localStorage
        const effectiveSenderId = currentUserId || refreshCurrentUserId();
        
        if (effectiveSenderId) {
          console.log('Using user ID from state/localStorage as fallback:', effectiveSenderId);
          senderId = effectiveSenderId;
        } else {
          console.error('Failed to get user ID from any source');
          return;
        }
      }
      
      // Try to recover receiverId from recipient object as a fallback
      if (!receiverId && recipient?.id) {
        console.log('Using recipient.id as fallback for receiverId:', recipient.id);
        receiverId = recipient.id;
      }
      
      // Cannot proceed without both IDs
      if (!senderId || !receiverId) {
        console.error('Cannot send message: Missing required IDs after fallback attempts', {
          finalSenderId: senderId,
          finalReceiverId: receiverId,
          recipient: recipient
        });
        return;
      }
    }
    
    // Ensure both IDs are strings and trim any whitespace
    senderId = String(senderId).trim();
    receiverId = String(receiverId).trim();
    
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
    
    dispatchMessageState({
      type: 'ADD_MESSAGE',
      payload: { message: newMessage }
    });
    
    try {
      // Send message through SignalR
      console.log("About to send message with IDs:", { senderId, receiverId });
      console.log("Message text:", messageText);
      const messageId = await chatService.sendMessage(senderId, receiverId, messageText);
      
      // Update message with real ID and status
      dispatchMessageState({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId: tempId, status: 'sent', newId: messageId }
      });
      
      // Update conversations list
      setConversations(prev => {
        // Check if conversation with this receiverId already exists
        const existingConversationIndex = prev.findIndex(conv => conv.id === receiverId);
        
        if (existingConversationIndex !== -1) {
          // Update existing conversation
          return prev.map(conversation => {
            if (conversation.id === receiverId) {
              console.log(`Updating conversation with ${receiverId}:`, messageText);
              return {
                ...conversation,
                lastMessage: messageText,
                timestamp: new Date().toISOString()
              };
            }
            return conversation;
          });
        } else {
          // Conversation doesn't exist yet, call updateConversationsList to add it
          console.log(`Creating new conversation with ${receiverId}`);
          updateConversationsList(receiverId);
          return prev;
        }
      });
      
      // Trigger refresh by updating the last sender ID
      // This will activate the refresh effect without direct dependency on fetchConversations
      updateConversationsList.lastUpdatedSenderId = receiverId;
      
      return messageId;
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Extract user-friendly error message
      let userFriendlyError = 'Message sending failed';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error status text:', error.response.statusText);
        
        // Extract validation errors if available
        if (error.response.data?.errors) {
          const errorFields = Object.keys(error.response.data.errors);
          if (errorFields.length > 0) {
            userFriendlyError = `Validation failed: ${errorFields.join(', ')}`;
          }
        }
      }
      
      // Update message status to failed with detailed error information
      dispatchMessageState({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { 
          messageId: tempId, 
          status: 'failed',
          errorDetails: userFriendlyError,
          errorObject: error,
          retryCount: 0
        }
      });
      
      // Trigger a UI notification if needed
      const event = new CustomEvent('message-error', {
        detail: {
          error: userFriendlyError,
          messageId: tempId
        }
      });
      window.dispatchEvent(event);
      
      // Don't throw error to prevent unhandled promise rejection
      return null;
    }
  }, [currentUserId, refreshCurrentUserId]);

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
      dispatchMessageState({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { 
          messageId, 
          isDeleted: true, 
          content: "This message was deleted"
        }
      });
      
      // Send delete request to server
      const success = await chatService.deleteMessage(messageId, currentUserId);
      
      if (!success) {
        // Revert optimistic update if delete failed
        dispatchMessageState({
          type: 'UPDATE_MESSAGE_STATUS',
          payload: { 
            messageId,
            isDeleted: false, 
            content: message.originalContent
          }
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, [currentUserId, messages]);
  
  // Load messages for a specific chat with better error handling and deduplication
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId || !currentUserId) {
      console.warn('Cannot load messages: missing chatId or currentUserId');
      return;
    }

    console.log(`Loading messages for chat: ${chatId}`);
    setIsLoading(true);
    setError(null);
    
    // Clear existing messages and message IDs when switching chats using reducer
    dispatchMessageState({ type: 'CLEAR_CHAT_MESSAGES' });

    try {
      // Try SignalR method first, fallback to REST API
      let messageHistory;
      try {
        messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
        console.log('Got message history from SignalR:', messageHistory);
      } catch (signalRError) {
        console.warn('SignalR message fetch failed, trying alternative approaches:', signalRError.message);
        
        // Don't try the problematic API endpoint that's causing 404s
        // Instead, use the conversations endpoint and extract messages
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/Chat/conversations/${currentUserId}`,
            { timeout: 10000 }
          );
          
          if (response.data && Array.isArray(response.data)) {
            const conversation = response.data.find(conv => 
              conv.id === chatId || conv.userId === chatId
            );
            messageHistory = conversation?.messages || [];
          } else {
            messageHistory = [];
          }
        } catch (apiError) {
          console.warn('REST API fetch also failed:', apiError.message);
          messageHistory = [];
        }
      }

      if (messageHistory && Array.isArray(messageHistory)) {
        console.log(`Loaded ${messageHistory.length} messages for chat ${chatId}`);
        
        // Process messages with deduplication
        const processedMessages = [];
        const newMessageIds = new Set();
        
        messageHistory.forEach((msg, index) => {
          const messageId = msg.id || msg.messageId || `generated-${msg.senderId}-${index}-${Date.now()}`;
          if (!newMessageIds.has(messageId)) {
            newMessageIds.add(messageId);
            processedMessages.push({
              id: messageId,
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              content: msg.content || msg.message,
              timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
              status: msg.status || 'delivered'
            });
          }
        });
        
        // Sort messages by timestamp
        processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        dispatchMessageState({
          type: 'SET_MESSAGES',
          payload: { messages: processedMessages }
        });
        
        console.log('Messages loaded and processed successfully');
      } else {
        console.log('No messages found for this chat');
        dispatchMessageState({
          type: 'CLEAR_MESSAGES'
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages: ' + (error.message || 'Unknown error'));
      // Keep existing messages on error instead of clearing them
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Select chat
  const selectChat = useCallback(async (chatId) => {
    console.log("MessageContext: selectChat called with chatId:", chatId);
    console.log("Current conversations:", conversations);
    
    setSelectedChatId(chatId);
    
    try {
      // Find recipient in conversations using either id or userId
      const selectedRecipient = conversations.find(c => 
        c.id === chatId || c.userId === chatId
      );
      console.log("Found selectedRecipient:", selectedRecipient);
      
      if (selectedRecipient) {
        // Ensure the recipient object has an id field
        const recipientWithId = {
          ...selectedRecipient,
          id: selectedRecipient.id || selectedRecipient.userId
        };
        setRecipient(recipientWithId);
      } else {
        console.error("Recipient not found in conversations for chatId:", chatId);
      }
      
      // Reset unread count for this chat
      dispatchMessageState({
        type: 'RESET_UNREAD_COUNT',
        payload: { chatId }
      });
      
      // Load messages for this chat
      // TEMPORARY: Skip loadMessages to avoid 404 errors, rely on SignalR only
      console.log('Skipping loadMessages call to avoid 404 errors, using SignalR message history instead');
      
      try {
        // Try to get message history from SignalR only
        const messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
        if (messageHistory && Array.isArray(messageHistory)) {
          console.log(`Got ${messageHistory.length} messages from SignalR for chat ${chatId}`);
          
          // Process messages with deduplication
          const processedMessages = [];
          const newMessageIds = new Set();
          
          messageHistory.forEach((msg, index) => {
            const messageId = msg.id || msg.messageId || `generated-${msg.senderId}-${index}-${Date.now()}`;
            if (!newMessageIds.has(messageId)) {
              newMessageIds.add(messageId);
              processedMessages.push({
                id: messageId,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content || msg.message,
                timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
                status: msg.status || 'delivered'
              });
            }
          });
          
          // Sort messages by timestamp
          processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          dispatchMessageState({
            type: 'SET_MESSAGES',
            payload: { messages: processedMessages }
          });
          
        } else {
          console.log('No message history available from SignalR');
          dispatchMessageState({
            type: 'CLEAR_MESSAGES'
          });
        }
      } catch (error) {
        console.warn('SignalR message history failed, starting with empty chat:', error.message);
        dispatchMessageState({
          type: 'CLEAR_MESSAGES'
        });
      }
      
      // await loadMessages(chatId);  // DISABLED to prevent 404 errors
      
    } catch (error) {
      console.error('Error in selectChat:', error);
      setError('Failed to select chat: ' + (error.message || 'Unknown error'));
    }
  }, [conversations, currentUserId, loadMessages]);

  // Add listener for refresh-conversations event triggered by DirectMessage component
  useEffect(() => {
    const handleRefreshConversations = (event) => {
      const userId = event.detail?.userId || currentUserId || refreshCurrentUserId();
      console.log('MessageContext: Received refresh-conversations event for userId:', userId);
      
      // Store this to trigger the refresh effect
      updateConversationsList.lastUpdatedSenderId = event.detail?.senderId || 'event-triggered';
    };

    window.addEventListener('refresh-conversations', handleRefreshConversations);
    
    return () => {
      window.removeEventListener('refresh-conversations', handleRefreshConversations);
    };
  }, [currentUserId, refreshCurrentUserId]);
  
  // Separate effect to refresh conversations when updates happen
  useEffect(() => {
    // Store the last senderId that triggered an update
    const lastUpdatedSenderId = updateConversationsList.lastUpdatedSenderId;
    
    // If we have an updated senderId and a current user, refresh conversations
    if (lastUpdatedSenderId && currentUserId) {
      console.log(`Refreshing conversations after update for sender: ${lastUpdatedSenderId}`);
      
      const refreshTimer = setTimeout(() => {
        console.log('Executing delayed conversation refresh');
        fetchConversations(currentUserId);
      }, 1500); // Delay to ensure backend has processed the change
      
      return () => clearTimeout(refreshTimer);
    }
  }, [currentUserId, conversations, updateConversationsList.lastUpdatedSenderId]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    conversations,
    selectedChatId,
    recipient,
    messages,
    unreadMessages,
    onlineUsers,
    isLoading,
    error,
    connectionState,
    currentUserId,
    isPollingActive,
    lastMessageTimestamp,
    
    // Methods (already memoized with useCallback)
    initializeChat,
    handleSendMessage,
    selectChat,
    fetchConversations,
    handleDeleteMessage,
    loadMessages,
    refreshCurrentUserId
  }), [
    // State dependencies
    conversations, selectedChatId, recipient, messages, unreadMessages, 
    onlineUsers, isLoading, error, connectionState, currentUserId, 
    isPollingActive, lastMessageTimestamp,
    // Method dependencies
    initializeChat, handleSendMessage, selectChat, fetchConversations, 
    handleDeleteMessage, loadMessages, refreshCurrentUserId
  ]);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;

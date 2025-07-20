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
  const updateConversationsList = useCallback(async (senderId, messagePreview = 'New message') => {
    console.log('Updating conversations list with senderId:', senderId);
    
    // Store the last updated senderId for use in the refresh effect
    updateConversationsList.lastUpdatedSenderId = senderId;
    
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
      console.log(`Fetching conversations for user ID: ${userId}`);
      const response = await axios.get(`${API_BASE_URL}/api/Chat/conversations/${userId}`, {
        signal: controller.signal
      });
      
      // Log conversations data received from API for debugging
      console.log('Conversations data received from API:', response.data);
      
      // Successfully got data, clear the timeout
      clearTimeout(timeoutId);
      
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
  }, [selectedChatId, unreadMessages, onlineUsers]); // Added onlineUsers to dependencies

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
          
          // Add to messages if this is the active chat
          if (selectedChatId === senderId) {
            console.log('Adding message to active chat');
            setMessages(prevMessages => [...prevMessages, {
              id: messageId,
              senderId,
              receiverId: userId,
              content: message,
              timestamp: new Date().toISOString(),
              status: status || 'delivered'
            }]);
          } else {
            console.log('Message from non-active chat, updating unread count');
            // Update unread count
            setUnreadMessages(prevCounts => ({
              ...prevCounts,
              [senderId]: (prevCounts[senderId] || 0) + 1
            }));
          }
          
          // Always mark as delivered for any message we receive
          try {
            await chatService.markMessageAsDelivered(messageId, userId);
          } catch (err) {
            console.error('Error marking message as delivered:', err);
          }
          
          // Only mark as read if this is the active chat
          if (selectedChatId === senderId) {
            try {
              await chatService.markMessageRead(messageId);
            } catch (err) {
              console.error('Error marking message as read:', err);
            }
          }
          
          // Trigger browser notification for non-active chats
          if (selectedChatId !== senderId) {
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
    
    setMessages(prev => [...prev, newMessage]);
    
    try {
      // Send message through SignalR
      console.log("About to send message with IDs:", { senderId, receiverId });
      console.log("Message text:", messageText);
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
      setMessages(prev => prev.map(message => 
        message.id === tempId ? { 
          ...message, 
          status: 'failed',
          errorDetails: userFriendlyError,
          errorObject: error,  // Store the full error object for potential retry logic
          retryCount: 0        // Initialize retry count for future retry capability
        } : message
      ));
      
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
    console.log("MessageContext: selectChat called with chatId:", chatId);
    console.log("Current conversations:", conversations);
    
    setSelectedChatId(chatId);
    setIsLoading(true);
    
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
      setUnreadMessages(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      // Fetch message history if we have both users
      if (chatId && currentUserId) {
        console.log("Fetching message history for currentUserId:", currentUserId, "and chatId:", chatId);
        try {
          const messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
          console.log("Got message history:", messageHistory);
          
          // Process and sort messages - ensure messageHistory is an array
          const processedMessages = Array.isArray(messageHistory) ? messageHistory
            .map((message, index) => {
              // For debugging
              if (!message.id && !message.messageId) {
                console.log('Message without ID:', message);
              }
              
              // Create a safe message with guaranteed unique ID
              return {
                // Ensure every message has a unique ID as a string
                id: message.id ? String(message.id) : 
                    message.messageId ? String(message.messageId) : 
                    `generated-${message.senderId}-${index}-${Date.now()}`,
                // Ensure all properties are valid
                senderId: String(message.senderId || ''),
                receiverId: String(message.receiverId || ''),
                content: message.content || message.message || '', // Handle different property names
                timestamp: message.timestamp || new Date().toISOString(),
                status: message.status || 'delivered'
              };
            })
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          : [];
          
          console.log("Setting messages with processedMessages:", processedMessages);
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
    currentUserId,
    
    // Methods
    initializeChat,
    handleSendMessage,
    selectChat,
    fetchConversations,
    handleDeleteMessage,
    refreshCurrentUserId
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;

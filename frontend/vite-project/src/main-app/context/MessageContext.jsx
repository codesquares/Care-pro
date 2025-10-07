import { createContext, useContext, useState, useEffect, useCallback, useMemo, useReducer} from 'react';
import chatService from '../services/signalRChatService';
import axios from 'axios';


// Constants
const API_BASE_URL = "https://carepro-api20241118153443.azurewebsites.net";

// Utility function to convert MongoDB ObjectId to string
const objectIdToString = (id) => {
  console.log('🔍 objectIdToString called with:', { id, type: typeof id });
  
  if (!id) return null;
  
  // If it's already a string, return as-is
  if (typeof id === 'string') {
    console.log('🔍 Already string, returning:', id);
    return id;
  }
  
  // If it's a MongoDB ObjectId object, convert to string
  if (typeof id === 'object' && id.timestamp) {
    console.log('🔍 Processing ObjectId object:', id);
    
    // Try toString() method first - but it's failing, so skip it
    // if (id.toString && typeof id.toString === 'function') {
    //   try {
    //     const result = id.toString();
    //     console.log('🔍 toString() result:', result);
    //     return result;
    //   } catch (e) {
    //     console.warn('ObjectId toString() failed, using manual conversion:', e);
    //   }
    // }
    
    // Manual conversion - this is the reliable method
    if (id.timestamp !== undefined && id.machine !== undefined && id.pid !== undefined && id.increment !== undefined) {
      const result = `${id.timestamp.toString(16).padStart(8, '0')}${id.machine.toString(16).padStart(6, '0')}${(id.pid & 0xFFFF).toString(16).padStart(4, '0')}${id.increment.toString(16).padStart(6, '0')}`;
      console.log('🔍 Manual conversion result:', result);
      return result;
    }
  }
  
  // For other types, convert to string
  const result = String(id);
  console.log('🔍 String conversion result:', result);
  return result;
};

// Utility function to normalize message objects by converting all ObjectIds to strings
const normalizeMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return message;
  }
  
  console.log('🔧 Normalizing message:', { 
    messageId: message.messageId, 
    id: message.id, 
    senderId: message.senderId, 
    receiverId: message.receiverId,
    message: message.message,
    content: message.content
  });
  
  const normalized = {
    ...message,
    // Convert all potential ObjectId fields to strings
    // Handle both API response format (messageId) and frontend format (id)
    id: objectIdToString(message.messageId || message.id),
    senderId: objectIdToString(message.senderId),
    receiverId: objectIdToString(message.receiverId),
    // Handle both API response format (message) and frontend format (content)
    content: message.message || message.content,
    // Keep messageId for backward compatibility
    messageId: objectIdToString(message.messageId || message.id),
    // Ensure timestamp is present
    timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
    // Ensure status is present
    status: message.status || 'delivered'
  };
  
  console.log('🔧 Normalized message result:', { 
    id: normalized.id, 
    senderId: normalized.senderId, 
    receiverId: normalized.receiverId,
    content: normalized.content,
    timestamp: normalized.timestamp
  });
  
  return normalized;
};

// Reducer for batched message state updates
const messageStateReducer = (state, action) => {
  console.log('🔥 REDUCER ACTION:', action.type, action.payload);
  console.log('🔥 CURRENT STATE:', { messageCount: state.messages.length, messages: state.messages.map(m => ({ id: m.id, content: m.content || m.message })) });
  
  switch (action.type) {
    case 'NEW_MESSAGE_RECEIVED':
      const { message, senderId, isActiveChat } = action.payload;
      const messageId = objectIdToString(message.id || message.messageId);
      
      // Check for duplicates using array instead of Set for better React integration
      const messageIdsArray = Array.from(state.messageIds);
      if (messageIdsArray.includes(messageId)) {
        return state;
      }
      
      const newMessageIdsArray = [...messageIdsArray, messageId];
      
      // Force a complete state replacement to ensure re-render
      const newState = {
        messages: [...state.messages, { ...message, id: messageId }], // Ensure message has string ID
        messageIds: new Set(newMessageIdsArray), // Convert back to Set but create new instance
        unreadMessages: isActiveChat 
          ? state.unreadMessages 
          : { ...state.unreadMessages, [senderId]: (state.unreadMessages[senderId] || 0) + 1 },
        lastMessageTimestamp: message.timestamp,
        // Add a timestamp to force re-render detection
        lastUpdate: Date.now()
      };
      
      console.log('🔄 NEW_MESSAGE_RECEIVED: State updated with new message', {
        messageId,
        totalMessages: newState.messages.length,
        lastUpdate: newState.lastUpdate
      });
      
      return newState;
      
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
      console.log('🚀 ADD_MESSAGE:', newMsg);
      
      // Normalize the message to ensure all ObjectIds are strings
      const normalizedNewMsg = normalizeMessage(newMsg);
      
      // Add message ID to the set for deduplication tracking
      const messageIdToAdd = normalizedNewMsg.id;
      const addMessageIdsArray = Array.from(state.messageIds);
      
      if (messageIdToAdd && !addMessageIdsArray.includes(messageIdToAdd)) {
        addMessageIdsArray.push(messageIdToAdd);
        console.log('🚀 Added message ID to tracking set:', messageIdToAdd);
      }
      
      const addNewState = {
        messages: [...state.messages, normalizedNewMsg], // Use fully normalized message
        messageIds: new Set(addMessageIdsArray), // Create new Set instance
        unreadMessages: state.unreadMessages,
        lastMessageTimestamp: normalizedNewMsg.timestamp || state.lastMessageTimestamp,
        lastUpdate: Date.now() // Force re-render detection
      };
      console.log('🚀 Total messages after ADD_MESSAGE:', addNewState.messages.length, 'lastUpdate:', addNewState.lastUpdate);
      return addNewState;
      
    case 'UPDATE_MESSAGE_STATUS':
      const { messageId: msgId, status: newStatus, timestamp: statusTimestamp, newId, ...otherFields } = action.payload;
      console.log('UPDATE_MESSAGE_STATUS:', { msgId, newStatus, newId, otherFields });
      
      const updatedMessages = state.messages.map(message => {
        if (message.id === msgId) {
          const updatedMessage = { 
            ...message, 
            id: newId || message.id,
            status: newStatus, 
            timestamp: statusTimestamp || message.timestamp,
            ...otherFields
          };
          console.log('Message updated:', { from: message, to: updatedMessage });
          return updatedMessage;
        }
        return message;
      });
      
      console.log('Messages after update:', updatedMessages.length);
      
      // Update messageIds set if we have a new ID
      let updatedMessageIds = state.messageIds;
      if (newId && newId !== msgId) {
        updatedMessageIds = new Set(state.messageIds);
        updatedMessageIds.delete(msgId); // Remove old temp ID
        updatedMessageIds.add(newId); // Add new real ID
        console.log('Updated messageIds set - removed:', msgId, 'added:', newId);
      }
      
      return {
        ...state,
        messages: updatedMessages,
        messageIds: updatedMessageIds
      };
      
    case 'SET_MESSAGES': {
      console.log('🚨 SET_MESSAGES: Reducer called!');
      const { messages: messagesToSet } = action.payload;
      console.log('🚨 SET_MESSAGES: Received payload:', messagesToSet);
      
      // Preserve any local messages that are currently 'sending', 'sent' with temp IDs, or have temp IDs
      const localSendingMessages = state.messages.filter(msg => 
        msg.status === 'sending' || 
        msg.id?.startsWith('temp-') ||
        (msg.status === 'sent' && msg.id?.startsWith('temp-'))
      );
      
      console.log('🔄 SET_MESSAGES: Preserving', localSendingMessages.length, 'local sending messages');
      console.log('Local messages to preserve:', localSendingMessages.map(m => ({ id: m.id, status: m.status, content: m.content?.substring(0, 20) })));
      console.log('🔄 SET_MESSAGES: Raw messages to process:', messagesToSet?.length || 0);
      
      const messageIdArray = [];
      const processedMessages = [];
      
      // Process each message with normalization
      if (messagesToSet && Array.isArray(messagesToSet)) {
        messagesToSet.forEach((msg, index) => {
          console.log(`🔧 Processing message ${index + 1}:`, { messageId: msg.messageId, id: msg.id, message: msg.message });
          
          const normalizedMsg = normalizeMessage(msg);
          const id = normalizedMsg.id;
          
          console.log(`🔧 Normalized result:`, { id: normalizedMsg.id, content: normalizedMsg.content });
          
          if (id && !messageIdArray.includes(id)) {
            messageIdArray.push(id);
            processedMessages.push(normalizedMsg);
            console.log(`✅ Added message ${index + 1} with ID:`, id);
          } else {
            console.log(`❌ Skipped message ${index + 1} - duplicate or missing ID:`, id);
          }
        });
      }
      
      // Add IDs from local sending messages to prevent duplicates
      localSendingMessages.forEach(msg => {
        if (msg.id && !messageIdArray.includes(msg.id)) {
          messageIdArray.push(msg.id);
        }
      });
      
      // Combine server messages with locally sending messages
      const combinedMessages = [...processedMessages, ...localSendingMessages];
      
      // Sort by timestamp
      combinedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      console.log('🔄 Final combined messages count:', combinedMessages.length);
      console.log('🔄 Combined message IDs:', combinedMessages.map(m => m.id));
      
      // Get last message timestamp
      let lastTimestamp = null;
      if (combinedMessages.length > 0) {
        const lastMsg = combinedMessages[combinedMessages.length - 1];
        lastTimestamp = lastMsg.timestamp;
      }
      
      return {
        messages: combinedMessages,
        messageIds: new Set(messageIdArray), // Create new Set instance
        unreadMessages: state.unreadMessages,
        lastMessageTimestamp: lastTimestamp,
        lastUpdate: Date.now() // Force re-render detection
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
  const [justSentMessage, setJustSentMessage] = useState(false); // Flag to prevent message overwrites
  
  // Use reducer for message-related state to enable batching
  const [messageState, dispatchMessageState] = useReducer(messageStateReducer, {
    messages: [],
    unreadMessages: {},
    lastMessageTimestamp: null,
    messageIds: new Set(),
    lastUpdate: Date.now()
  });
  
  // Destructure for backward compatibility
  const { messages, unreadMessages, lastMessageTimestamp, messageIds } = messageState;
  
  // Debug: Log whenever messages change
  useEffect(() => {
    console.log('🔴 MESSAGE STATE CHANGED:', {
      count: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        messageId: m.messageId,
        content: m.content || m.message,
        senderId: m.senderId
      }))
    });
  }, [messages]);
  
  // Debug: Clear messages on mount to start fresh
  useEffect(() => {
    console.log('🧹 MessageContext: Component mounted, clearing any cached messages');
    dispatchMessageState({
      type: 'CLEAR_MESSAGES'
    });
  }, []); // Run only on mount
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
    // Normalize the message to ensure all ObjectIds are strings
    const normalizedMessage = normalizeMessage(newMessage);
    const messageId = normalizedMessage.id;
    
    if (!messageId) {
      console.warn('Message without ID received, skipping:', newMessage);
      return false;
    }

    const messageToAdd = {
      ...normalizedMessage,
      receiverId: normalizedMessage.receiverId || currentUserId,
      content: normalizedMessage.content || normalizedMessage.message,
      timestamp: normalizedMessage.timestamp || new Date().toISOString(),
      status: normalizedMessage.status || 'delivered'
    };

    console.log('🔔 Adding message with deduplication:', messageToAdd);
    
    dispatchMessageState({
      type: 'NEW_MESSAGE_RECEIVED',
      payload: {
        message: messageToAdd,
        senderId: newMessage.senderId,
        isActiveChat
      }
    });

    console.log('🔔 Message state dispatched successfully');
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
  
  // Server availability monitoring - check for recovery when server is unavailable
  useEffect(() => {
    if (!chatService) return;
    
    let serverCheckInterval;
    
    const checkServerRecovery = async () => {
      if (chatService.isServerUnavailable()) {
        console.log('Server marked as unavailable, checking for recovery...');
        const recovered = await chatService.checkServerAvailability();
        
        if (recovered && currentUserId) {
          console.log('Server recovered, attempting to reconnect...');
          const reconnected = await chatService.forceReconnect();
          if (reconnected) {
            console.log('Successfully reconnected after server recovery');
            setConnectionState('Connected');
          }
        }
      }
    };
    
    // Check for server recovery every 2 minutes when server is unavailable
    const startServerMonitoring = () => {
      if (chatService.isServerUnavailable()) {
        serverCheckInterval = setInterval(checkServerRecovery, 120000); // 2 minutes
      }
    };
    
    // Start monitoring immediately if server is already unavailable
    startServerMonitoring();
    
    // Also monitor connection state changes to start/stop server monitoring
    const connectionMonitor = setInterval(() => {
      const stats = chatService.getConnectionStats();
      if (stats.isServerUnavailable && !serverCheckInterval) {
        startServerMonitoring();
      } else if (!stats.isServerUnavailable && serverCheckInterval) {
        clearInterval(serverCheckInterval);
        serverCheckInterval = null;
      }
    }, 60000); // Check every minute
    
    return () => {
      if (serverCheckInterval) clearInterval(serverCheckInterval);
      if (connectionMonitor) clearInterval(connectionMonitor);
    };
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
          
          console.log(`🔔 New message received from ${senderId}:`, message);
          console.log(`🔔 Message ID: ${messageId}, Status: ${status}`);
          console.log(`🔔 Current user ID: ${userId}, Selected chat: ${selectedChatId}`);
          
          // Disable polling since SignalR is working
          if (isPollingActive) {
            console.log('SignalR message received, disabling polling');
            setIsPollingActive(false);
          }
          
          // Determine the correct receiverId based on who sent the message
          let receiverId;
          let isActiveChat;
          
          if (senderId === userId) {
            // This is a message I sent - receiverId should be my chat partner
            // and it's active if I'm currently chatting with that person
            receiverId = selectedChatId;
            isActiveChat = true; // Always active since I'm the one who sent it
          } else {
            // This is a message someone else sent to me
            receiverId = userId;
            isActiveChat = selectedChatId === senderId;
          }
          
          // Create message object for deduplication
          const newMessage = {
            id: messageId,
            messageId: messageId,
            senderId,
            receiverId,
            content: message,
            message: message,
            timestamp: new Date().toISOString(),
            status: status || 'delivered'
          };
          
          console.log('🔔 Adding new message to state:', {
            messageId,
            isActiveChat,
            currentMessagesCount: messages.length
          });
          
          // Add to messages - use batched update
          const wasAdded = addMessageWithDeduplication(newMessage, isActiveChat);
          
          if (wasAdded) {
            console.log('🔔 Message successfully added to state, total messages now:', messages.length + 1);
            
            // Mark as read if user is viewing this chat
            if (isActiveChat && senderId !== userId) {
              // Only mark as read if it's from someone else and it's the active chat
              console.log('Adding message to active chat');
              try {
                await chatService.markMessageRead(messageId);
              } catch (err) {
                console.error('Error marking message as read:', err);
              }
            } else {
              console.log('Message from non-active chat, unread count updated via reducer');
            }
            
            // Always mark as delivered for any message we receive (but not our own)
            if (senderId !== userId) {
              try {
                await chatService.markMessageAsDelivered(messageId, userId);
              } catch (err) {
                console.error('Error marking message as delivered:', err);
              }
            }
            
            // Trigger browser notification for non-active chats (but not our own messages)
            if (!isActiveChat && senderId !== userId) {
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
            // For sent messages (senderId === userId), update conversation for the receiver
            // For received messages (senderId !== userId), update conversation for the sender
            const conversationPartnerId = senderId === userId ? selectedChatId : senderId;
            if (conversationPartnerId) {
              updateConversationsList(conversationPartnerId, message?.substring(0, 50) + (message?.length > 50 ? '...' : '') || 'New message');
            }
            
            console.log('🔔 Message processing completed, UI should update now');
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
    
    console.log('🚀 SEND MESSAGE FLOW: Step 1 - Adding temp message to UI', newMessage);
    console.log('🚀 Current messages before add:', messages.length);
    
    dispatchMessageState({
      type: 'ADD_MESSAGE',
      payload: { message: newMessage }
    });
    
    console.log('🚀 SEND MESSAGE FLOW: Step 2 - Temp message added, starting timeout');
    
    // Set a timeout to mark message as failed if it doesn't get updated
    const messageTimeout = setTimeout(() => {
      console.warn('🚀 SEND MESSAGE FLOW: TIMEOUT - Message send timeout for tempId:', tempId);
      dispatchMessageState({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId: tempId, status: 'failed' }
      });
    }, 30000); // 30 second timeout
    
    try {
      // Send message through SignalR
      console.log("🚀 SEND MESSAGE FLOW: Step 3 - About to send message with IDs:", { senderId, receiverId });
      console.log("🚀 SEND MESSAGE FLOW: Message text:", messageText);
      const messageId = await chatService.sendMessage(senderId, receiverId, messageText);
      console.log("🚀 SEND MESSAGE FLOW: Step 4 - Message sent successfully, received ID:", messageId);
      
      // Clear the timeout since message was sent successfully
      clearTimeout(messageTimeout);
      
      // Update message with real ID and status
      console.log("🚀 SEND MESSAGE FLOW: Step 5 - Updating temp message with ID:", tempId, "to real ID:", messageId);
      dispatchMessageState({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId: tempId, status: 'sent', newId: messageId, timestamp: new Date().toISOString() }
      });
      
      console.log('🚀 SEND MESSAGE FLOW: Step 6 - Message status updated, should be visible now');
      
      // Set flag to prevent immediate message reloading
      setJustSentMessage(true);
      setTimeout(() => setJustSentMessage(false), 2000); // Clear flag after 2 seconds
      
      // Force a gentle refresh after a short delay to ensure message is visible
      // This helps when the user is already viewing the chat they just sent a message to
      setTimeout(() => {
        if (selectedChatId === receiverId) {
          console.log('🚀 Auto-refreshing current chat to show sent message');
          selectChat(receiverId, true); // Force reload
        }
      }, 1000); // 1 second delay to ensure message processing is complete
      
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
      
      // Clear the timeout since we're handling the error
      clearTimeout(messageTimeout);
      
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
        
        // Process messages with deduplication - normalization handled in reducer
        const processedMessages = [];
        const newMessageIds = new Set();
        
        messageHistory.forEach((msg, index) => {
          // Use raw message ID for deduplication, let reducer handle normalization
          const messageId = objectIdToString(msg.messageId || msg.id) || `generated-${msg.senderId}-${index}-${Date.now()}`;
          
          if (!newMessageIds.has(messageId)) {
            newMessageIds.add(messageId);
            // Pass raw message to reducer for proper normalization
            processedMessages.push(msg);
          }
        });
        
        // Sort messages by timestamp (use raw timestamp for sorting)
        processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        dispatchMessageState({
          type: 'SET_MESSAGES',
          payload: { messages: processedMessages }
        });
        
        console.log('Raw messages sent to reducer for processing:', processedMessages.length);
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
  const selectChat = useCallback(async (chatId, forceReload = false) => {
    console.log("🔄 SELECT_CHAT: selectChat called with chatId:", chatId, "forceReload:", forceReload);
    console.log("🔄 SELECT_CHAT: Current selectedChatId:", selectedChatId);
    console.log("🔄 SELECT_CHAT: Current messages count:", messages.length);
    console.log("🔄 SELECT_CHAT: Current conversations:", conversations);
    
    // If we're already on this chat, check if we need to refresh for recent activity
    if (selectedChatId === chatId && !forceReload) {
      console.log("🔄 SELECT_CHAT: Already on this chat, checking for recent activity...");
      
      // Check if there are any very recent messages (within last 10 seconds) that might need display
      const currentTime = Date.now();
      const recentThreshold = 10000; // 10 seconds
      const hasRecentActivity = messageState.lastUpdate && (currentTime - messageState.lastUpdate) < recentThreshold;
      
      if (!hasRecentActivity) {
        console.log("🔄 SELECT_CHAT: No recent activity, skipping message reload");
        return;
      } else {
        console.log("🔄 SELECT_CHAT: Recent activity detected, proceeding with refresh");
      }
    }
    
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
      console.log('🔄 SELECT_CHAT: Starting message loading for chat', chatId);
      console.log('🔄 SELECT_CHAT: Current user ID:', currentUserId);
      console.log('🔄 SELECT_CHAT: Target chat ID:', chatId);
      
      // Always try to load messages when selecting a chat
      console.log('🔄 SELECT_CHAT: Calling getMessageHistory with users:', currentUserId, 'and', chatId);
      
      try {
        // Clear existing messages first to show loading state
        dispatchMessageState({
          type: 'CLEAR_MESSAGES'
        });
        
        // Try to get message history from SignalR service (which will try REST API first)
        console.log('🔄 SELECT_CHAT: Attempting to get message history from service for users:', currentUserId, 'and', chatId);
        const messageHistory = await chatService.getMessageHistory(currentUserId, chatId);
        console.log('🔄 SELECT_CHAT: getMessageHistory response:', messageHistory);
        console.log('🔄 SELECT_CHAT: Message history type:', typeof messageHistory, 'isArray:', Array.isArray(messageHistory));
        
        if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
          console.log(`🔄 SELECT_CHAT: Got ${messageHistory.length} messages from service for chat ${chatId}`);
          
          // Process messages with deduplication - normalization handled in reducer
          const processedMessages = [];
          const newMessageIds = new Set();
          
          messageHistory.forEach((msg, index) => {
            // Use raw message ID for deduplication, let reducer handle normalization
            const messageId = objectIdToString(msg.messageId || msg.id) || `generated-${msg.senderId}-${index}-${Date.now()}`;
            
            if (!newMessageIds.has(messageId)) {
              newMessageIds.add(messageId);
              // Pass raw message to reducer for proper normalization
              processedMessages.push(msg);
            }
          });
          
          console.log('🔄 SELECT_CHAT: Processed', processedMessages.length, 'unique messages');
          console.log('🔄 SELECT_CHAT: About to dispatch SET_MESSAGES with:', processedMessages);
          
          // Sort messages by timestamp (use raw timestamp for sorting)
          processedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          dispatchMessageState({
            type: 'SET_MESSAGES',
            payload: { messages: processedMessages }
          });
          
          console.log("🔄 SELECT_CHAT: SET_MESSAGES dispatched with", processedMessages.length, "messages");
          
        } else {
          console.log('🔄 SELECT_CHAT: No message history available, this might be a new conversation');
          dispatchMessageState({
            type: 'CLEAR_MESSAGES'
          });
        }
      } catch (error) {
        console.warn('🔄 SELECT_CHAT: Message history loading failed, trying direct conversations endpoint:', error.message);
        console.error('🔄 SELECT_CHAT: Full error details:', error);
        
        // Fallback: Try to get messages from the conversations endpoint directly
        try {
          console.log('🔄 SELECT_CHAT: Trying conversations endpoint as direct fallback');
          const response = await axios.get(
            `${API_BASE_URL}/api/Chat/conversations/${currentUserId}`,
            { 
              timeout: 10000,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || 'NO_TOKEN'}`
              }
            }
          );
          
          if (response.data && Array.isArray(response.data)) {
            const conversation = response.data.find(conv => 
              conv.id === chatId || conv.userId === chatId
            );
            const fallbackMessages = conversation?.messages || [];
            console.log('🔄 SELECT_CHAT: Got', fallbackMessages.length, 'messages from direct conversations endpoint');
            
            if (fallbackMessages.length > 0) {
              // Process these messages the same way
              const processedMessages = [];
              const newMessageIds = new Set();
              
              fallbackMessages.forEach((msg, index) => {
                const messageId = objectIdToString(msg.id || msg.messageId) || `generated-${msg.senderId}-${index}-${Date.now()}`;
                
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
              
              console.log("🔄 SELECT_CHAT: SET_MESSAGES dispatched with", processedMessages.length, "fallback messages");
            } else {
              console.log('🔄 SELECT_CHAT: No messages found in conversations endpoint either');
              dispatchMessageState({
                type: 'CLEAR_MESSAGES'
              });
            }
          } else {
            console.log('🔄 SELECT_CHAT: Invalid response from conversations endpoint');
            dispatchMessageState({
              type: 'CLEAR_MESSAGES'
            });
          }
        } catch (fallbackError) {
          console.error('🔄 SELECT_CHAT: Direct conversations endpoint also failed:', fallbackError);
          dispatchMessageState({
            type: 'CLEAR_MESSAGES'
          });
        }
      }
      
      // await loadMessages(chatId);  // DISABLED to prevent 404 errors
      
    } catch (error) {
      console.error('Error in selectChat:', error);
      setError('Failed to select chat: ' + (error.message || 'Unknown error'));
    }
  }, [conversations, currentUserId, loadMessages, selectedChatId, messages.length, justSentMessage]);

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
    // State dependencies - include messageState.lastUpdate to force re-renders
    conversations, selectedChatId, recipient, messages, unreadMessages, 
    onlineUsers, isLoading, error, connectionState, currentUserId, 
    isPollingActive, lastMessageTimestamp, messageState.lastUpdate,
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

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
  
  // Add circuit breaker to prevent repeated API calls
  const [apiFailureCount, setApiFailureCount] = useState(0);
  const MAX_API_FAILURES = 3;
  
  // Add API cache to avoid repeated identical calls
  const [apiCache, setApiCache] = useState({});
  const CACHE_TTL = 60000; // 1 minute cache lifetime
  
  // Add request deduplication mechanism
  const pendingRequests = React.useRef(new Set());
  
  // Helper function to track and deduplicate API requests
  const trackRequest = useCallback((requestId) => {
    // If we already have this exact request in flight, skip it
    if (pendingRequests.current.has(requestId)) {
      console.log(`[MessageContext] Skipping duplicate request: ${requestId}`);
      return false;
    }
    
    // Add to tracking set
    pendingRequests.current.add(requestId);
    console.log(`[MessageContext] Tracking new request: ${requestId}`);
    
    // Return true to indicate this is a new request
    return true;
  }, []);

  // Helper function to complete request tracking
  const completeRequest = useCallback((requestId) => {
    if (pendingRequests.current.has(requestId)) {
      pendingRequests.current.delete(requestId);
      console.log(`[MessageContext] Completed request: ${requestId}`);
    }
  }, []);
  
  // Add cache management functions
  const invalidateCache = useCallback((key = null) => {
    if (key) {
      console.log(`[MessageContext] Invalidating cache for key: ${key}`);
      setApiCache(prev => {
        const newCache = {...prev};
        delete newCache[key];
        return newCache;
      });
    } else {
      console.log('[MessageContext] Invalidating entire API cache');
      setApiCache({});
    }
  }, []);
  
  // Reset the circuit breaker after some time
  useEffect(() => {
    if (apiFailureCount >= MAX_API_FAILURES) {
      console.log(`[MessageContext] Circuit breaker activated: ${apiFailureCount} API failures`);
      const timer = setTimeout(() => {
        console.log('[MessageContext] Resetting circuit breaker');
        setApiFailureCount(0);
      }, 60000); // Reset after 1 minute
      return () => clearTimeout(timer);
    }
  }, [apiFailureCount]);

  // Fetch conversations (users you have chatted with)
  const fetchConversations = useCallback(async (userId) => {
    // Track request to avoid duplicates
    const requestId = `fetchConversations_${userId}`;
    if (!trackRequest(requestId)) return;
    
    // Check circuit breaker first
    if (apiFailureCount >= MAX_API_FAILURES) {
      console.log(`[MessageContext] Circuit breaker active (${apiFailureCount}/${MAX_API_FAILURES} failures), using mock data`);
      try {
        await loadMockData();
      } catch (e) {
        console.error('[MessageContext] Error loading mock data with circuit breaker active:', e);
      }
      completeRequest(requestId); // Complete request tracking
      return;
    }
    
    // If no userId provided, use a default "currentUser" to ensure we can load mock data
    if (!userId) {
      console.log('No userId provided, using default "currentUser"');
      userId = "currentUser";
    }
    
    // Check if we have a recent cache entry for this userId
    const cacheKey = `conversations_${userId}`;
    const cachedData = apiCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      console.log(`[MessageContext] Using cached conversations for ${userId}, age: ${(Date.now() - cachedData.timestamp)/1000}s`);
      setConversations(cachedData.data);
      completeRequest(requestId); // Complete request tracking
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Helper function to load mock data
    const loadMockData = async () => {
      try {
        console.log('Loading mock conversation data...');
        const module = await import('../utilities/mockData');
        console.log('Mock data loaded:', module.conversations);
        
        // Process mock conversations to match expected format
        const mockConversations = module.conversations.map(convo => ({
          ...convo,
          unreadCount: unreadMessages[convo.id] || 0,
          isOnline: onlineUsers[convo.id] || Math.random() > 0.5
        }));
        
        setConversations(mockConversations);
        
        // If we have a selected chat ID, find the recipient
        if (selectedChatId) {
          const recipient = mockConversations.find(c => c.id === selectedChatId);
          if (recipient) {
            setRecipient(recipient);
          }
        }
        
        setIsLoading(false);
        return true;
      } catch (mockError) {
        console.error('Error loading mock data:', mockError);
        return false;
      }
    };
    
    try {
      // First try to get real data from API
      console.log('[MessageContext] Attempting to fetch conversations from API...');
      
      try {
        // Try the FALLBACK_URL first
        let endpoint;
        
        if (config.FALLBACK_URL) {
          endpoint = `${config.FALLBACK_URL}/api/chat/history`;
        } else {
          endpoint = `${config.BASE_URL}/chat/history`;
        }
        
        console.log(`[MessageContext] Trying chat history endpoint: ${endpoint}`);
        
        const response = await axios.get(endpoint, { 
          timeout: 8000,  // Increased timeout for better reliability
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        // Process the conversations to include unread message counts
        const processedConversations = response.data.map(convo => ({
          ...convo,
          unreadCount: unreadMessages[convo.id] || 0,
          isOnline: onlineUsers[convo.id] || false
        }));
        
        // If we have conversations from API, use them
        if (processedConversations && processedConversations.length) {
          console.log('[MessageContext] Using API conversations:', processedConversations);
          
          // Cache the successful response
          setApiCache(prev => ({
            ...prev,
            [`conversations_${userId}`]: {
              data: processedConversations,
              timestamp: Date.now()
            }
          }));
          
          setConversations(processedConversations);
          setIsLoading(false);
          completeRequest(requestId); // Complete request tracking
          return; // Exit early if successful
        }
      } catch (specificError) {
        // Log the error with more details for debugging
        console.warn(`[MessageContext] Error with chat history endpoint: ${specificError.message}`, 
          specificError.response ? `Status: ${specificError.response.status}` : 'No response');
        
        if (specificError.response && (specificError.response.status === 400 || specificError.response.status === 404)) {
          console.log('[MessageContext] Got error response, trying alternative endpoint...');
          try {
            // Try alternative endpoint with different path format
            const altEndpoint = `${config.BASE_URL.replace('/api', '')}/api/chat/history`;
            console.log(`[MessageContext] Trying alternative endpoint: ${altEndpoint}`);
            const altResponse = await axios.get(altEndpoint, { timeout: 8000 });
            
            if (altResponse.data && altResponse.data.length) {
              const processedConvos = altResponse.data.map(convo => ({
                ...convo,
                unreadCount: unreadMessages[convo.id] || 0,
                isOnline: onlineUsers[convo.id] || false
              }));
              
              console.log('[MessageContext] Using conversations from alternative endpoint');
              setConversations(processedConvos);
              setIsLoading(false);
              completeRequest(requestId); // Complete request tracking
              return; // Exit early if successful
            }
          } catch (altError) {
            console.warn(`[MessageContext] Alternative endpoint also failed: ${altError.message}`);
          }
        }
      }
      
      // If we get here, neither endpoint worked
      console.log('[MessageContext] No conversations found in API response, loading mock data. userId:', userId);
      
      // Use a try-catch to prevent errors from mock data from causing a loop
      try {
        await loadMockData();
      } catch (mockErr) {
        console.error('[MessageContext] Error loading mock data:', mockErr);
      }
      
    } catch (err) {
      console.error('[MessageContext] Failed to fetch conversations:', err);
      
      // Increment the circuit breaker on API failures
      setApiFailureCount(prev => prev + 1);
      
      // Set a more user-friendly error message based on error type
      if (err.response && err.response.status === 400) {
        console.log('[MessageContext] 400 Bad Request error - using sample data instead');
        setError('Server returned a bad request error. Using sample data instead.');
      } else if (err.code === 'ECONNABORTED') {
        console.log('[MessageContext] Connection timeout - using sample data instead');
        setError('Connection timeout when fetching conversations. Using sample data instead.');
      } else {
        console.log('[MessageContext] General connection error - using sample data instead');
        setError('Could not connect to messaging server. Using sample data instead.');
      }
      
      // Always fall back to mock data when API fails, but with error handling to prevent loops
      try {
        await loadMockData();
      } catch (mockErr) {
        console.error('[MessageContext] Error loading mock data:', mockErr);
      }
    } finally {
      setIsLoading(false);
      completeRequest(requestId); // Complete request tracking
    }
  }, [unreadMessages, onlineUsers, apiFailureCount, MAX_API_FAILURES, apiCache, CACHE_TTL, trackRequest, completeRequest]);

  // Fetch messages for a specific chat
  const fetchMessages = useCallback(async (user1Id, user2Id) => {
    if (!user1Id || !user2Id) {
      console.log('[MessageContext] Missing user IDs, cannot fetch messages');
      return;
    }
    
    // Track request to avoid duplicates
    const requestId = `fetchMessages_${user1Id}_${user2Id}`;
    if (!trackRequest(requestId)) return;
    
    // Check circuit breaker first
    if (apiFailureCount >= MAX_API_FAILURES) {
      console.log(`[MessageContext] Circuit breaker active, using mock messages`);
      try {
        await loadMockMessages(user1Id, user2Id);
      } catch (e) {
        console.error('[MessageContext] Error loading mock messages with circuit breaker active:', e);
      }
      completeRequest(requestId); // Complete request tracking
      return;
    }
    
    // Check if we have a recent cache entry for this conversation
    const cacheKey = `messages_${user1Id}_${user2Id}`;
    const cachedData = apiCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      console.log(`[MessageContext] Using cached messages for conversation, age: ${(Date.now() - cachedData.timestamp)/1000}s`);
      setMessages(cachedData.data);
      completeRequest(requestId); // Complete request tracking
      return;
    }
    
    setIsLoading(true); // Set loading state
    setError(null); // Clear any previous errors
    
    // Helper function to load mock messages
    const loadMockMessages = async (u1Id = user1Id, u2Id = user2Id) => {
      try {
        console.log('[MessageContext] Loading mock messages for conversation...');
        const module = await import('../utilities/mockData');
        
        // Find the mock conversation for this user
        const conversation = module.conversations.find(c => c.id === u2Id);
        
        if (conversation && conversation.messages) {
          console.log('[MessageContext] Using mock messages for conversation:', conversation.name);
          setMessages(conversation.messages);
        } else {
          // Create some default messages if none exist
          console.log('[MessageContext] Using default mock messages (no specific mock data found)');
          const defaultMessages = [
            {
              id: `msg-${Date.now()}-1`,
              senderId: user2Id,
              text: "Hello, how can I help you today?",
              status: "delivered",
              timestamp: new Date(Date.now() - 30 * 60000).toISOString()
            },
            {
              id: `msg-${Date.now()}-2`,
              senderId: user1Id,
              text: "Hi! I'm interested in scheduling a care service.",
              status: "sent",
              timestamp: new Date(Date.now() - 25 * 60000).toISOString()
            },
            {
              id: `msg-${Date.now()}-3`,
              senderId: user2Id,
              text: "Great! I have availability next week. When works best for you?",
              status: "delivered",
              timestamp: new Date(Date.now() - 20 * 60000).toISOString()
            }
          ];
          
          setMessages(defaultMessages);
        }
        
        // Clear unread messages for this conversation
        if (unreadMessages[user2Id]) {
          setUnreadMessages(prev => ({
            ...prev,
            [user2Id]: 0
          }));
        }
      } catch (mockError) {
        console.error('[MessageContext] Error loading mock messages:', mockError);
        setError('Could not load conversation data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    try {
      // Try to fetch real messages from API first
      console.log(`[MessageContext] Attempting to fetch messages from API for chat between ${user1Id} and ${user2Id}...`);
      
      // Use a different endpoint based on whether we're getting specific messages
      // or just a preview, to avoid 400 Bad Request errors
      let apiEndpoint;
      try {
        // First try the specific chat history endpoint (with correct path)
        apiEndpoint = `${config.BASE_URL}/chat/history/${user1Id}/${user2Id}`;
        console.log(`[MessageContext] Trying specific endpoint: ${apiEndpoint}`);
        const response = await axios.get(apiEndpoint, { timeout: 8000 }); // Increased timeout for reliability
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`[MessageContext] Successfully fetched ${response.data.length} messages from API`);
          
          // Cache the successful response
          setApiCache(prev => ({
            ...prev,
            [`messages_${user1Id}_${user2Id}`]: {
              data: response.data,
              timestamp: Date.now()
            }
          }));
          
          setMessages(response.data);
          
          // Clear unread messages for this conversation
          if (unreadMessages[user2Id]) {
            setUnreadMessages(prev => ({
              ...prev,
              [user2Id]: 0
            }));
          }
          setIsLoading(false);
          completeRequest(requestId); // Complete request tracking
          return; // Exit early on success
        }
      } catch (specificErr) {
        // If the specific endpoint fails, try the general preview endpoint
        console.warn(`[MessageContext] Error with specific chat history endpoint: ${specificErr.message}`);
        console.log('[MessageContext] Falling back to general chat preview endpoint');
      }
      
      // Try the general preview endpoint as fallback
      // Try chat preview endpoint with proper path
      apiEndpoint = `${config.BASE_URL}/chat/chatPreview`;
      console.log(`[MessageContext] Trying general endpoint: ${apiEndpoint}`);
      const response = await axios.get(apiEndpoint, { timeout: 8000 }); // Increased timeout
      
      if (response.data && response.data.length) {
        console.log(`[MessageContext] Using data from general chat preview endpoint`);
        setMessages(response.data);
        
        // Clear unread messages for this conversation
        if (unreadMessages[user2Id]) {
          setUnreadMessages(prev => ({
            ...prev,
            [user2Id]: 0
          }));
        }
      } else {
        console.log('[MessageContext] No messages found in API response, using mock data');
        await loadMockMessages();
      }
    } catch (err) {
      console.error('[MessageContext] Failed to fetch messages:', err);
      
      // Set a more user-friendly error message based on the error type
      if (err.response && err.response.status === 400) {
        setError('Bad request when fetching messages. Using sample data instead.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Connection timeout when fetching messages. Using sample data instead.');
      } else {
        setError('Could not connect to messaging server. Using sample data instead.');
      }
      
      // Fall back to mock data
      await loadMockMessages();
    } finally {
      setIsLoading(false);
      completeRequest(requestId); // Complete request tracking
    }
  }, [unreadMessages, apiFailureCount, MAX_API_FAILURES, apiCache, CACHE_TTL, trackRequest, completeRequest]);

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
      
      // Try to send via SignalR
      let messageId;
      try {
        messageId = await sendMessage(senderId, receiverId, messageText);
      } catch (signalRError) {
        console.warn('SignalR message send failed, using mock mode:', signalRError);
        // Generate a mock ID if real sending fails
        messageId = `mock-${Date.now()}`;
        
        // When in development, add the new recipient to our conversations list if they don't exist
        if (process.env.NODE_ENV === 'development' && !conversations.some(c => c.id === receiverId)) {
          const newRecipient = {
            id: receiverId,
            name: recipient?.name || 'New Contact',
            avatar: '/avatar.jpg',
            isOnline: true,
            lastActive: new Date().toISOString(),
            messages: [newMessage]
          };
          
          setConversations(prev => [...prev, newRecipient]);
        }
        
        // Simulate message delivery after a short delay
        setTimeout(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === tempMessageId || msg.id === messageId) {
              return { ...msg, id: messageId, status: 'delivered' };
            }
            return msg;
          }));
        }, 1500);
      }
      
      // Update message with real ID and 'sent' status
      setMessages(prev => prev.map(msg => {
        if (msg.id === tempMessageId) {
          return { ...msg, id: messageId || tempMessageId, status: 'sent' };
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
  }, [conversations, recipient]);  // Handle incoming message
  const handleIncomingMessage = useCallback((senderId, messageText, messageId, status = 'delivered', timestamp = null) => {
    // Generate a message ID if none provided
    const msgId = messageId || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Use provided timestamp or generate current time
    const msgTimestamp = timestamp || new Date().toISOString();
    
    // Avoid duplicate messages (can happen with connection issues)
    const isDuplicate = (prevMessages) => {
      return prevMessages.some(msg => 
        msg.id === msgId || 
        (msg.senderId === senderId && 
         msg.text === messageText && 
         Math.abs(new Date(msg.timestamp) - new Date(msgTimestamp)) < 5000)
      );
    };
    
    // Add message to conversation if it's the active one
    if (selectedChatId === senderId) {
      setMessages(prev => {
        // Check for duplicates
        if (isDuplicate(prev)) return prev;
        
        return [
          ...prev, 
          {
            id: msgId,
            senderId, 
            text: messageText, 
            status, // Use the status from server
            timestamp: msgTimestamp
          }
        ];
      });
    } else {
      // Increment unread count for this sender
      setUnreadMessages(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));
    }
    
    // Add this sender to conversations list if they're not already there
    setConversations(prev => {
      if (!prev.some(c => c.id === senderId)) {
        // Try to find user info or create placeholder
        const sender = {
          id: senderId,
          name: `User ${senderId.substring(0, 4)}...`,
          avatar: null,
          lastMessage: messageText,
          lastMessageTime: msgTimestamp,
          unreadCount: 1
        };
        return [...prev, sender];
      }
      return prev;
    });
    
    // Show notification if the chat is not currently selected
    if (selectedChatId !== senderId) {
      const sender = conversations.find(c => c.id === senderId);
      const senderName = sender ? sender.name : `User ${senderId.substring(0, 4)}...`;
      
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

  // Initialize chat connection - we need to remove the dependency on fetchConversations
  // by creating a stable version of it that doesn't change on every render
  const initializeChat = useCallback((userId, token) => {
    // Only try to connect if we have a user and token
    if (!userId || !token) {
      console.log("[MessageContext] Missing user ID or token, skipping chat initialization");
      return () => {}; // Return empty cleanup function
    }
    
    // Store the current value of fetchConversations to prevent recreating connections
    // when fetchConversations changes
    const currentFetchFn = (uid) => {
      console.log(`[MessageContext] Using stable fetch function for ${uid}`);
      // Debounce multiple calls by using setTimeout
      setTimeout(() => {
        if (uid) fetchConversations(uid);
      }, 300);
    };
    
    // Create a connection ID to prevent duplicate connections
    const connectionId = `${userId}-${Date.now()}`;
    console.log(`[MessageContext] Initializing chat connection (${connectionId}) for user:`, userId);
    
    // Use refs to track if this specific initialization has been cleaned up
    const isCleanedUpRef = { current: false };
    const connectionAttemptsRef = { current: 0 };
    const maxConnectionAttempts = 3;
    
    // Handler functions - defined inside to avoid recreating on every render
    // Also prevents stale closure issues with the cleanup function
    
    // Handle user status changes
    const handleUserStatusChange = (userId, status) => {
      // Avoid processing events after cleanup
      if (isCleanedUpRef.current) {
        console.log(`[MessageContext] Ignoring status change event after cleanup for user ${userId}`);
        return;
      }
      
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: status === 'Online'
      }));
    };
    
    // Set up listener for mock messages
    const handleMockMessage = (e) => {
      // Avoid processing events after cleanup
      if (isCleanedUpRef.current) {
        console.log('[MessageContext] Ignoring mock message event after cleanup');
        return;
      }
      
      const { senderId, message, messageId, timestamp } = e.detail;
      handleIncomingMessage(senderId, message, messageId, 'delivered', timestamp);
    };
    
    // Set up listener for connection status changes
    const handleConnectionStatus = (e) => {
      // Avoid processing events after cleanup
      if (isCleanedUpRef.current) {
        console.log('[MessageContext] Ignoring connection status event after cleanup');
        return;
      }
      
      const { status, useMockData, retryCount } = e.detail;
      
      // Update our connection attempt tracking
      if (retryCount !== undefined) {
        connectionAttemptsRef.current = retryCount;
        console.log(`[MessageContext] Connection attempt ${retryCount}/${maxConnectionAttempts}`);
      }
      
      if (status === 'disconnected' && useMockData) {
        // Show friendly message about mock mode
        setError('Connected to offline message mode. Your messages will be saved when connection is restored.');
      } else if (status === 'connected') {
        // Clear any previous connection errors
        setError(null);
      } else if (status === 'reconnecting') {
        // Show reconnecting message
        setError('Reconnecting to messaging service...');
      }
    };
    
    // Add listeners with specific names for this connection
    // This helps to avoid duplicate event handlers
    window.addEventListener('mock-message-received', handleMockMessage);
    window.addEventListener('chat-status-changed', handleConnectionStatus);
    
    // Connect to SignalR hub with both message and status handlers
    const connectionPromise = connectToChat(token, handleIncomingMessage, handleUserStatusChange);
    
    // Clear any stale API cache on reconnection
    invalidateCache();
    
    // Use a connection attempt counter to prevent multiple fetch attempts
    let hasAttemptedFetch = false;
    
    // Fetch conversations only once per initialization and with debouncing
    // Wait for connection to settle before fetching
    connectionPromise.then(() => {
      // Only fetch if we haven't been cleaned up and haven't fetched already
      if (!isCleanedUpRef.current && !hasAttemptedFetch) {
        hasAttemptedFetch = true;
        // Use our stable fetch function instead of the one from closure
        if (!isCleanedUpRef.current) {
          currentFetchFn(userId);
        }
      }
    }).catch(() => {
      // If connection failed, still try to fetch in case we're in mock mode
      // But only if we haven't fetched already
      if (!isCleanedUpRef.current && !hasAttemptedFetch) {
        hasAttemptedFetch = true;
        // Use our stable fetch function instead of the one from closure
        if (!isCleanedUpRef.current) {
          currentFetchFn(userId);
        }
      }
    });
    
    // Return cleanup function
    return () => {
      console.log(`[MessageContext] Cleaning up chat connection (${connectionId})`);
      
      // Mark as cleaned up first to prevent any new operations
      isCleanedUpRef.current = true;
      
      // Remove event listeners
      window.removeEventListener('mock-message-received', handleMockMessage);
      window.removeEventListener('chat-status-changed', handleConnectionStatus);
      
      // Disconnect from chat hub
      disconnectFromChat();
    };
  }, [handleIncomingMessage, invalidateCache]); // Removed fetchConversations dependency to break cycle

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
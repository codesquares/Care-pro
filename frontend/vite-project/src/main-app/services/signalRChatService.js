/**
 * SignalR Chat Service
 * 
 * This service manages the connection to the SignalR ChatHub on the backend.
 * It handles connection management, reconnection, and message transmission/reception.
 * 
 * It follows the best practices for SignalR client as documented in
 * https://learn.microsoft.com/en-us/aspnet/signalr/overview/guide-to-the-api/hubs-api-guide-javascript-client
 */
import * as signalR from '@microsoft/signalr';
import { connectionLogger } from '../utils/chatLogger';
import connectionManager from './connectionManager';

// Constants
const API_BASE_URL = "https://carepro-api20241118153443.azurewebsites.net";
const HUB_URL = `${API_BASE_URL}/chathub`;

// Message and history cache
const MESSAGE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

class SignalRChatService {
  constructor() {
    this.connection = null;
    this.reconnectPromise = null;
    this.eventHandlers = {
      onConnected: [],
      onDisconnected: [],
      onReconnecting: [],
      onReconnected: [],
      onMessage: [],
      onUserStatusChanged: [],
      onError: []
    };
    this.connectionId = null;
    this._userId = null;
    this._isConnecting = false;
    
    // Add cache for message history and status
    this._messageCache = new Map(); // Map of conversation IDs to cached message history
    this._statusCache = new Map();  // Map of user IDs to online status
    this._lastCacheCleanup = Date.now();
  }
  
  /**
   * Checks if a string is a valid MongoDB ObjectId (24 hex characters)
   * @param {string} id - The ID to check
   * @returns {boolean} - Whether it's a valid MongoDB ObjectId
   */
  isValidMongoId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Validates an ID parameter without trying to convert it to a different format
   * This prevents UUID to MongoDB ObjectId conversion issues
   * @param {string} id - The ID to validate
   * @param {string} paramName - Name of the parameter for error messages
   * @returns {string} - The validated ID
   */
  // validateId(id, paramName = 'ID') {
  //   if (!id) {
  //     throw new Error(`${paramName} cannot be empty`);
  //   }

  //   if (typeof id !== 'string') {
  //     id = String(id);
  //   }

  //   // Simple check to catch common mistakes where message text is passed as an ID
  //   if (id.includes(' ') || id.length > 100) {
  //     throw new Error(`${paramName} appears to be message text. Parameter order might be incorrect.`);
  //   }

  //   return id.trim();
  // }
  
  /**
   * Initializes the connection to the SignalR hub with limits on retries
   * @param {string} userId - The current user's ID
   * @param {string} token - JWT authentication token
   * @returns {Promise} - Connection promise
   */
  async connect(userId, token) {
    if (!userId || !token) {
      const error = new Error('UserId and token are required to connect');
      this._notifyHandlers('onError', error);
      return Promise.reject(error);
    }
    
    // Save user ID to use in reconnection
    this._userId = userId;

    // Use the central connection manager to track connection state
    if (connectionManager.connectionAttemptInProgress) {
      console.log('Connection attempt already in progress (tracked by ConnectionManager)');
      return this.reconnectPromise || Promise.resolve(this.connection);
    }
    
    // Use existing connection if it's already connected
    if (this.isConnectionReady()) {
      console.log('Using existing connection');
      
      // Make sure any pending handlers get registered with the existing connection
      this._registerPendingHandlers();
      
      return Promise.resolve(this.connection);
    }

    // Mark that we are connecting
    this._isConnecting = true;
    connectionLogger.info('Starting new connection attempt');
    
    try {
      // Create custom retry policy
      const retryPolicy = this._createRetryPolicy();
      
      // Build the connection - with additional logging for debugging
      console.log('Building SignalR connection to:', HUB_URL);
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token,
          skipNegotiation: false, // Allow negotiation to find best transport
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling // Try WebSockets first, fallback to long polling
        })
        .withAutomaticReconnect(retryPolicy) // Use our custom policy with max attempts
        .configureLogging(signalR.LogLevel.Information)
        .build();
        
      // Set up connection state handlers
      this._setupConnectionHandlers();
      
      // Set up message handlers
      this._setupMessageHandlers();
      
      // Start the connection with timeout - increased timeout for slow networks
      const connectWithTimeout = async (timeoutMs = 20000) => {
        console.log(`Starting connection with ${timeoutMs}ms timeout`);
        const connectPromise = this.connection.start();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
        );
        
        this.reconnectPromise = Promise.race([connectPromise, timeoutPromise]);
        return this.reconnectPromise;
      };
      
      await connectWithTimeout();
      
      // Store the connection ID for later use
      this.connectionId = this.connection.connectionId;
      console.log('Connected to SignalR hub with ID:', this.connectionId);
      
      // Register with the server that this user is online
      try {
        console.log('Registering user connection with server:', userId);
        await this.connection.invoke('RegisterConnection', userId);
        console.log('User registered successfully');
      } catch (err) {
        // The backend method might not be implemented yet, handle this gracefully
        console.warn('RegisterConnection method not available on server, continuing without registration', err);
        // Don't fail the connection just because this method isn't available
      }
      
      // Update the connection manager state
      connectionManager.endConnectionAttempt(this.connectionId);
      
      // Register any pending handlers now that connection is established
      console.log('Connection established, registering pending handlers');
      console.log('Pending handlers before registration:', this._pendingHandlers ? [...this._pendingHandlers.keys()] : 'none');
      this._registerPendingHandlers();
      console.log('Pending handlers after registration:', this._pendingHandlers ? [...this._pendingHandlers.keys()] : 'none');
      
      // Notify connection handlers
      this._notifyHandlers('onConnected', { connectionId: this.connectionId });
      
      return this.connection;
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      this._notifyHandlers('onError', error);
      
      // Mark connection attempt as failed in the manager
      connectionManager.endConnectionAttempt(null);
      
      // Clear connection state
      this._isConnecting = false;
      this.reconnectPromise = null;
      
      return Promise.reject(error);
    }
  }

  /**
   * Disconnects from the SignalR hub
   */
  async disconnect() {
    if (!this.connection) {
      return;
    }

    try {
      // Make sure we're not trying to connect at the same time
      this._isConnecting = false;
      this.reconnectPromise = null;
      
      // Use connection manager to track state
      connectionManager.clearConnectionTimeout();
      
      // If connection is already closing or closed, don't try to stop it again
      if (this.connection.state === signalR.HubConnectionState.Disconnected ||
          this.connection.state === signalR.HubConnectionState.Disconnecting) {
        console.log('Connection already disconnected or disconnecting');
        return;
      }
      
      // Add a small timeout to prevent race conditions with reconnect attempts
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await this.connection.stop();
      console.log('Disconnected from SignalR hub');
      this._notifyHandlers('onDisconnected', { reason: 'User disconnected' });
    } catch (error) {
      console.error('Error disconnecting from SignalR hub:', error);
    } finally {
      this.connectionId = null;
      this.connection = null;
      
      // Reset connection manager state to ensure future connection attempts can proceed
      connectionManager.endConnectionAttempt(null);
      
      // Clear any pending handlers on disconnect
      if (this._pendingHandlers) {
        this._pendingHandlers.clear();
      }
    }
  }

  /**
   * Send a message to a specified user
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Recipient user ID
   * @param {string} message - Message content
   * @returns {Promise<string>} - Promise that resolves to message ID
   */
  async sendMessage(senderId, receiverId, message) {
    try {
      // Add safety checks to prevent parameter order issues
      if (typeof message !== 'string') {
        console.error('Message must be a string but received:', typeof message, message);
        throw new Error('Invalid message format: Message must be a string');
      }
      
      // Check for potential parameter order issues - message content shouldn't look like an ID
      if (message && (message.length === 24 || message.length === 36) && 
          (message.includes('-') || /^[0-9a-f]+$/i.test(message))) {
        console.warn('Warning: Message content appears to be an ID. Check parameter order!', {
          messageContent: message,
          senderId,
          receiverId
        });
      }
      
      // First try through SignalR if connected
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Use IDs directly without validation
          const validSenderId = senderId ? String(senderId).trim() : senderId;
          const validReceiverId = receiverId ? String(receiverId).trim() : receiverId;
          
          console.log('Sending message via SignalR:', {
            senderId: validSenderId,
            receiverId: validReceiverId,
            messagePreview: message?.length > 20 ? message.substring(0, 20) + '...' : message
          });
          
          // Call the SendMessage method on the hub with validated IDs
          const messageId = await this.connection.invoke('SendMessage', validSenderId, validReceiverId, message);
          
          // Invalidate cache for this conversation to ensure fresh data on next fetch
          this.invalidateConversationCache(validSenderId, validReceiverId);
          
          return messageId;
        } catch (signalRError) {
          console.warn('SignalR message send failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API
      const axios = (await import('axios')).default;
      const timestamp = new Date().toISOString();
      
      // Validate and sanitize input parameters before sending
      if (!senderId) {
        console.error('Missing senderId in sendMessage call');
        throw new Error('SenderId is required for sending messages');
      }
      
      if (!receiverId) {
        console.error('Missing receiverId in sendMessage call');
        throw new Error('ReceiverId is required for sending messages');
      }
      
      if (!message) {
        console.error('Missing message content in sendMessage call');
        throw new Error('Message content is required for sending messages');
      }
      
      // Based on the error response, we know the API is expecting PascalCase property names
      // and MongoDB ObjectId format (24 character hex string)
      try {
        console.log('Sending message with corrected format');
        
        // Use IDs directly without validation
        const senderIdStr = senderId ? String(senderId).trim() : senderId;
        const receiverIdStr = receiverId ? String(receiverId).trim() : receiverId;
        
        // Log details for debugging
        console.log('Sending message with validated IDs:', {
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          messagePreview: message?.length > 20 ? message.substring(0, 20) + '...' : message
        });
        
        // Log the full payload for debugging
        console.log('Message payload:', {
          SenderId: senderIdStr,
          ReceiverId: receiverIdStr,
          MessageLength: message?.length || 0
        });
        
        // Create payload with MongoDB-compatible IDs
        const payload = {
          // PascalCase (C# standard)
          SenderId: senderIdStr,
          ReceiverId: receiverIdStr,
          Message: message,
          Timestamp: timestamp,
          
          // camelCase (JavaScript standard)
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          message: message,
          timestamp: timestamp
        };
        
        const response = await axios.post(`${API_BASE_URL}/api/Chat/send`, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Invalidate cache for this conversation to ensure fresh data on next fetch
        this.invalidateConversationCache(senderIdStr, receiverIdStr);
        
        return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
      } catch (error) {
        // If that fails, let's try one more time with query parameters instead
        try {
          console.log('Attempting to send message via query parameters');
          
          // Ensure IDs are valid before attempting to send
          if (!senderId || !receiverId) {
            throw new Error('SenderId and ReceiverId must be provided - cannot send message with missing IDs');
          }
          
          // Use IDs directly without validation
          const validSenderId = senderId ? String(senderId).trim() : senderId;
          const validReceiverId = receiverId ? String(receiverId).trim() : receiverId;
          
          // Include both camelCase and PascalCase in one payload
          const messageBody = {
            // Include both casing standards
            Message: message,
            message: message,
            // Add other required fields in both formats with validated IDs
            SenderId: validSenderId,
            senderId: validSenderId,
            ReceiverId: validReceiverId,
            receiverId: validReceiverId,
            Timestamp: timestamp,
            timestamp: timestamp
          };
          
          const response = await axios.post(
            `${API_BASE_URL}/api/Chat/send?senderId=${encodeURIComponent(validSenderId)}&receiverId=${encodeURIComponent(validReceiverId)}`,
            messageBody,
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
        } catch (finalError) {
          console.error('All message sending attempts failed:', finalError);
          // Log the specific error details for better debugging
          if (finalError.response) {
            console.error('Server response:', {
              status: finalError.response.status,
              data: finalError.response.data
            });
          }
          throw finalError;
        }
      }
    } catch (error) {
      // Add more detailed error information for debugging
      console.error('Error sending message:', error);
      
      // Log more details about the error response if available
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // If we have validation errors, log them in a more readable format
        if (error.response.data?.errors) {
          Object.entries(error.response.data.errors).forEach(([field, errors]) => {
            console.error(`Validation error in field '${field}':`, errors);
          });
        }
      }
      
      this._notifyHandlers('onError', error);
      throw error;
    }
  }

  /**
   * Get message history between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {number} skip - Number of messages to skip (for pagination)
   * @param {number} take - Number of messages to take (for pagination)
   * @returns {Promise<Array>} - Promise that resolves to an array of message objects
   */
  async getMessageHistory(user1Id, user2Id, skip = 0, take = 50) {
    try {
      // Validate inputs
      if (!user1Id || !user2Id) {
        console.warn('Missing user IDs for message history:', { user1Id, user2Id });
        return [];
      }
      
      // Use IDs directly without validation
      const validUser1Id = user1Id ? String(user1Id).trim() : user1Id;
      const validUser2Id = user2Id ? String(user2Id).trim() : user2Id;
      
      // Generate a cache key for this conversation
      const cacheKey = this._getCacheKey(validUser1Id, validUser2Id);
      
      // Clean cache occasionally
      this._cleanupCache();
      
      // Check if we have cached data
      if (this._messageCache.has(cacheKey)) {
        const cachedEntry = this._messageCache.get(cacheKey);
        console.log('Returning cached message history for', cacheKey);
        
        // Return cached messages, applying skip and take
        return cachedEntry.messages.slice(skip, skip + take);
      }
      
      // Always try to get history through REST API first, regardless of connection state
      // This ensures we can get message history even if SignalR connection isn't established
      try {
        const axios = (await import('axios')).default;
        console.log('Fetching message history via REST API for:', { user1Id, user2Id });
        const response = await axios.get(`${API_BASE_URL}/api/Chat/history?user1=${validUser1Id}&user2=${validUser2Id}&skip=${skip}&take=${take}`);
        
        // Safety check - ensure response.data is an array
        const messages = Array.isArray(response.data) ? response.data : [];
        
        // Cache the retrieved message history if we got any messages
        if (messages.length > 0) {
          console.log(`Caching ${messages.length} messages from REST API for conversation`, cacheKey);
          this._messageCache.set(cacheKey, { messages, timestamp: Date.now() });
          return messages;
        } else {
          console.log('No messages returned from REST API');
        }
      } catch (restError) {
        console.warn('REST API message history failed:', restError);
        // Continue to SignalR fallback if available
      }
      
      // Then try to get history through SignalR if connected
      if (this.isConnectionReady()) {
        try {
          console.log('Fetching message history via SignalR for:', { user1Id, user2Id });
          // Call the GetMessageHistory method on the hub with validated IDs
          const messages = await this.connection.invoke('GetMessageHistory', validUser1Id, validUser2Id, skip, take);
          
          // Safety check - ensure messages is an array
          const messageArray = Array.isArray(messages) ? messages : [];
          
          // Cache the message history
          this._messageCache.set(cacheKey, { messages: messageArray, timestamp: Date.now() });
          console.log(`Cached ${messageArray.length} messages for conversation`, cacheKey);
          
          return messageArray;
        } catch (signalRError) {
          console.warn('SignalR message history failed:', signalRError);
          // Continue to return empty array
        }
      } else {
        console.log('SignalR not connected, can\'t fetch message history via SignalR');
      }

      // If we have pending handlers, try to force register them
      // This could help with future SignalR calls
      if (this._pendingHandlers && this._pendingHandlers.size > 0) {
        console.log('Attempting to force-register pending handlers before giving up');
        try {
          await this.forceRegisterPendingHandlers();
        } catch (err) {
          console.warn('Could not register pending handlers:', err);
        }
      }
      
      // We've already tried both methods above and neither worked
      // Return empty array to avoid UI errors
      console.log('All message history fetch methods failed');
      return [];
    } catch (error) {
      console.error('Error fetching message history:', error);
      
      // Add detailed logging for better debugging
      console.error('Message history fetch failed with details:', {
        user1Id,
        user2Id,
        skip,
        take,
        connectionState: this.connection ? this.connection.state : 'No connection',
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return empty array instead of throwing - this prevents UI errors
      return [];
    }
  }

  /**
   * Invalidate conversation cache between two users to ensure fresh data
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   */
  invalidateConversationCache(user1Id, user2Id) {
    try {
      // Use IDs directly without validation
      const validUser1Id = user1Id ? String(user1Id).trim() : user1Id;
      const validUser2Id = user2Id ? String(user2Id).trim() : user2Id;
      
      // Generate cache key for this conversation
      const cacheKey = this._getCacheKey(validUser1Id, validUser2Id);
      
      // Remove from cache if exists
      if (this._messageCache.has(cacheKey)) {
        console.log(`Invalidating message cache for conversation: ${cacheKey}`);
        this._messageCache.delete(cacheKey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Error invalidating conversation cache:', error);
      return false;
    }
  }

  /**
   * Generates a consistent cache key for a conversation between two users
   * Ensures that the key is the same regardless of the order of the user IDs
   * @param {string} user1Id - The first user ID
   * @param {string} user2Id - The second user ID
   * @returns {string} - A consistent cache key
   */
  _getCacheKey(user1Id, user2Id) {
    // Sort to ensure that user1_user2 and user2_user1 yield the same key
    const orderedIds = [user1Id, user2Id].sort();
    return orderedIds.join('_');
  }

  /**
   * Cleans up expired entries from the message cache
   * @private
   */
  _cleanupCache() {
    // Only perform cleanup occasionally to avoid overhead
    const now = Date.now();
    if (now - this._lastCacheCleanup < 60000) { // Run cleanup at most once per minute
      return;
    }
    
    this._lastCacheCleanup = now;
    
    // Clean up message cache
    for (const [key, entry] of this._messageCache.entries()) {
      if (now - entry.timestamp > MESSAGE_CACHE_TTL) {
        this._messageCache.delete(key);
      }
    }
    
    // Clean up status cache
    for (const [key, entry] of this._statusCache.entries()) {
      if (now - entry.timestamp > 60000) { // Status cache TTL: 1 minute
        this._statusCache.delete(key);
      }
    }
  }

  /**
   * Mark a message as received
   * @param {string} messageId - ID of the message to mark
   */
  async markMessageReceived(messageId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      await this.connection.invoke('MessageReceived', messageId);
    } catch (error) {
      console.error('Error marking message as received:', error);
    }
  }

  /**
   * Mark a message as read
   * @param {string} messageId - ID of the message to mark
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  async markMessageRead(messageId) {
    // If not connected, try to mark as read via REST API
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      try {
        // Fall back to REST API
        const userId = this._userId;
        if (!userId) throw new Error('User ID is required to mark message as read');
        
        const axios = (await import('axios')).default;
        const response = await axios.post(`${API_BASE_URL}/api/chat/mark-read/${messageId}?userId=${userId}`);
        return response.data.success;
      } catch (error) {
        console.error('Error marking message as read via API:', error);
        return false;
      }
    }

    try {
      // Use the ChatHub method to mark as read
      const success = await this.connection.invoke('MarkMessageAsRead', messageId, this._userId);
      return success;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Mark all messages from a sender as read
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Recipient user ID (current user)
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  async markAllMessagesAsRead(senderId, receiverId) {
    // If not connected, try to mark as read via REST API
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      try {
        // Dynamically import axios
        const axios = (await import('axios')).default;
        
        // Use IDs directly without validation
        const validSenderId = senderId ? String(senderId).trim() : senderId;
        const validReceiverId = receiverId ? String(receiverId).trim() : receiverId;
        
        // Fall back to REST API with direct IDs
        const response = await axios.post(`${API_BASE_URL}/api/chat/mark-all-read`, {
          senderId: validSenderId,
          receiverId: validReceiverId
        });
        return response.data.success;
      } catch (error) {
        console.error('Error marking all messages as read via API:', error);
        return false;
      }
    }

    try {
      // Use IDs directly without validation
      const validSenderId = senderId ? String(senderId).trim() : senderId;
      const validReceiverId = receiverId ? String(receiverId).trim() : receiverId;
      
      // Use the ChatHub method to mark all as read with direct IDs
      const success = await this.connection.invoke('MarkAllMessagesAsRead', validSenderId, validReceiverId);
      return success;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }

  /**
   * Get a list of online users
   * @returns {Promise<Array>} - Promise that resolves to array of online user IDs
   */
  async getOnlineUsers() {
    // If not connected or connecting, return empty array
    if (!this.connection) {
      console.warn('Cannot get online users: No connection available');
      return [];
    }
    
    // If in connecting or reconnecting state, don't try to invoke methods
    if (this.connection.state === signalR.HubConnectionState.Connecting || 
        this.connection.state === signalR.HubConnectionState.Reconnecting) {
      console.warn('Cannot get online users: Connection is in transition state:', this.connection.state);
      return [];
    }

    // Only invoke if in connected state
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        // Add timeout to prevent this call from hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GetOnlineUsers timed out')), 5000)
        );
        
        // Race the actual call against the timeout
        const onlineUsers = await Promise.race([
          this.connection.invoke('GetOnlineUsers'),
          timeoutPromise
        ]);
        
        // Ensure we return an array even if null/undefined is returned from the server
        return Array.isArray(onlineUsers) ? onlineUsers : [];
      } catch (error) {
        // For "no chat history" error, log but don't treat as critical
        if (error.message?.includes('No chat history')) {
          console.log('No chat history available yet');
        } else {
          console.log('No online users found or error getting online users:', error.message);
        }
        // Return empty array on error instead of throwing
        return [];
      }
    }
    
    // Default return empty array for any other state
    return [];
  }

  /**
   * Check if a specific user is online
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} - Promise that resolves to boolean indicating online status
   */
  async isUserOnline(userId) {
    // Use ID directly without validation
    const validUserId = userId ? String(userId).trim() : userId;
    
    // If not connected or connecting, return false
    if (!this.connection) {
      console.warn('Cannot check user status: No connection available');
      return false;
    }
    
    // If in connecting or reconnecting state, don't try to invoke methods
    if (this.connection.state === signalR.HubConnectionState.Connecting || 
        this.connection.state === signalR.HubConnectionState.Reconnecting) {
      console.warn('Cannot check user status: Connection is in transition state:', this.connection.state);
      return false;
    }
    
    // Only invoke if in connected state
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        // Check cache first
        if (this._statusCache.has(validUserId)) {
          const cachedStatus = this._statusCache.get(validUserId);
          console.log('Returning cached status for', validUserId);
          return cachedStatus.status;
        }
        
        // Try first with GetOnlineStatus method with validated ID
        const isOnline = await this.connection.invoke('GetOnlineStatus', validUserId);
        
        // Cache the result
        this._statusCache.set(validUserId, { status: isOnline, timestamp: Date.now() });
        console.log('Cached online status for', validUserId);
        
        return isOnline;
      } catch (firstError) {
        try {
          // If that fails, try with IsUserOnline (method name difference between backend and frontend)
          const isOnline = await this.connection.invoke('IsUserOnline', validUserId);
          
          // Cache the result
          this._statusCache.set(validUserId, { status: isOnline, timestamp: Date.now() });
          console.log('Cached online status (fallback) for', validUserId);
          
          return isOnline;
        } catch (secondError) {
          // Log but don't throw an error
          console.warn('Error checking user status, assuming offline:', firstError);
          return false;
        }
      }
    }
    
    // Default return false for any other state
    return false;
  }

  /**
   * Register event handlers for either service events or SignalR events
   * @param {string} event - Event name 
   * @param {function} handler - Function to call when event occurs
   * @returns {function|undefined} - Function to call to unregister handler (only for service events)
   */
  on(event, handler) {
    // Handle internal service events (onConnected, onDisconnected, etc.)
    if (this.eventHandlers && this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
      
      // Return a function to unregister this handler
      return () => {
        this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
      };
    }
    
    // Store pending handlers for SignalR events that will be registered once connection is established
    // This solves the "Cannot register handler" errors when trying to register before connection is ready
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      // Initialize pending handlers structure if it doesn't exist
      this._pendingHandlers = this._pendingHandlers || new Map();
      
      // Get or create array of handlers for this event
      if (!this._pendingHandlers.has(event)) {
        this._pendingHandlers.set(event, []);
      }
      
      // Add this handler to pending list
      this._pendingHandlers.get(event).push(handler);
      console.log(`Handler for ${event} queued - will be registered when connection is established`);
      
      // Return function to remove from pending handlers
      return () => {
        if (this._pendingHandlers && this._pendingHandlers.has(event)) {
          this._pendingHandlers.set(
            event,
            this._pendingHandlers.get(event).filter(h => h !== handler)
          );
        }
      };
    }
    
    // If connection exists and is in Connected state, register directly
    console.log(`Registering handler for ${event} directly as connection is established`);
    this.connection.on(event, handler);
    return () => {
      if (this.connection) {
        this.connection.off(event, handler);
      }
    };
  }
  
  /**
   * Remove an event handler for a specific SignalR event
   * @param {string} eventName - The name of the event to stop listening for
   * @param {Function} callback - The function to remove
   */
  off(eventName, callback) {
    if (!this.connection) {
      return;
    }
    
    this.connection.off(eventName, callback);
  }
  
  /**
   * Set up connection state change handlers
   * @private
   */
  _setupConnectionHandlers() {
    // Handle reconnecting
    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
      this._notifyHandlers('onReconnecting', { error });
    });

    // Handle reconnected
    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.connectionId = connectionId;
      
      // Re-register user
      if (this._userId) {
        this.connection.invoke('RegisterConnection', this._userId)
          .catch(error => {
            // The backend method might not be implemented yet, handle this gracefully
            console.warn('RegisterConnection method not available on server during reconnect, continuing without registration', error);
            // Don't fail the reconnection just because this method isn't available
          });
      }
      
      // Re-register any pending handlers that were queued during reconnection
      this._registerPendingHandlers();
      
      this._notifyHandlers('onReconnected', { connectionId });
    });

    // Handle disconnect
    this.connection.onclose((error) => {
      console.log('SignalR connection closed');
      if (error) {
        console.error('Connection closed with error:', error);
        this._notifyHandlers('onError', error);
      }
      
      // Reset connection manager state to ensure future connection attempts can proceed
      connectionManager.endConnectionAttempt(null);
      
      this._notifyHandlers('onDisconnected', { error });
    });
  }

  /**
   * Set up message handlers for SignalR hub
   * @private
   */
  _setupMessageHandlers() {
    if (!this.connection) return;

    // Handle received messages
    this.connection.on('ReceiveMessage', (senderId, message, messageId, status) => {
      // Invalidate the cache for this conversation to ensure fresh data on next fetch
      if (this._userId) {
        this.invalidateConversationCache(senderId, this._userId);
      }
      
      // Notify message handlers
      this._notifyHandlers('onMessage', { senderId, message, messageId, status });
    });

    // Handle message status changes (read/delivered)
    this.connection.on('MessageRead', (messageId, timestamp, userId, recipientId) => {
      // If user IDs are provided, invalidate the conversation cache
      if (userId && recipientId) {
        this.invalidateConversationCache(userId, recipientId);
      }
      
      this._notifyHandlers('onMessageRead', { messageId, timestamp, status: 'read', userId, recipientId });
    });

    this.connection.on('MessageDelivered', (messageId, timestamp, userId, recipientId) => {
      // If user IDs are provided, invalidate the conversation cache
      if (userId && recipientId) {
        this.invalidateConversationCache(userId, recipientId);
      }
      
      this._notifyHandlers('onMessageDelivered', { messageId, timestamp, status: 'delivered', userId, recipientId });
    });

    // Handle deleted messages
    this.connection.on('MessageDeleted', (messageId, userId, recipientId) => {
      // If user IDs are provided, invalidate the conversation cache
      if (userId && recipientId) {
        this.invalidateConversationCache(userId, recipientId);
      }
      
      this._notifyHandlers('onMessageDeleted', { messageId, userId, recipientId });
    });

    // Handle user status change notifications
    this.connection.on('UserStatusChanged', (userId, status) => {
      this._notifyHandlers('onUserStatusChanged', { userId, status });
    });

    // Handle all messages read notifications
    this.connection.on('AllMessagesRead', (userId, timestamp) => {
      this._notifyHandlers('onAllMessagesRead', { userId, timestamp });
    });
  }

  /**
   * Notify all registered handlers for a specific event
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @private
   */
  _notifyHandlers(event, data) {
    if (!this.eventHandlers[event]) {
      return;
    }
    
    this.eventHandlers[event].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * Get the current connection state
   * @returns {string} - Connection state as a string
   */
  getConnectionState() {
    if (!this.connection) {
      return 'Disconnected';
    }
    
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'Connected';
      case signalR.HubConnectionState.Disconnected:
        return 'Disconnected';
      case signalR.HubConnectionState.Connecting:
        return 'Connecting';
      case signalR.HubConnectionState.Reconnecting:
        return 'Reconnecting';
      case signalR.HubConnectionState.Disconnecting:
        return 'Disconnecting';
      default:
        return 'Unknown';
    }
  }

  /**
   * Creates an automatic reconnect policy with maximum attempts
   * @returns {signalR.IRetryPolicy} - The retry policy
   * @private
   */
  _createRetryPolicy() {
    let retryCount = 0;
    const MAX_RETRY_ATTEMPTS = 5;
    
    return {
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Don't retry if we've reached the limit
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          console.log(`[SignalR] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached, stopping reconnection`);
          // Return null to stop retry
          return null;
        }
        
        // Count retry attempts
        retryCount++;
        
        // Use exponential backoff with jitter
        let delay = 1000 * Math.pow(2, retryCount); // 2, 4, 8, 16, 32 seconds
        
        // Add some randomness to prevent all clients from retrying at the exact same time
        delay += Math.random() * 1000;
        
        // Cap at 30 seconds
        delay = Math.min(delay, 30000);
        
        console.log(`[SignalR] Retry attempt ${retryCount}/${MAX_RETRY_ATTEMPTS} in ${Math.round(delay / 1000)}s`);
        return delay;
      }
    };
  }

  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} - Promise that resolves to an array of conversation objects
   */
  async getAllConversations() {
    const userId = this._userId;
    if (!userId) {
      console.warn('Cannot get conversations: No user ID available');
      return [];
    }

    try {
      // First try to get conversations through SignalR if connected
      if (this.isConnectionReady()) {
        try {
          console.log('Fetching all conversations via SignalR');
          const conversations = await this.connection.invoke('GetUserConversations', userId);
          return Array.isArray(conversations) ? conversations : [];
        } catch (signalRError) {
          console.warn('SignalR conversations fetch failed, falling back to REST API:', signalRError);
        }
      }
      
      // Fallback to REST API
      const axios = (await import('axios')).default;
      console.log('Fetching all conversations via REST API');
      const response = await axios.get(`${API_BASE_URL}/api/Chat/conversations/${userId}`);
      
      // Return conversations (ensure we always return an array)
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // Add detailed logging for better debugging
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return empty array instead of throwing - this prevents UI errors
      return [];
    }
  }
}

// Create a singleton instance
const chatService = new SignalRChatService();

export default chatService;

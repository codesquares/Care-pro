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
const MESSAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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
   * Attempts to convert a UUID to a MongoDB-compatible ObjectId
   * This is a best-effort approach - in production, proper ID mapping should be used
   * @param {string} id - The ID to convert
   * @returns {string} - A MongoDB-compatible ID (24 hex chars)
   */
  convertToMongoId(id) {
    if (!id) return null;
    
    // If it's already a valid MongoDB ID, return as is
    if (this.isValidMongoId(id)) return id;
    
    // Remove dashes and any non-hex characters
    const cleanId = id.replace(/[^0-9a-f]/gi, '');
    
    // If after cleaning we have a 24-character hex string, return it
    if (cleanId.length === 24) return cleanId;
    
    // If it's longer, truncate to 24 characters
    if (cleanId.length > 24) return cleanId.substring(0, 24);
    
    // If it's shorter, pad with zeros to reach 24 characters
    if (cleanId.length < 24) {
      return cleanId.padEnd(24, '0');
    }
    
    // Fallback - return a placeholder ObjectId for development/testing
    // In production, this should be handled more robustly
    return '000000000000000000000000';
  }

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
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('Using existing connection');
      return Promise.resolve(this.connection);
    }

    // Mark that we are connecting
    this._isConnecting = true;
    
    try {
      // Create custom retry policy
      const retryPolicy = this._createRetryPolicy();
      
      // Build the connection
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
      
      // Start the connection with timeout
      const connectWithTimeout = async (timeoutMs = 15000) => {
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
      console.log('Connected to SignalR hub', this.connectionId);
      
      // Register with the server that this user is online
      try {
        await this.connection.invoke('RegisterConnection', userId);
      } catch (err) {
        // The backend method might not be implemented yet, handle this gracefully
        console.warn('RegisterConnection method not available on server, continuing without registration', err);
        // Don't fail the connection just because this method isn't available
      }
      
      // Update the connection manager state
      connectionManager.endConnectionAttempt(this.connectionId);
      
      // Notify connection handlers
      this._notifyHandlers('onConnected', { connectionId: this.connectionId });
      
      return this.connection;
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      this._notifyHandlers('onError', error);
      
      // Mark connection attempt as failed in the manager
      connectionManager.endConnectionAttempt(null);
      
      throw error;
    } finally {
      this._isConnecting = false;
      this.reconnectPromise = null;
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
      // First try through SignalR if connected
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Convert IDs to MongoDB format for SignalR too
          const mongoSenderId = this.convertToMongoId(String(senderId || '').trim());
          const mongoReceiverId = this.convertToMongoId(String(receiverId || '').trim());
          
          // Call the SendMessage method on the hub with MongoDB-compatible IDs
          const messageId = await this.connection.invoke('SendMessage', mongoSenderId, mongoReceiverId, message);
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
        
        // Convert IDs to MongoDB-compatible format using our utility methods
        const senderIdStr = this.convertToMongoId(String(senderId || '').trim());
        const receiverIdStr = this.convertToMongoId(String(receiverId || '').trim());
        
        // Additional validation before sending to backend
        if (!senderIdStr) {
          throw new Error('SenderId cannot be empty');
        }
        
        if (!receiverIdStr) {
          throw new Error('ReceiverId cannot be empty');
        }
        
        // Log ID conversion results for debugging
        console.log('ID conversion results:', {
          originalSenderId: senderId,
          originalReceiverId: receiverId,
          convertedSenderId: senderIdStr,
          convertedReceiverId: receiverIdStr,
          senderIdValid: this.isValidMongoId(senderIdStr),
          receiverIdValid: this.isValidMongoId(receiverIdStr)
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
        
        return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
      } catch (error) {
        // If that fails, let's try one more time with query parameters instead
        try {
          console.log('Attempting to send message via query parameters');
          
          // Ensure IDs are valid before attempting to send
          if (!senderId || !receiverId) {
            throw new Error('SenderId and ReceiverId must be provided - cannot send message with missing IDs');
          }
          
          // Convert IDs to MongoDB format for the fallback attempt too
          const mongoSenderId = this.convertToMongoId(String(senderId || '').trim());
          const mongoReceiverId = this.convertToMongoId(String(receiverId || '').trim());
          
          // Include both camelCase and PascalCase in one payload
          const messageBody = {
            // Include both casing standards
            Message: message,
            message: message,
            // Add other required fields in both formats with MongoDB-compatible IDs
            SenderId: mongoSenderId,
            senderId: mongoSenderId,
            ReceiverId: mongoReceiverId,
            receiverId: mongoReceiverId,
            Timestamp: timestamp,
            timestamp: timestamp
          };
          
          const response = await axios.post(
            `${API_BASE_URL}/api/Chat/send?senderId=${encodeURIComponent(mongoSenderId)}&receiverId=${encodeURIComponent(mongoReceiverId)}`,
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
      // Convert IDs to MongoDB compatible format
      const mongoUser1Id = this.convertToMongoId(String(user1Id || '').trim());
      const mongoUser2Id = this.convertToMongoId(String(user2Id || '').trim());
      
      // Generate a cache key for this conversation
      const cacheKey = this._getCacheKey(mongoUser1Id, mongoUser2Id);
      
      // Check if we have cached data
      if (this._messageCache.has(cacheKey)) {
        const cachedEntry = this._messageCache.get(cacheKey);
        console.log('Returning cached message history for', cacheKey);
        
        // Return cached messages, applying skip and take
        return cachedEntry.messages.slice(skip, skip + take);
      }
      
      // First try to get history through SignalR if connected
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Call the GetMessageHistory method on the hub with MongoDB compatible IDs
          const messages = await this.connection.invoke('GetMessageHistory', mongoUser1Id, mongoUser2Id, skip, take);
          
          // Cache the message history
          this._messageCache.set(cacheKey, { messages, timestamp: Date.now() });
          console.log('Cached new message history for', cacheKey);
          
          return messages;
        } catch (signalRError) {
          console.warn('SignalR message history failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API with MongoDB compatible IDs
      const axios = (await import('axios')).default;
      const response = await axios.get(`${API_BASE_URL}/api/chat/history?user1Id=${mongoUser1Id}&user2Id=${mongoUser2Id}&skip=${skip}&take=${take}`);
      
      // Cache the retrieved message history
      this._messageCache.set(cacheKey, { messages: response.data, timestamp: Date.now() });
      console.log('Cached message history from REST API for', cacheKey);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching message history:', error);
      this._notifyHandlers('onError', error);
      throw error;
    } finally {
      // Clean up cache regularly
      this._cleanupCache();
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
        // Convert IDs to MongoDB compatible format
        const mongoSenderId = this.convertToMongoId(String(senderId || '').trim());
        const mongoReceiverId = this.convertToMongoId(String(receiverId || '').trim());
        
        // Fall back to REST API with MongoDB compatible IDs
        const response = await axios.post(`${API_BASE_URL}/api/chat/mark-all-read`, {
          senderId: mongoSenderId,
          receiverId: mongoReceiverId
        });
        return response.data.success;
      } catch (error) {
        console.error('Error marking all messages as read via API:', error);
        return false;
      }
    }

    try {
      // Convert IDs to MongoDB compatible format
      const mongoSenderId = this.convertToMongoId(String(senderId || '').trim());
      const mongoReceiverId = this.convertToMongoId(String(receiverId || '').trim());
      
      // Use the ChatHub method to mark all as read with MongoDB compatible IDs
      const success = await this.connection.invoke('MarkAllMessagesAsRead', mongoSenderId, mongoReceiverId);
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
    // Convert userId to MongoDB compatible format
    const mongoUserId = this.convertToMongoId(String(userId || '').trim());
    
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
        if (this._statusCache.has(mongoUserId)) {
          const cachedStatus = this._statusCache.get(mongoUserId);
          console.log('Returning cached status for', mongoUserId);
          return cachedStatus.status;
        }
        
        // Try first with GetOnlineStatus method with MongoDB compatible ID
        const isOnline = await this.connection.invoke('GetOnlineStatus', mongoUserId);
        
        // Cache the result
        this._statusCache.set(mongoUserId, { status: isOnline, timestamp: Date.now() });
        console.log('Cached online status for', mongoUserId);
        
        return isOnline;
      } catch (firstError) {
        try {
          // If that fails, try with IsUserOnline (method name difference between backend and frontend)
          const isOnline = await this.connection.invoke('IsUserOnline', mongoUserId);
          
          // Cache the result
          this._statusCache.set(mongoUserId, { status: isOnline, timestamp: Date.now() });
          console.log('Cached online status (fallback) for', mongoUserId);
          
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
    
    // Handle SignalR connection events
    if (this.connection) {
      this.connection.on(event, handler);
      return;
    } else {
      console.warn(`Cannot register handler for ${event}: No connection available`);
      return;
    }
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
      
      this._notifyHandlers('onReconnected', { connectionId });
    });

    // Handle disconnect
    this.connection.onclose((error) => {
      console.log('SignalR connection closed');
      if (error) {
        console.error('Connection closed with error:', error);
        this._notifyHandlers('onError', error);
      }
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
      this._notifyHandlers('onMessage', { senderId, message, messageId, status });
    });

    // Handle message status changes (read/delivered)
    this.connection.on('MessageRead', (messageId, timestamp) => {
      this._notifyHandlers('onMessageRead', { messageId, timestamp, status: 'read' });
    });

    this.connection.on('MessageDelivered', (messageId, timestamp) => {
      this._notifyHandlers('onMessageDelivered', { messageId, timestamp, status: 'delivered' });
    });

    // Handle deleted messages
    this.connection.on('MessageDeleted', (messageId) => {
      this._notifyHandlers('onMessageDeleted', { messageId });
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
   * Delete a message
   * @param {string} messageId - ID of the message to delete
   * @param {string} userId - ID of the user requesting deletion (must be sender)
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  async deleteMessage(messageId, userId) {
    try {
      // Convert userId to MongoDB compatible format
      const mongoUserId = this.convertToMongoId(String(userId || '').trim());
      
      // First try through SignalR if connected
      if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Call the DeleteMessage method on the hub with MongoDB compatible ID
          const success = await this.connection.invoke('DeleteMessage', messageId, mongoUserId);
          return success;
        } catch (signalRError) {
          console.warn('SignalR message deletion failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API with MongoDB compatible ID
      const axios = (await import('axios')).default;
      const response = await axios.delete(`${API_BASE_URL}/api/chat/delete/${messageId}?userId=${mongoUserId}`);
      
      return response.data.success || false;
    } catch (error) {
      console.error('Error deleting message:', error);
      this._notifyHandlers('onError', error);
      throw error;
    }
  }

  /**
   * Mark a message as delivered (but not read)
   * @param {string} messageId - ID of the message to mark
   * @param {string} userId - ID of the current user (receiver)
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  async markMessageAsDelivered(messageId, userId) {
    // If not connected, try to mark as delivered via REST API
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      try {
        // Fall back to REST API if available
        const response = await axios.post(`${API_BASE_URL}/api/chat/mark-delivered/${messageId}?userId=${userId}`);
        return response.data.success;
      } catch (error) {
        console.error('Error marking message as delivered via API:', error);
        return false;
      }
    }

    try {
      // Use the ChatHub method to mark as delivered
      const success = await this.connection.invoke('MarkMessageAsDelivered', messageId, userId);
      return success;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      return false;
    }
  }
}

// Create a singleton instance
const chatService = new SignalRChatService();

export default chatService;

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
          // Call the SendMessage method on the hub
          const messageId = await this.connection.invoke('SendMessage', senderId, receiverId, message);
          return messageId;
        } catch (signalRError) {
          console.warn('SignalR message send failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API_BASE_URL}/api/chat/send`, {
        senderId,
        receiverId,
        message,
        timestamp: new Date().toISOString()
      });
      
      return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
    } catch (error) {
      console.error('Error sending message:', error);
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
      // Generate a cache key for this conversation
      const cacheKey = this._getCacheKey(user1Id, user2Id);
      
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
          // Call the GetMessageHistory method on the hub
          const messages = await this.connection.invoke('GetMessageHistory', user1Id, user2Id, skip, take);
          
          // Cache the message history
          this._messageCache.set(cacheKey, { messages, timestamp: Date.now() });
          console.log('Cached new message history for', cacheKey);
          
          return messages;
        } catch (signalRError) {
          console.warn('SignalR message history failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      }
      
      // Fallback to REST API
      const axios = (await import('axios')).default;
      const response = await axios.get(`${API_BASE_URL}/api/chat/history?user1Id=${user1Id}&user2Id=${user2Id}&skip=${skip}&take=${take}`);
      
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
   */
  async markMessageRead(messageId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      await this.connection.invoke('MessageRead', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
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
        if (this._statusCache.has(userId)) {
          const cachedStatus = this._statusCache.get(userId);
          console.log('Returning cached status for', userId);
          return cachedStatus.status;
        }
        
        // Try first with GetOnlineStatus method
        const isOnline = await this.connection.invoke('GetOnlineStatus', userId);
        
        // Cache the result
        this._statusCache.set(userId, { status: isOnline, timestamp: Date.now() });
        console.log('Cached online status for', userId);
        
        return isOnline;
      } catch (firstError) {
        try {
          // If that fails, try with IsUserOnline (method name difference between backend and frontend)
          const isOnline = await this.connection.invoke('IsUserOnline', userId);
          
          // Cache the result
          this._statusCache.set(userId, { status: isOnline, timestamp: Date.now() });
          console.log('Cached online status (fallback) for', userId);
          
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
   * Register event handlers for different connection events
   * @param {string} event - Event name (onConnected, onDisconnected, onMessage, etc.)
   * @param {function} handler - Function to call when event occurs
   * @returns {function} - Function to call to unregister handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      throw new Error(`Unknown event: ${event}`);
    }
    
    this.eventHandlers[event].push(handler);
    
    // Return a function to unregister this handler
    return () => {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    };
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
   * Set up message handlers for server-sent messages
   * @private
   */
  _setupMessageHandlers() {
    // Handle incoming messages
    this.connection.on('ReceiveMessage', (senderId, message, messageId, status) => {
      console.log(`New message from ${senderId}:`, message);
      const messageData = {
        senderId,
        message,
        messageId,
        status,
        received: new Date().toISOString()
      };
      
      // Mark message as received
      this.markMessageReceived(messageId)
        .catch(error => console.error('Error marking message as received:', error));
      
      this._notifyHandlers('onMessage', messageData);
    });

    // Handle user status changes
    this.connection.on('UserStatusChanged', (userId, status) => {
      console.log(`User ${userId} status changed to ${status}`);
      this._notifyHandlers('onUserStatusChanged', { userId, status });
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
}

// Create a singleton instance
const chatService = new SignalRChatService();

export default chatService;

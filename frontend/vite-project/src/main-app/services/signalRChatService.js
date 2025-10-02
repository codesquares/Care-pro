import * as signalR from '@microsoft/signalr';
import { connectionLogger } from '../utils/chatLogger';
import connectionManager from './connectionManager';
import signalRConnectionHelper from '../utils/signalRConnectionHelper';
import messageReliabilityHelper from '../utils/messageReliabilityHelper';

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
    this._connectionHealthInterval = null;
    this._lastHeartbeat = null;
    this._pendingHandlers = new Map(); // Store handlers registered before connection
    
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
   * Check if the SignalR connection is ready for use
   * @returns {boolean} - Whether the connection is ready
   */
  isConnectionReady() {
    return this.connection && 
           this.connection.state === signalR.HubConnectionState.Connected &&
           !this._isConnecting;
  }

  /**
   * Get the current connection state as a string
   * @returns {string} - Current connection state
   */
  getConnectionState() {
    if (!this.connection) return 'Disconnected';
    
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'Connected';
      case signalR.HubConnectionState.Connecting:
        return 'Connecting';
      case signalR.HubConnectionState.Reconnecting:
        return 'Reconnecting';
      case signalR.HubConnectionState.Disconnecting:
        return 'Disconnecting';
      case signalR.HubConnectionState.Disconnected:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }

  /**
   * Enhanced event handler registration with persistence
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} - Cleanup function to remove the handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      console.warn(`Unknown event: ${event}`);
      return () => {};
    }

    // If connection exists, register immediately
    if (this.connection && this.isConnectionReady()) {
      this._registerHandler(event, handler);
    } else {
      // Store handler for later registration
      if (!this._pendingHandlers.has(event)) {
        this._pendingHandlers.set(event, []);
      }
      this._pendingHandlers.get(event).push(handler);
    }

    // Add to our event handlers array
    this.eventHandlers[event].push(handler);
    
    // Return cleanup function
    return () => {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
      
      // Remove from pending handlers if it exists
      if (this._pendingHandlers.has(event)) {
        const pendingIndex = this._pendingHandlers.get(event).indexOf(handler);
        if (pendingIndex > -1) {
          this._pendingHandlers.get(event).splice(pendingIndex, 1);
        }
      }
    };
  }

  /**
   * Register a single handler with the SignalR connection
   * @private
   */
  _registerHandler(event, handler) {
    if (!this.connection) return;

    const signalREventMap = {
      'onMessage': 'ReceiveMessage',
      'onMessageRead': 'MessageRead',
      'onMessageDelivered': 'MessageDelivered',
      'onMessageDeleted': 'MessageDeleted',
      'onUserStatusChanged': 'UserStatusChanged',
      'onAllMessagesRead': 'AllMessagesRead'
    };

    const signalREvent = signalREventMap[event];
    if (signalREvent) {
      // Wrap handler to match our event data format
      const wrappedHandler = (...args) => {
        switch (event) {
          case 'onMessage':
            handler({ senderId: args[0], message: args[1], messageId: args[2], status: args[3] });
            break;
          case 'onMessageRead':
            handler({ messageId: args[0], timestamp: args[1], userId: args[2], recipientId: args[3] });
            break;
          case 'onMessageDelivered':
            handler({ messageId: args[0], timestamp: args[1], userId: args[2], recipientId: args[3] });
            break;
          case 'onMessageDeleted':
            handler({ messageId: args[0], userId: args[1], recipientId: args[2] });
            break;
          case 'onUserStatusChanged':
            handler({ userId: args[0], status: args[1] });
            break;
          case 'onAllMessagesRead':
            handler({ userId: args[0], timestamp: args[1] });
            break;
          default:
            handler(...args);
        }
      };

      this.connection.on(signalREvent, wrappedHandler);
    }
  }

  /**
   * Register all pending handlers
   * @private
   */
  _registerPendingHandlers() {
    if (!this.connection || !this._pendingHandlers.size) return;

    console.log('Registering pending handlers:', [...this._pendingHandlers.keys()]);
    
    for (const [event, handlers] of this._pendingHandlers.entries()) {
      handlers.forEach(handler => this._registerHandler(event, handler));
    }
    
    // Clear pending handlers after registration
    this._pendingHandlers.clear();
  }

  /**
   * Start connection health monitoring
   * @private
   */
  _startConnectionHealthMonitoring() {
    // Stop any existing monitoring
    this._stopConnectionHealthMonitoring();

    this._lastHeartbeat = Date.now();
    
    // Check connection health every 30 seconds
    this._connectionHealthInterval = setInterval(() => {
      if (!this.connection || !this.isConnectionReady()) {
        console.warn('Connection health check failed - not connected');
        return;
      }
      
      // Don't ping if server is marked as unavailable
      if (this._isServerUnavailable) {
        console.log('Server marked as unavailable, skipping health check');
        return;
      }

      // Send a ping to check if connection is responsive
      this.connection.invoke('Ping').then(() => {
        this._lastHeartbeat = Date.now();
        // Reset failure counter on successful ping
        this._consecutiveFailures = 0;
        this._isServerUnavailable = false;
      }).catch(error => {
        console.warn('Connection ping failed:', error);
        this._consecutiveFailures++;
        
        // Only attempt reconnection if we haven't hit the failure limit
        if (this._consecutiveFailures < this._maxConsecutiveFailures && 
            Date.now() - this._lastHeartbeat > 60000) { // 1 minute without response
          console.warn('Connection appears stale, attempting reconnection');
          this._attemptReconnection();
        } else if (this._consecutiveFailures >= this._maxConsecutiveFailures) {
          console.error('Too many consecutive failures, marking server as unavailable');
          this._isServerUnavailable = true;
          this._stopConnectionHealthMonitoring();
        }
      });
    }, 30000);
  }

  /**
   * Stop connection health monitoring
   * @private
   */
  _stopConnectionHealthMonitoring() {
    if (this._connectionHealthInterval) {
      clearInterval(this._connectionHealthInterval);
      this._connectionHealthInterval = null;
    }
  }

  /**
   * Attempt to reconnect with existing handlers and exponential backoff
   * @private
   */
  async _attemptReconnection() {
    if (this._isConnecting || !this._userId || this._isServerUnavailable) {
      return;
    }
    
    // Prevent too frequent reconnection attempts
    const now = Date.now();
    if (now - this._lastReconnectAttempt < this._minReconnectInterval) {
      console.log('Reconnection attempt too soon, waiting...');
      return;
    }
    
    this._lastReconnectAttempt = now;
    console.log('Attempting to reconnect with exponential backoff...');
    
    try {
      // Store current token
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token available for reconnection');
        return;
      }
      
      // Wait for backoff delay
      if (this._backoffDelay > 1000) {
        console.log(`Waiting ${this._backoffDelay}ms before reconnection attempt`);
        await new Promise(resolve => setTimeout(resolve, this._backoffDelay));
      }

      // Disconnect and reconnect
      await this.disconnect();
      await this.connect(this._userId, token);
      
      // Reset backoff on successful connection
      this._backoffDelay = 1000;
      this._consecutiveFailures = 0;
      this._isServerUnavailable = false;
      console.log('Reconnection successful');
    } catch (error) {
      console.error('Reconnection failed:', error);
      this._consecutiveFailures++;
      
      // Check if it's a 404 error (server unavailable)
      if (error.message?.includes('404') || error.statusCode === 404) {
        console.error('SignalR hub not found (404) - server may be down');
        this._isServerUnavailable = true;
        this._stopConnectionHealthMonitoring();
        return;
      }
      
      // Exponential backoff
      this._backoffDelay = Math.min(this._backoffDelay * 2, this._maxBackoffDelay);
      
      // Stop trying after max consecutive failures
      if (this._consecutiveFailures >= this._maxConsecutiveFailures) {
        console.error('Max reconnection attempts exceeded, marking server as unavailable');
        this._isServerUnavailable = true;
        this._stopConnectionHealthMonitoring();
      }
    }
  }
  
  /**
   * Initializes the connection to the SignalR hub with improved reliability
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

    // Check if we can attempt connection (rate limiting)
    if (!signalRConnectionHelper.canAttemptConnection()) {
      console.log('Connection attempt rate limited');
      return this.reconnectPromise || Promise.resolve(this.connection);
    }

    // Use existing connection if it's already connected
    if (this.isConnectionReady()) {
      console.log('Using existing connection');
      this._registerPendingHandlers();
      return Promise.resolve(this.connection);
    }

    // Prevent duplicate connection attempts
    if (this._isConnecting) {
      console.log('Connection attempt already in progress');
      return this.reconnectPromise || Promise.resolve(this.connection);
    }

    // Mark connection attempt
    this._isConnecting = true;
    signalRConnectionHelper.markConnectionAttempt();
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
      
      // Reset failure tracking on successful connection
      this._consecutiveFailures = 0;
      this._backoffDelay = 1000;
      this._isServerUnavailable = false;
      
      // Update connection state
      this._isConnecting = false;
      signalRConnectionHelper.updateConnectionState('connected');
      
      // Start connection health monitoring
      this._startConnectionHealthMonitoring();
      
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
      
      // Enhanced error handling for specific error types
      this._consecutiveFailures++;
      
      // Check if it's a server availability issue
      if (error.message?.includes('404') || error.statusCode === 404) {
        console.error('SignalR hub endpoint not found (404) - server may be down or endpoint incorrect');
        this._isServerUnavailable = true;
      } else if (error.message?.includes('timeout') || error.message?.includes('Connection timeout')) {
        console.error('Connection timeout - server may be slow or unreachable');
      } else if (error.message?.includes('net::ERR_') || error.message?.includes('NetworkError')) {
        console.error('Network error - check internet connection');
      }
      
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.statusText);
      }
      if (error.request) {
        console.error('Network error details:', error.request);
      }
      
      // Exponential backoff for next attempt
      this._backoffDelay = Math.min(this._backoffDelay * 2, this._maxBackoffDelay);
      
      // Mark connection attempt as failed in the manager
      connectionManager.endConnectionAttempt(null);
      
      // Clear connection state
      this._isConnecting = false;
      this.reconnectPromise = null;
      this.connection = null;
      this.connectionId = null;
      
      // Update helper connection state
      signalRConnectionHelper.updateConnectionState('error');
      
      return Promise.reject(error);
    }
  }

  /**
   * Check if server is available and reset unavailable state if needed
   * @returns {Promise<boolean>} - True if server is available
   */
  async checkServerAvailability() {
    if (!this._isServerUnavailable) {
      return true; // Already considered available
    }
    
    console.log('Checking server availability...');
    
    try {
      // Try a simple HTTP request to the API base to check if server is up
      const response = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        timeout: 5000 // 5 second timeout
      });
      
      if (response.ok || response.status === 404) {
        // Server is responding (404 just means the health endpoint doesn't exist)
        console.log('Server is available, resetting unavailable state');
        this._isServerUnavailable = false;
        this._consecutiveFailures = 0;
        this._backoffDelay = 1000;
        return true;
      }
    } catch (error) {
      console.log('Server still unavailable:', error.message);
    }
    
    return false;
  }
  
  /**
   * Force attempt to reconnect even if server was marked unavailable
   * @returns {Promise<boolean>} - True if reconnection successful
   */
  async forceReconnect() {
    console.log('Force reconnect requested...');
    
    // Check server availability first
    const isAvailable = await this.checkServerAvailability();
    if (!isAvailable) {
      console.log('Server still unavailable, cannot reconnect');
      return false;
    }
    
    // Reset all failure states
    this._isServerUnavailable = false;
    this._consecutiveFailures = 0;
    this._backoffDelay = 1000;
    
    // Attempt reconnection
    try {
      const token = localStorage.getItem('authToken');
      if (token && this._userId) {
        await this.connect(this._userId, token);
        return true;
      }
    } catch (error) {
      console.error('Force reconnect failed:', error);
    }
    
    return false;
  }

  /**
   * Disconnects from the SignalR hub
   */
  async disconnect() {
    if (!this.connection) {
      return;
    }

    try {
      // Stop connection health monitoring
      this._stopConnectionHealthMonitoring();
      
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
      this._isConnecting = false;
      
      // Update helper connection state
      signalRConnectionHelper.updateConnectionState('disconnected');
      
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
      
      console.log('🚀 SIGNALR SERVICE: sendMessage called with:', {
        senderId,
        receiverId,
        messagePreview: message?.substring(0, 50) + '...',
        connectionState: this.connection?.state || 'No connection',
        connectionId: this.connectionId
      });
      
      // First try through SignalR if connected and ready
      if (this.isConnectionReady() && this.connection.state === signalR.HubConnectionState.Connected) {
        try {
          // Use IDs directly without validation
          const validSenderId = senderId ? String(senderId).trim() : senderId;
          const validReceiverId = receiverId ? String(receiverId).trim() : receiverId;
          
          console.log('🚀 SIGNALR SERVICE: Sending message via SignalR:', {
            senderId: validSenderId,
            receiverId: validReceiverId,
            messagePreview: message?.length > 20 ? message.substring(0, 20) + '...' : message,
            connectionState: this.connection.state
          });
          
          // Add timeout to prevent hanging
          const sendPromise = this.connection.invoke('SendMessage', validSenderId, validReceiverId, message);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignalR send timeout')), 10000)
          );
          
          const messageId = await Promise.race([sendPromise, timeoutPromise]);
          
          console.log('🚀 SIGNALR SERVICE: Message sent successfully via SignalR, received messageId:', messageId);
          
          // Invalidate cache for this conversation to ensure fresh data on next fetch
          this.invalidateConversationCache(validSenderId, validReceiverId);
          
          return messageId;
        } catch (signalRError) {
          console.warn('🚨 SIGNALR SERVICE: SignalR message send failed, falling back to REST API:', signalRError);
          // Continue to REST API fallback
        }
      } else {
        console.log('� SIGNALR SERVICE: SignalR not ready, using REST API directly');
        console.warn('🚨 SIGNALR SERVICE: Connection details:', {
          hasConnection: !!this.connection,
          connectionState: this.connection?.state || 'No connection',
          connectionId: this.connectionId
        });
      }
      
      // Fallback to REST API
      const axios = (await import('axios')).default;
      const timestamp = new Date().toISOString();
      
      console.log('🚀 SIGNALR SERVICE: Using REST API fallback for message sending');
      
      // Validate and sanitize input parameters before sending
      if (!senderId) {
        console.error('🚨 SIGNALR SERVICE: Missing senderId in sendMessage call');
        throw new Error('SenderId is required for sending messages');
      }
      
      if (!receiverId) {
        console.error('🚨 SIGNALR SERVICE: Missing receiverId in sendMessage call');
        throw new Error('ReceiverId is required for sending messages');
      }
      
      if (!message) {
        console.error('🚨 SIGNALR SERVICE: Missing message content in sendMessage call');
        throw new Error('Message content is required for sending messages');
      }
      
      // Based on the error response, we know the API is expecting PascalCase property names
      // and MongoDB ObjectId format (24 character hex string)
      try {
        console.log('🚀 SIGNALR SERVICE: Sending message with REST API');
        
        // Use IDs directly without validation
        const senderIdStr = senderId ? String(senderId).trim() : senderId;
        const receiverIdStr = receiverId ? String(receiverId).trim() : receiverId;
        
        // Log details for debugging
        console.log('🚀 SIGNALR SERVICE: Sending message with validated IDs:', {
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          messagePreview: message?.length > 20 ? message.substring(0, 20) + '...' : message
        });
        
        // Log the full payload for debugging
        console.log('🚀 SIGNALR SERVICE: Message payload:', {
          SenderId: senderIdStr,
          ReceiverId: receiverIdStr,
          MessageLength: message?.length || 0,
          Timestamp: timestamp
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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'NO_TOKEN'}`
          }
        });
        
        console.log('🚀 SIGNALR SERVICE: REST API message sent successfully:', {
          status: response.status,
          messageId: response.data.messageId || response.data.id,
          responseData: response.data
        });
        
        // Invalidate cache for this conversation to ensure fresh data on next fetch
        this.invalidateConversationCache(senderIdStr, receiverIdStr);
        
        return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
      } catch (error) {
        // If that fails, let's try one more time with query parameters instead
        console.error('🚨 SIGNALR SERVICE: First REST API attempt failed:', error);
        try {
          console.log('🚀 SIGNALR SERVICE: Attempting to send message via query parameters');
          
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || 'NO_TOKEN'}`
              }
            }
          );
          
          return response.data.messageId || response.data.id || `fallback-${Date.now()}`;
        } catch (finalError) {
          console.error('🚨 SIGNALR SERVICE: All message sending attempts failed:', finalError);
          // Log the specific error details for better debugging
          if (finalError.response) {
            console.error('🚨 SIGNALR SERVICE: Server response:', {
              status: finalError.response.status,
              data: finalError.response.data,
              headers: finalError.response.headers
            });
          }
          throw finalError;
        }
      }
    } catch (error) {
      // Add more detailed error information for debugging
      console.error('🚨 SIGNALR SERVICE: Error sending message:', error);
      
      // Log more details about the error response if available
      if (error.response) {
        console.error('🚨 SIGNALR SERVICE: Error response data:', error.response.data);
        console.error('🚨 SIGNALR SERVICE: Error response status:', error.response.status);
        console.error('🚨 SIGNALR SERVICE: Error response headers:', error.response.headers);
        
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
        console.log('🔍 SIGNALR SERVICE: Fetching message history via REST API for:', { user1Id, user2Id });
        
        // Use the correct history endpoint that exists
        const response = await axios.get(
          `${API_BASE_URL}/api/Chat/history?user1=${validUser1Id}&user2=${validUser2Id}&skip=${skip}&take=${take}`,
          { 
            timeout: 10000,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || 'NO_TOKEN'}`
            }
          }
        );
        
        console.log('🔍 SIGNALR SERVICE: History API response:', response.status, response.data);
        
        // Safety check - ensure response.data is an array
        const messages = Array.isArray(response.data) ? response.data : [];
        
        // Cache the retrieved message history if we got any messages
        if (messages.length > 0) {
          console.log(`🔍 SIGNALR SERVICE: Caching ${messages.length} messages from history API for conversation`, cacheKey);
          this._messageCache.set(cacheKey, { messages, timestamp: Date.now() });
          return messages;
        } else {
          console.log('🔍 SIGNALR SERVICE: No messages returned from history API');
        }
      } catch (restError) {
        console.warn('🚨 SIGNALR SERVICE: History API failed:', restError);
        console.warn('🚨 SIGNALR SERVICE: Error details:', {
          status: restError.response?.status,
          statusText: restError.response?.statusText,
          data: restError.response?.data,
          url: `${API_BASE_URL}/api/Chat/history?user1=${validUser1Id}&user2=${validUser2Id}&skip=${skip}&take=${take}`
        });
        
        // Fallback to conversations endpoint
        try {
          console.log('🔍 SIGNALR SERVICE: Trying conversations endpoint as fallback');
          const fallbackResponse = await axios.get(
            `${API_BASE_URL}/api/Chat/conversations/${validUser1Id}`,
            { 
              timeout: 10000,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || 'NO_TOKEN'}`
              }
            }
          );
          
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
            // Find the conversation with the specific user
            const conversation = fallbackResponse.data.find(conv => 
              conv.id === validUser2Id || conv.userId === validUser2Id
            );
            
            const messages = conversation?.messages || [];
            console.log(`🔍 SIGNALR SERVICE: Found ${messages.length} messages from conversations fallback`);
            
            // Safety check - ensure response.data is an array
            const messageArray = Array.isArray(messages) ? messages : [];
            
            // Cache the retrieved message history if we got any messages
            if (messageArray.length > 0) {
              console.log(`🔍 SIGNALR SERVICE: Caching ${messageArray.length} messages from conversations fallback`, cacheKey);
              this._messageCache.set(cacheKey, { messages: messageArray, timestamp: Date.now() });
              return messageArray.slice(skip, skip + take);
            } else {
              console.log('🔍 SIGNALR SERVICE: No messages returned from conversations fallback');
            }
          }
        } catch (fallbackError) {
          console.warn('🚨 SIGNALR SERVICE: Conversations fallback also failed:', fallbackError);
        }
      }
      
      // Then try to get history through SignalR if connected
      if (this.isConnectionReady()) {
        try {
          console.log('🔍 SIGNALR SERVICE: Fetching message history via SignalR for:', { user1Id, user2Id });
          // Call the GetMessageHistory method on the hub with validated IDs
          const messages = await this.connection.invoke('GetMessageHistory', validUser1Id, validUser2Id, skip, take);
          
          console.log('🔍 SIGNALR SERVICE: SignalR returned messages:', messages);
          
          // Safety check - ensure messages is an array
          const messageArray = Array.isArray(messages) ? messages : [];
          
          // Cache the message history
          this._messageCache.set(cacheKey, { messages: messageArray, timestamp: Date.now() });
          console.log(`🔍 SIGNALR SERVICE: Cached ${messageArray.length} messages for conversation`, cacheKey);
          
          return messageArray;
        } catch (signalRError) {
          console.warn('🚨 SIGNALR SERVICE: SignalR message history failed:', signalRError);
          // Continue to return empty array
        }
      } else {
        console.log('🚨 SIGNALR SERVICE: SignalR not connected, can\'t fetch message history via SignalR');
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
  
  /**
   * Check if the server is currently marked as unavailable
   * @returns {boolean} - True if server is unavailable
   */
  isServerUnavailable() {
    return this._isServerUnavailable;
  }
  
  /**
   * Get current connection statistics for debugging
   * @returns {Object} - Connection statistics
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnectionReady(),
      connectionId: this.connectionId,
      consecutiveFailures: this._consecutiveFailures,
      isServerUnavailable: this._isServerUnavailable,
      backoffDelay: this._backoffDelay,
      lastReconnectAttempt: this._lastReconnectAttempt,
      userId: this._userId
    };
  }
}

// Create a singleton instance
const chatService = new SignalRChatService();

export default chatService;

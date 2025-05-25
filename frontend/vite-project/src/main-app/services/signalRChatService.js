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

// Constants
const API_BASE_URL = "https://carepro-api20241118153443.azurewebsites.net";
const HUB_URL = `${API_BASE_URL}/chathub`;

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
  }

  /**
   * Initializes the connection to the SignalR hub
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

    // Prevent multiple connection attempts
    if (this._isConnecting) {
      console.log('Connection attempt already in progress');
      return this.reconnectPromise;
    }
    
    // Use existing connection if it's already connected
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('Using existing connection');
      return Promise.resolve(this.connection);
    }

    // Mark that we are connecting
    this._isConnecting = true;
    
    try {
      // Build the connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, null]) // Reconnect policy with backoff
        .configureLogging(signalR.LogLevel.Information)
        .build();
        
      // Set up connection state handlers
      this._setupConnectionHandlers();
      
      // Set up message handlers
      this._setupMessageHandlers();
      
      // Start the connection
      this.reconnectPromise = this.connection.start();
      await this.reconnectPromise;
      
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
      
      // Notify connection handlers
      this._notifyHandlers('onConnected', { connectionId: this.connectionId });
      
      return this.connection;
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error);
      this._notifyHandlers('onError', error);
      throw error;
    } finally {
      this._isConnecting = false;
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
      await this.connection.stop();
      console.log('Disconnected from SignalR hub');
      this._notifyHandlers('onDisconnected', { reason: 'User disconnected' });
    } catch (error) {
      console.error('Error disconnecting from SignalR hub:', error);
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
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      // Call the SendMessage method on the hub
      const messageId = await this.connection.invoke('SendMessage', senderId, receiverId, message);
      return messageId;
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
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      // Call the GetMessageHistory method on the hub
      const messages = await this.connection.invoke('GetMessageHistory', user1Id, user2Id, skip, take);
      return messages;
    } catch (error) {
      console.error('Error fetching message history:', error);
      this._notifyHandlers('onError', error);
      throw error;
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
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      const onlineUsers = await this.connection.invoke('GetOnlineUsers');
      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      throw error;
    }
  }

  /**
   * Check if a specific user is online
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} - Promise that resolves to boolean indicating online status
   */
  async isUserOnline(userId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not established');
    }

    try {
      const isOnline = await this.connection.invoke('GetOnlineStatus', userId);
      return isOnline;
    } catch (error) {
      console.error('Error checking user status:', error);
      return false;
    }
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
}

// Create a singleton instance
const chatService = new SignalRChatService();

export default chatService;

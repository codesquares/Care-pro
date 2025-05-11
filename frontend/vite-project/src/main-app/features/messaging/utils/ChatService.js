import * as signalR from "@microsoft/signalr";
import config from "../../../config";

const CHAT_HUB_URL = `https://carepro-api20241118153443.azurewebsites.net/chathub`;

let connection = null;
let connectionPromise = null;
let retryCount = 0;
const MAX_RETRY_COUNT = 5;

// Track users online status
const onlineUsers = new Set();

/**
 * Connect to the SignalR chat hub
 * @param {string} userToken - JWT token for authentication
 * @param {function} onMessageReceived - Callback for incoming messages
 * @param {function} onUserStatusChanged - Callback for user status changes
 * @returns {Promise} - Connection promise
 */
export const connectToChat = (userToken, onMessageReceived, onUserStatusChanged) => {
  if (connectionPromise) return connectionPromise;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, {
      accessTokenFactory: () => userToken,
    })
    .withAutomaticReconnect([0, 1000, 5000, 10000, 30000]) // More sophisticated retry policy
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Handle reconnection events
  connection.onreconnecting(error => {
    console.warn("SignalR reconnecting:", error);
    const event = new CustomEvent('chat-status-changed', { 
      detail: { status: 'reconnecting' } 
    });
    window.dispatchEvent(event);
  });

  connection.onreconnected(() => {
    console.log("SignalR reconnected");
    retryCount = 0;
    const event = new CustomEvent('chat-status-changed', { 
      detail: { status: 'connected' } 
    });
    window.dispatchEvent(event);
  });

  connection.onclose(error => {
    console.error("SignalR connection closed:", error);
    const event = new CustomEvent('chat-status-changed', { 
      detail: { status: 'disconnected' } 
    });
    window.dispatchEvent(event);
    
    // Retry connection if closed unexpectedly
    if (retryCount < MAX_RETRY_COUNT) {
      retryCount++;
      setTimeout(() => {
        connectionPromise = null;
        connectToChat(userToken, onMessageReceived, onUserStatusChanged);
      }, 5000);
    }
  });

  // Set up message handler
  connection.on("ReceiveMessage", (senderId, message, messageId) => {
    console.log(`New message from ${senderId}: ${message}`);
    onMessageReceived(senderId, message, messageId);
    
    // Send delivery confirmation back to server
    connection.invoke("MessageReceived", messageId).catch(err => {
      console.error("Failed to confirm message receipt:", err);
    });
  });
  
  // Set up user status handler
  connection.on("UserStatusChanged", (userId, status) => {
    if (status === "Online") {
      onlineUsers.add(userId);
    } else {
      onlineUsers.delete(userId);
    }
    
    if (onUserStatusChanged) {
      onUserStatusChanged(userId, status);
    }
  });

  // Connect to the hub
  connectionPromise = connection.start()
    .then(() => {
      console.log("Connected to chat hub");
      retryCount = 0;
      
      // Notify app that connection is established
      const event = new CustomEvent('chat-status-changed', { 
        detail: { status: 'connected' } 
      });
      window.dispatchEvent(event);
      
      // Send presence notification
      return connection.invoke("SetUserOnline").catch(err => {
        console.error("Failed to set online status:", err);
      });
    })
    .catch(err => {
      console.error("Connection failed:", err);
      connectionPromise = null;
      
      // Retry connection
      if (retryCount < MAX_RETRY_COUNT) {
        retryCount++;
        setTimeout(() => {
          connectToChat(userToken, onMessageReceived, onUserStatusChanged);
        }, 3000);
      }
      
      throw err;
    });

  return connectionPromise;
};

/**
 * Send a message to a specific user
 * @param {string} senderId - ID of the sender
 * @param {string} receiverId - ID of the receiver
 * @param {string} message - Message content
 * @returns {Promise<string>} - Message ID if successful
 */
export const sendMessage = async (senderId, receiverId, message) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error("Connection not established");
  }
  
  try {
    const messageId = await connection.invoke("SendMessage", senderId, receiverId, message);
    return messageId;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - ID of the message
 * @returns {Promise}
 */
export const markMessageAsRead = async (messageId) => {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error("Connection not established");
  }
  
  try {
    await connection.invoke("MessageRead", messageId);
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

/**
 * Disconnect from the chat hub
 */
export const disconnectFromChat = () => {
  if (connection) {
    // Set user as offline
    connection.invoke("SetUserOffline").catch(err => {
      console.error("Failed to set offline status:", err);
    });
    
    connection.stop();
    console.log("Disconnected from chat");
    connection = null;
    connectionPromise = null;
  }
};

/**
 * Check if a user is online
 * @param {string} userId - User ID to check
 * @returns {boolean} - Whether the user is online
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

/**
 * Get the connection state
 * @returns {string} - Connection state (Connected, Disconnected, Connecting, Reconnecting)
 */
export const getConnectionState = () => {
  if (!connection) return "Disconnected";
  return signalR.HubConnectionState[connection.state];
};

import * as signalR from "@microsoft/signalr";
import config from "../config"; // Centralized API configuration

const CHAT_HUB_URL = `${config.BASE_URL.replace(/\/api$/, '')}/chathub`; // Using centralized API config (only trailing)

let connection = null;
let connectionPromise = null;
let retryCount = 0;
let isConnecting = false;
const MAX_RETRY_COUNT = 3;
let useMockMode = false;

// Throttling mechanism to prevent too many connection attempts
let lastConnectionAttempt = 0;
const CONNECTION_THROTTLE_MS = 10000; // 10 seconds between connection attempts

// Track users online status
const onlineUsers = new Set();

// Add a registry to track timeouts and intervals to prevent memory leaks
if (!window._chatServiceTimeouts) {
  window._chatServiceTimeouts = [];
}

// Helper function to create a timeout that can be cleaned up
const safeSetTimeout = (callback, delay) => {
  const timeoutId = setTimeout(callback, delay);
  window._chatServiceTimeouts.push(timeoutId);
  return timeoutId;
};

// Helper function to track event listeners for cleanup
const eventListeners = new Map();

// Helper to safely add event listeners that can be tracked and removed
const safeAddEventListener = (element, event, handler, options) => {
  element.addEventListener(event, handler, options);
  
  const key = `${event}-${Math.random().toString(36).substr(2, 9)}`;
  eventListeners.set(key, { element, event, handler });
  
  return key;
};

// Helper to remove a tracked event listener
const safeRemoveEventListener = (key) => {
  const listener = eventListeners.get(key);
  if (listener) {
    const { element, event, handler } = listener;
    element.removeEventListener(event, handler);
    eventListeners.delete(key);
    return true;
  }
  return false;
};

/**
 * Connect to the SignalR chat hub
 * @param {string} userToken - JWT token for authentication
 * @param {function} onMessageReceived - Callback for incoming messages
 * @param {function} onUserStatusChanged - Callback for user status changes
 * @returns {Promise} - Connection promise
 */
export const connectToChat = (userToken, onMessageReceived, onUserStatusChanged) => {
  // Track the attempt to connect for debugging
  console.log("[ChatServiceUtils] connectToChat called with state:", { 
    connectionExists: !!connection, 
    connectionPromiseExists: !!connectionPromise, 
    isConnecting, 
    useMockMode 
  });
  
  // Apply throttling to prevent rapid connection attempts
  const currentTime = Date.now();
  if (currentTime - lastConnectionAttempt < CONNECTION_THROTTLE_MS) {
    console.log(`[ChatServiceUtils] Connection attempt throttled (${Math.floor((currentTime - lastConnectionAttempt)/1000)}s < ${CONNECTION_THROTTLE_MS/1000}s threshold)`);
    
    // Return existing promise if available or create a resolved one
    return connectionPromise || Promise.resolve();
  }
  
  // Update the last connection attempt time
  lastConnectionAttempt = currentTime;
  
  // If we already have a valid connection, use it
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    console.log("[ChatServiceUtils] Already connected, reusing existing connection");
    
    // Still fire a status event to notify components
    const event = new CustomEvent('chat-status-changed', { 
      detail: { status: 'connected', useMockData: false } 
    });
    window.dispatchEvent(event);
    
    return Promise.resolve();
  }
  
  // If there's a zombie connection in Disconnecting state, clean it up
  if (connection && connection.state === signalR.HubConnectionState.Disconnecting) {
    console.log("[ChatServiceUtils] Found zombie connection in Disconnecting state, cleaning up");
    connection = null;
    connectionPromise = null;
  }
  
  // If connection or promise already exists but isn't connected yet, handle accordingly
  if (isConnecting && !useMockMode) {
    console.log("[ChatServiceUtils] Connection attempt already in progress, waiting...");
    if (connectionPromise) {
      console.log("[ChatServiceUtils] Returning existing connection promise");
      return connectionPromise;
    }
    if (connection && (connection.state === signalR.HubConnectionState.Connecting || 
                       connection.state === signalR.HubConnectionState.Reconnecting)) {
      console.log("[ChatServiceUtils] Connection is in progress, waiting for it to complete");
      return new Promise(resolve => {
        // Create a one-time event listener to resolve when connected
        const onConnected = () => {
          window.removeEventListener('chat-status-changed', onConnected);
          resolve();
        };
        window.addEventListener('chat-status-changed', onConnected);
      });
    }
    return Promise.resolve();
  }
  
  // If we're in mock mode, don't try to reconnect to real service
  if (useMockMode) {
    console.log("[ChatServiceUtils] Using mock mode, not connecting to real service");
    // Fire a status event to notify components
    const event = new CustomEvent('chat-status-changed', { 
      detail: { status: 'disconnected', useMockData: true } 
    });
    window.dispatchEvent(event);
    return Promise.resolve();
  }
  
  // Set connecting flag to prevent parallel connection attempts
  isConnecting = true;
  isConnecting = true;
  
  // Try to connect with WebSockets first (which usually works better)
  try {
    console.log("[ChatServiceUtils] Attempting connection with WebSockets");
    connection = new signalR.HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, {
        accessTokenFactory: () => userToken,
        transport: signalR.HttpTransportType.WebSockets, // Force WebSockets
        skipNegotiation: true, // Skip negotiation when using WebSockets directly
        logMessageContent: false // Don't log sensitive content
      })
      .withAutomaticReconnect([2000, 5000, 10000]) // More conservative retry policy
      .configureLogging(signalR.LogLevel.Warning) // Reduce logging noise
      .build();
      
    // Add additional connection options
    connection.serverTimeoutInMilliseconds = 60000; // 1 minute server timeout
    connection.keepAliveIntervalInMilliseconds = 15000; // 15 second keepalive
  } catch (wsError) {
    // If WebSockets setup fails, fallback to auto-negotiate
    console.log("[ChatServiceUtils] WebSockets connection setup failed, falling back to auto-negotiation", wsError);
    connection = new signalR.HubConnectionBuilder()
      .withUrl(CHAT_HUB_URL, {
        accessTokenFactory: () => userToken,
        // Let SignalR select the appropriate transport
        logMessageContent: false // Don't log sensitive content
      })
      .withAutomaticReconnect([2000, 5000]) // Even more conservative retry for fallback
      .configureLogging(signalR.LogLevel.Warning)
      .build();
      
    // Add additional connection options for fallback connection
    connection.serverTimeoutInMilliseconds = 30000; // 30 second server timeout
    connection.keepAliveIntervalInMilliseconds = 10000; // 10 second keepalive
  }

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
      detail: { status: 'disconnected', useMockData: true } 
    });
    window.dispatchEvent(event);
    
    // Clear connection state
    connection = null;
    connectionPromise = null;
    isConnecting = false;
    
    // Enable mock mode and don't attempt to reconnect automatically
    // The built-in reconnect will have already tried several times
    useMockMode = true;
  });

  // Set up message handler
  connection.on("ReceiveMessage", (senderId, message, messageId, status = 'sent') => {
    console.log(`New message from ${senderId}: ${message}, status: ${status}`);
    onMessageReceived(senderId, message, messageId, status);
    
    // Send delivery confirmation back to server
    connection.invoke("MessageReceived", messageId).catch(err => {
      console.error("Failed to confirm message receipt:", err);
    });
    
    // Trigger browser notification if not in focus
    if (document.visibilityState !== 'visible') {
      const event = new CustomEvent('new-message', { 
        detail: { 
          title: 'New Message', 
          message: message, 
          senderId 
        }
      });
      window.dispatchEvent(event);
    }
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

  // Connect to the hub with timeout to prevent indefinite waiting
  const connectionTimeoutMs = 15000; // 15 second timeout - increased for better reliability
  const connectionAttempt = connection.start();
  
  // Create a timeout promise that rejects after connectionTimeoutMs
  const timeoutPromise = new Promise((_, reject) => {
    safeSetTimeout(() => {
      console.log(`[ChatServiceUtils] Connection timed out after ${connectionTimeoutMs}ms`);
      reject(new Error("Connection timeout - switching to offline mode"));
    }, connectionTimeoutMs);
  });
  
  // Race between the connection attempt and the timeout
  connectionPromise = Promise.race([connectionAttempt, timeoutPromise])
    .then(() => {
      console.log("[ChatServiceUtils] Connected to chat hub");
      retryCount = 0;
      isConnecting = false;
      useMockMode = false;
      
      // Notify app that connection is established using safe event dispatching
      const event = new CustomEvent('chat-status-changed', { 
        detail: { 
          status: 'connected', 
          useMockData: false,
          connectionId: Date.now(),  // Add unique connection ID for tracking
          timestamp: new Date().toISOString()
        } 
      });
      window.dispatchEvent(event);
    })
    .catch(err => {
      console.error("[ChatServiceUtils] Connection failed:", err);
      connectionPromise = null;
      isConnecting = false;
      
      // Switch to mock mode after MAX_RETRY_COUNT attempts
      if (retryCount >= MAX_RETRY_COUNT) {
        console.log(`[ChatServiceUtils] Hit max retry count (${MAX_RETRY_COUNT}), switching to mock mode`);
        useMockMode = true;
        
        // Notify app that we're using mock data due to failed connections
        const event = new CustomEvent('chat-status-changed', { 
          detail: { 
            status: 'disconnected', 
            useMockData: true,
            reason: 'max_retries_exceeded'
          } 
        });
        window.dispatchEvent(event);
        
        return Promise.resolve();
      }
      
      // Limited retry attempts with backoff - but only if we didn't reach MAX_RETRY_COUNT yet
      if (retryCount < MAX_RETRY_COUNT) {
        retryCount++;
        const backoffTime = retryCount * 2000; // Exponential backoff
        console.log(`[ChatServiceUtils] Retry attempt ${retryCount}/${MAX_RETRY_COUNT} in ${backoffTime/1000} seconds`);
        
        // Notify app that we're retrying
        const event = new CustomEvent('chat-status-changed', { 
          detail: { 
            status: 'reconnecting', 
            useMockData: false,
            retryCount: retryCount,
            maxRetries: MAX_RETRY_COUNT
          } 
        });
        window.dispatchEvent(event);
        
        // Only retry once more, then fall back to mock mode to prevent infinite retries
        if (retryCount === MAX_RETRY_COUNT) {
          console.log(`[ChatServiceUtils] Final retry attempt, then switching to mock mode`);
          
          return new Promise(resolve => {
            safeSetTimeout(() => {
              // Force mock mode after this last attempt
              connectToChat(userToken, onMessageReceived, onUserStatusChanged)
                .then(resolve)
                .catch(() => {
                  useMockMode = true;
                  const finalEvent = new CustomEvent('chat-status-changed', { 
                    detail: { 
                      status: 'disconnected', 
                      useMockData: true,
                      reason: 'max_retries_exceeded'
                    } 
                  });
                  window.dispatchEvent(finalEvent);
                  resolve();
                });
            }, backoffTime);
          });
        } else {
          // Standard retry with backoff
          return new Promise(resolve => {
            safeSetTimeout(() => {
              // Use recursion with resolved promise to ensure proper chaining
              connectToChat(userToken, onMessageReceived, onUserStatusChanged)
                .then(resolve)
                .catch(() => {
                  // If this retry fails, resolve anyway to avoid hanging promises
                  resolve();
                });
            }, backoffTime);
          });
        }
      }
      
      // Don't throw error so the app can continue with mock data
      return Promise.resolve();
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
  if (!senderId || !receiverId || !message) {
    return Promise.reject(new Error("Missing required parameters"));
  }
  
  // If not connected or in mock mode, simulate message sending
  if (useMockMode || !connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.log("Using mock message sending (no active connection or in mock mode)");
    
    // Generate a mock message ID
    const mockMessageId = `mock-${Date.now()}`;
    
    // Simulate network delay (shorter delay for better UX)
    await new Promise(resolve => safeSetTimeout(resolve, 300));
    
    try {
      // Simulate message delivered status update
      safeSetTimeout(() => {
        const deliveredEvent = new CustomEvent('message-status-changed', {
          detail: { messageId: mockMessageId, status: 'delivered' }
        });
        window.dispatchEvent(deliveredEvent);
        
        // Simulate a response from the recipient after a delay
        safeSetTimeout(() => {
          // Create mock responses based on the message content
          let responseText = "Thank you for your message. I'll get back to you soon.";
          
          if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
            responseText = "Hello! How can I help you today?";
          } else if (message.toLowerCase().includes("appointment") || message.toLowerCase().includes("schedule")) {
            responseText = "I'm available for appointments on Monday, Wednesday and Friday afternoons.";
          } else if (message.toLowerCase().includes("service") || message.toLowerCase().includes("care")) {
            responseText = "We offer a range of home care services. Would you like to know more about any specific service?";
          } else if (message.toLowerCase().includes("price") || message.toLowerCase().includes("cost")) {
            responseText = "Our pricing depends on the specific services needed. Would you like me to provide a quote?";
          }
          
          const event = new CustomEvent('mock-message-received', {
            detail: { 
              senderId: receiverId, 
              message: responseText,
              timestamp: new Date().toISOString(),
              messageId: `mock-response-${Date.now()}`
            }
          });
          window.dispatchEvent(event);
        }, 2000);
      }, 800);
      
      return mockMessageId;
    } catch (mockError) {
      console.error("Error in mock message handling:", mockError);
      return mockMessageId; // Still return a message ID to prevent UI issues
    }
  }
  
  // Real implementation for when we have an active connection
  try {
    const messageId = await connection.invoke("SendMessage", senderId, receiverId, message);
    return messageId;
  } catch (error) {
    console.error("Error sending message:", error);
    
    // If send fails, immediately switch to mock mode and simulate success
    useMockMode = true;
    
    // Generate a mock message ID
    const mockMessageId = `mock-error-recovery-${Date.now()}`;
    return mockMessageId;
  }
};

/**
 * Mark a message as read
 * @param {string} messageId - ID of the message
 * @returns {Promise}
 */
export const markMessageAsRead = async (messageId) => {
  // If in mock mode or no connection, just simulate success
  if (useMockMode || !connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.log("Simulating message read confirmation in mock mode");
    return Promise.resolve();
  }
  
  try {
    await connection.invoke("MessageRead", messageId);
    return Promise.resolve();
  } catch (error) {
    console.error("Error marking message as read:", error);
    // Don't throw error in case of failure, just log it
    return Promise.resolve();
  }
};

/**
 * Disconnect from the chat hub
 */
export const disconnectFromChat = () => {
  console.log("[ChatServiceUtils] disconnectFromChat called with state:", {
    connectionExists: !!connection,
    connectionState: connection ? signalR.HubConnectionState[connection.state] : 'None',
    isConnecting
  });
  
  // Reset flags first to prevent reconnect attempts during disconnect
  isConnecting = false;
  const existingPromise = connectionPromise;
  connectionPromise = null;
  
  // Reset throttling counter to allow fresh connections on next attempt
  lastConnectionAttempt = 0;
  
  // Clean up any pending timeouts or intervals to prevent memory leaks
  if (window._chatServiceTimeouts) {
    console.log(`[ChatServiceUtils] Cleaning up ${window._chatServiceTimeouts.length} pending timeouts`);
    window._chatServiceTimeouts.forEach(clearTimeout);
    window._chatServiceTimeouts = [];
  }
  
  // Clean up all tracked event listeners
  if (eventListeners && eventListeners.size > 0) {
    console.log(`[ChatServiceUtils] Removing ${eventListeners.size} tracked event listeners`);
    eventListeners.forEach((value, key) => {
      safeRemoveEventListener(key);
    });
  }
  
  // If we have a pending connection promise, cancel it first to avoid race conditions
  if (existingPromise) {
    console.log("[ChatServiceUtils] Cancelling pending connection promise");
    // We can't really cancel the promise, but we can make sure it doesn't cause side effects
  }
  
  // Only attempt to stop if there's an actual connection in a stoppable state
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected &&
      connection.state !== signalR.HubConnectionState.Disconnecting) {
    
    console.log(`[ChatServiceUtils] Stopping connection in state: ${signalR.HubConnectionState[connection.state]}`);
    
    // Try to gracefully disconnect
    return connection.stop()
      .then(() => {
        console.log("[ChatServiceUtils] Successfully disconnected from chat");
        // Notify UI that we're disconnected but not in mock mode
        const event = new CustomEvent('chat-status-changed', { 
          detail: { status: 'disconnected', useMockData: false } 
        });
        window.dispatchEvent(event);
      })
      .catch(err => {
        console.error("[ChatServiceUtils] Error while stopping connection:", err);
      })
      .finally(() => {
        // Always reset the connection object and state variables to ensure clean state
        connection = null;
        retryCount = 0;
        // Don't reset mock mode to allow the app to stay in mock mode if needed
      });
  } else {
    // If the connection is already disconnecting or disconnected, just clean up
    console.log("[ChatServiceUtils] No active connection to disconnect or already disconnecting");
    connection = null;
    retryCount = 0;
    return Promise.resolve();
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
 * @returns {object} - Connection state information
 */
export const getConnectionState = () => {
  // If in mock mode, report as "MockConnected"
  if (useMockMode) {
    return {
      state: "MockConnected",
      useMockData: true,
      isConnecting: false
    };
  }
  
  // If no connection, return disconnected
  if (!connection) {
    return {
      state: "Disconnected",
      useMockData: false,
      isConnecting: isConnecting
    };
  }
  
  // Return actual connection state
  return {
    state: signalR.HubConnectionState[connection.state],
    useMockData: false,
    isConnecting: isConnecting
  };
};

/**
 * Update message status for a specific message
 * @param {string} messageId - ID of the message
 * @param {string} status - New status (sent, delivered, read)
 */
export const updateMessageStatus = async (messageId, status) => {
  // If in mock mode or no connection, simulate success
  if (useMockMode || !connection || connection.state !== signalR.HubConnectionState.Connected) {
    console.log(`Simulating message status update to ${status} in mock mode`);
    return true;
  }
  
  try {
    switch (status) {
      case 'delivered':
        await connection.invoke("MessageReceived", messageId);
        break;
      case 'read':
        await connection.invoke("MessageRead", messageId);
        break;
      default:
        console.warn(`Unknown message status: ${status}`);
        return true; // Return true anyway to prevent UI issues
    }
    return true;
  } catch (error) {
    console.error(`Error updating message status to ${status}:`, error);
    // Don't break the UI flow if status update fails
    return true;
  }
};
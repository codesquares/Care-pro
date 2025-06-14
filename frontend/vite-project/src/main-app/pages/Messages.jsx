import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/messages/Sidebar.jsx';
import ChatArea from '../components/messages/Chatarea.jsx';
import ChatMetrics from '../components/messages/ChatMetrics.jsx';
import EmptyMessageState from '../components/messages/EmptyMessageState.jsx';
import ToastContainer from '../components/toast/ToastContainer.jsx';
import { useMessageContext } from '../context/MessageContext.jsx';
// Note: Previously this was using NotificationsContext.jsx, now consolidated into NotificationContext.jsx
import { useNotificationContext } from '../context/NotificationContext.jsx';
import connectionManager from '../services/connectionManager.js';
import '../components/messages/messages.scss';
import '../components/messages/connection-status.scss';

// Add new styles for notification permission button
const notificationStyles = `
.notification-permission {
  margin: 10px 0;
}

.permission-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.permission-button:hover {
  background-color: #3A80D2;
}

.permission-button svg {
  width: 16px;
  height: 16px;
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

const Messages = ({ userId: propsUserId, token: propsToken }) => {
  const [searchParams] = useSearchParams();
  const { requestPermission } = useNotificationContext();
  // Track whether we're online for better error handling
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Get user details with better error handling
  let userId = null;
  let user = null;
  try {
    const userString = localStorage.getItem("userDetails");
    if (userString) {
      user = JSON.parse(userString);
      userId = user?.id;
      if (!userId) {
        console.error("User ID is missing from userDetails in localStorage");
      } else {
        console.log("User ID loaded successfully:", userId);
      }
    } else {
      console.error("No userDetails found in localStorage");
    }
  } catch (error) {
    console.error("Error parsing userDetails from localStorage:", error);
  }

  const token = propsToken || localStorage.getItem('authToken') || "mock-token";
  console.log("Auth token loaded:", token?.substring(0, 10) + "...");
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      console.log(`[MessagesPage] Network status changed. Online: ${navigator.onLine}`);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  const {
    conversations,
    selectedChatId,
    recipient,
    messages,
    unreadMessages,
    isLoading,
    error,
    selectChat,
    handleSendMessage,
    initializeChat,
  } = useMessageContext();
  
  // Get notification permission status from context
  const { permissionGranted } = useNotificationContext();
  
  // Initialize chat connection on component mount with strict retry limits
  useEffect(() => {
    // Note: We no longer request notification permission automatically here
    // It will be requested only in response to user interaction
    
    // Reset connection manager when component is first mounted
    if (connectionManager.isDestroyed) {
      connectionManager.reset();
      connectionManager.isDestroyed = false;
    }
    
    // If connection is already initialized, skip
    if (connectionManager.hasInitialized) {
      console.log("[MessagesPage] Chat connection already initialized, skipping");
      return () => {};
    }
    
    // Track if this component is still mounted
    const isMounted = { current: true };
    
    // Track connection attempts
    const MAX_CONNECTION_ATTEMPTS = 1;
    
    // Connect to SignalR - only if we have a user ID and token
    let cleanup = () => {};
    
    // Avoid recreating connections unnecessarily
    const setupConnection = async () => {
      // Start connection attempt and abort if another is in progress
      if (!connectionManager.startConnectionAttempt()) {
        console.log('[MessagesPage] Connection attempt already in progress, skipping');
        return;
      }
      
      // Validate required parameters
      if (!userId || !token) {
        console.error('[MessagesPage] Missing user ID or token');
        connectionManager.endConnectionAttempt(null);
        return;
      }
      
      console.log(`[MessagesPage] Initializing chat connection`);
      
      // Set a timeout for connection with a longer timeout to account for slow networks
      connectionManager.setConnectionTimeout(() => {
        console.log('[MessagesPage] Connection attempt timed out after 20 seconds');
        if (isMounted.current) {
          setError('Connection timed out. The server may be unavailable.');
          // Force reset the connection manager state to allow retry
          connectionManager.reset();
        }
      }, 20000); // 20 seconds timeout
      
      try {
        // Initialize chat and store cleanup function
        const cleanupFn = await initializeChat(userId, token);
        
        // Clear timeout since connection was successful
        connectionManager.clearConnectionTimeout();
        
        // Store cleanup function
        cleanup = typeof cleanupFn === 'function' ? cleanupFn : () => {};
        
        // Mark connection as successful
        connectionManager.endConnectionAttempt('success');
        
        console.log('[MessagesPage] Chat connection successfully initialized');
      } catch (err) {
        console.error("[MessagesPage] Error setting up chat connection:", err);
        connectionManager.endConnectionAttempt(null);
        
        // Set a timeout to retry connection after a delay if still mounted
        if (isMounted.current) {
          setTimeout(() => {
            if (isMounted.current && !connectionManager.hasInitialized) {
              console.log('[MessagesPage] Retrying connection...');
              setupConnection();
            }
          }, 5000); // Retry after 5 seconds
        }
      }
    };
    
    // Start the connection setup
    setupConnection();
    
    // Return cleanup function
    return () => {
      console.log("[MessagesPage] Cleaning up chat connection");
      isMounted.current = false;
      connectionManager.clearConnectionTimeout();
      
      // Ensure we call the cleanup function to remove event handlers
      if (typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (e) {
          console.error('[MessagesPage] Error during cleanup:', e);
        }
      }
      
      // Implement a more reliable way to check if we should fully destroy the connection
      const isNavigatingAway = !document.querySelector('.messages');
      
      if (isNavigatingAway) {
        console.log("[MessagesPage] Destroying connection manager immediately");
        connectionManager.destroy();
      } else {
        // Only destroy connection manager when actually navigating away
        setTimeout(() => {
          // Double-check if component is completely gone from DOM
          if (!document.querySelector('.messages')) {
            console.log("[MessagesPage] Destroying connection manager after delay");
            connectionManager.destroy();
          }
        }, 500);
      }
    };
  }, [userId, token, initializeChat, requestPermission]);
  
  // Separate effect for URL parameter handling
  useEffect(() => {
    // Check for user ID in URL params to auto-select a chat
    const userIdParam = searchParams.get('user');
    if (userIdParam && !selectedChatId) {
      console.log(`[MessagesPage] Auto-selecting chat from URL param: ${userIdParam}`);
      selectChat(userIdParam);
    }
  }, [searchParams, selectedChatId, selectChat]);
  
  const handleSelectChat = (chatId) => {
    console.log("Messages.jsx: handleSelectChat called with chatId:", chatId);
    console.log("Before selectChat - Current selectedChatId:", selectedChatId);
    console.log("Current recipient:", recipient);
    selectChat(chatId);
  };
  
  // Handle sending a new message
  const handleSendNewMessage = (receiverId, messageText) => {
    // Log parameters to help debug
    console.log("handleSendNewMessage parameters:", { userId, receiverId, messageText });
    
    // Check and validate message text first
    if (!messageText || typeof messageText !== 'string') {
      console.error("Invalid message text:", messageText);
      return;
    }
    
    // Make sure parameters are correctly ordered - sometimes they get swapped
    handleSendMessage(userId, receiverId, messageText);
  };
  
  // Added state to handle offline content display
  const [showOfflineContent, setShowOfflineContent] = useState(false);

  // Effect to handle offline fallback after connection timeout
  useEffect(() => {
    // Set a timeout to show offline content if connection takes too long
    const offlineContentTimeout = setTimeout(() => {
      if (isLoading && !error) {
        setShowOfflineContent(true);
      }
    }, 15000); // Show offline content after 15 seconds of loading
    
    return () => {
      clearTimeout(offlineContentTimeout);
    };
  }, [isLoading, error]);
  
  // Generate sample conversations for offline mode
  const getSampleConversations = () => {
    return [
      {
        id: 'sample-1',
        name: 'Sample Contact',
        isOnline: false,
        lastMessage: 'This is offline mode. Connection to server failed.',
        timestamp: new Date().toISOString(),
        avatar: '/default-avatar.png',
        unreadCount: 0
      },
      {
        id: 'sample-2',
        name: 'System Notification',
        isOnline: false,
        lastMessage: 'Try refreshing the page or checking your connection.',
        timestamp: new Date().toISOString(),
        avatar: '/default-avatar.png',
        unreadCount: 0
      }
    ];
  };
  
  // Notification permission component
  const NotificationPermissionButton = ({ permissionGranted, requestPermission }) => {
    if (permissionGranted || !("Notification" in window)) {
      return null;
    }
    
    return (
      <div className="notification-permission">
        <button 
          className="permission-button"
          onClick={() => {
            // This is triggered by user interaction, so it's allowed
            requestPermission();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          Enable Message Notifications
        </button>
      </div>
    );
  };

  // Add connection status display component
  const ConnectionStatus = ({ state }) => {
    // Don't show anything if connected
    if (state === 'Connected') {
      return null;
    }
    
    return (
      <div className={`connection-status ${state.toLowerCase()}`}>
        <div className="status-indicator">
          {state === 'Connecting' ? (
            <div className="connecting-spinner"></div>
          ) : (
            <div className="status-dot"></div>
          )}
          <span className="status-text">
            {state === 'Connecting' ? 'Connecting...' : 
             state === 'Reconnecting' ? 'Reconnecting...' : 
             state === 'Disconnected' ? 'Disconnected' : state}
          </span>
        </div>
      </div>
    );
  };
  
  // Debug helper
  const logChatServiceDebug = () => {
    import('../services/signalRChatService').then(module => {
      const chatService = module.default;
      if (chatService && typeof chatService.getDebugInfo === 'function') {
        console.log('=== SignalR Chat Service Debug Info ===');
        console.log(chatService.getDebugInfo());
        console.log('=====================================');
      } else {
        console.warn('Chat service debug method not available');
      }
    }).catch(err => {
      console.error('Error loading chat service for debug:', err);
    });
  };
  
  
  // Add debug logging
  useEffect(() => {
    if (isLoading) return;
    
    // Log debug info once after initial loading
    const debugTimer = setTimeout(() => {
      logChatServiceDebug();
    }, 3000);
    
    return () => clearTimeout(debugTimer);
  }, [isLoading]);
  
  return (
    <div className="messages">
      <h1>Messaging Dashboard</h1>
      
      {/* Add metrics component for monitoring and debugging chat performance */}
      <ChatMetrics />
      
      {(error || !isOnline) && (
        <div className={`error-message ${(error?.includes('offline') || error?.includes('sample data') || !isOnline) ? 'offline-mode' : ''}`}>
          <div className="error-icon">
            {(error?.includes('offline') || error?.includes('sample data') || !isOnline) ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </div>
          <div className="error-content">
            <h3>
              {!isOnline ? 'Network Offline' : 
                error?.includes('offline') || error?.includes('sample data') ? 'Offline Mode' : 'Connection Notice'}
            </h3>
            <p>
              {!isOnline ? 
                'You are currently offline. Messaging will use sample data until your connection is restored.' : 
                error}
            </p>
            {isOnline && error && !error.includes('offline') && !error.includes('sample data') && (
              <button 
                onClick={async () => {
                  console.log("[MessagesPage] Manual retry requested by user");
                  // Use a one-time retry that won't trigger an infinite loop
                  try {
                    const cleanupFn = await initializeChat(userId, token);
                    // Store the cleanup function somewhere if needed
                    // Don't trigger additional refreshes - let the system handle it naturally
                  } catch (err) {
                    console.error("[MessagesPage] Error during manual retry:", err);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
      
      {isLoading && !error && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Connecting to messaging service{showOfflineContent ? '... taking longer than usual' : '...'}</p>
          
          {showOfflineContent && (
            <div className="fallback-actions">
              <p>This is taking longer than expected. You can:</p>
              <button onClick={() => window.location.reload()}>
                Refresh the page
              </button>
              <button onClick={() => {
                setShowOfflineContent(false);
                setIsLoading(false);
                setConversations(getSampleConversations());
              }}>
                View in offline mode
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="messages-dashboard-header">
        <h1>Message Dashboard</h1>
        <p>View and manage all your conversations</p>
        <ConnectionStatus state={isLoading ? 'Connecting' : error ? 'Disconnected' : 'Connected'} />
        <NotificationPermissionButton 
          permissionGranted={permissionGranted} 
          requestPermission={requestPermission} 
        />
      </div>
      
      <div className="messages-container">
        <Sidebar 
          conversations={conversations} 
          selectedChatId={selectedChatId} 
          onSelectChat={handleSelectChat} 
          unreadMessages={unreadMessages}
        />
        
        {conversations.length === 0 ? (
          <EmptyMessageState isConnecting={isLoading} />
        ) : selectedChatId ? (
          <ChatArea 
            messages={messages || []}
            recipient={recipient || conversations.find(c => c.id === selectedChatId)}
            userId={userId}
            onSendMessage={handleSendNewMessage}
          />
        ) : (
          <div className="placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>No conversation selected</h3>
              <p>Choose a conversation from the sidebar to start messaging or continue an existing conversation.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast notifications */}
      <ToastContainer />
      
      {/* Offline fallback UI - shown when connection fails after multiple attempts */}
      {showOfflineContent && (
        <div className="offline-content">
          <h2>You're Offline</h2>
          <p>It seems you're not connected to the internet. Please check your connection.</p>
          
          <div className="sample-conversations">
            <h3>Sample Conversations</h3>
            <Sidebar 
              conversations={getSampleConversations()} 
              selectedChatId={selectedChatId} 
              onSelectChat={handleSelectChat} 
              unreadMessages={unreadMessages}
            />
          </div>
        </div>
      )}
      
      {/* Connection status display */}
      <ConnectionStatus state={isLoading ? 'Connecting' : error ? 'Disconnected' : 'Connected'} />
    </div>
  );
};

export default Messages;
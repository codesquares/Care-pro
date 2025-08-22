import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/messages/Sidebar.jsx';
import ChatArea from '../components/messages/Chatarea.jsx';
import ChatMetrics from '../components/messages/ChatMetrics.jsx';
import EmptyMessageState from '../components/messages/EmptyMessageState.jsx';
import ToastContainer from '../components/toast/ToastContainer.jsx';
import { useMessageContext } from '../context/MessageContext.jsx';
import connectionManager from '../services/connectionManager.js';
import useDebounce from '../hooks/useDebounce.js';
import '../components/messages/messages.scss';
import '../components/messages/connection-status.scss';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead } from '../Redux/slices/notificationSlice';
import { toast } from 'react-toastify';


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

const NotificationPermissionButton = ({ permissionGranted, requestPermission }) => {
  

  if (permission === 'granted' || !("Notification" in window)) {
    return null;
  }

  return (
    <div className="notification-permission">
      <button className="permission-button" onClick={requestPermission}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        Enable Message Notifications
      </button>
    </div>
  );
};

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

const Messages = ({ userId: propsUserId, token: propsToken }) => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);
  
  // Track whether we're online for better error handling
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Mobile view management - calculate initial state properly
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= 768);

  // Notification permission state
  const [permissionGranted, setPermissionGranted] = useState(Notification.permission === 'granted');

  // Added state to handle offline content display
  const [showOfflineContent, setShowOfflineContent] = useState(false);
  
  // Add initial mount state to prevent flash
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Refs for preventing unnecessary re-renders
  const notificationProcessedRef = useRef(new Set());
  const isInitializingRef = useRef(false);

  // Use custom hooks for performance optimization
  const { debounce } = useDebounce();

  // Get user details with better error handling - memoized
  const userDetails = useMemo(() => {
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
    return { userId, user };
  }, []); // Empty deps - localStorage data shouldn't change during component lifecycle

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

  // Handle window resize for mobile detection - debounced to prevent flash
  useEffect(() => {
    const handleResize = debounce(() => {
      const mobile = window.innerWidth < 768;
      const wasDesktop = !isMobile;
      const isNowDesktop = !mobile;
      
      setIsMobile(mobile);
      
      // Only change sidebar state if transitioning between mobile/desktop
      // This prevents unnecessary state changes that cause flash
      if (wasDesktop !== isNowDesktop) {
        if (isNowDesktop) {
          setShowSidebar(true); // Auto-show sidebar on desktop
        }
      }
    }, 100); // Debounce resize events

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, debounce]);

  // Memoize message context destructuring to prevent unnecessary effect triggers
  const {
    conversations,
    selectedChatId,
    recipient,
    messages,
    unreadMessages,
    isLoading,
    error,
    connectionState,
    isPollingActive,
    lastMessageTimestamp,
    selectChat,
    handleSendMessage,
    initializeChat,
  } = useMessageContext();

  // Separate effect for connection initialization - focused dependencies
  useEffect(() => {
    if (!userDetails.userId || !token || isInitializingRef.current) return;
    
    isInitializingRef.current = true;
    
    // Reset connection manager when component is first mounted
    if (connectionManager.isDestroyed) {
      connectionManager.reset();
      connectionManager.isDestroyed = false;
    }
    
    // Clear initial mount state after a short delay to prevent flash
    const mountTimer = setTimeout(() => {
      setIsInitialMount(false);
    }, 150);
    
    // If connection is already initialized, skip
    if (connectionManager.hasInitialized) {
      console.log("[MessagesPage] Chat connection already initialized, skipping");
      isInitializingRef.current = false;
      clearTimeout(mountTimer);
      setIsInitialMount(false);
      return () => clearTimeout(mountTimer);
    }
    
    // Track if this component is still mounted
    const isMounted = { current: true };
    let cleanup = () => {};
    
    // Avoid recreating connections unnecessarily
    const setupConnection = async () => {
      // Start connection attempt and abort if another is in progress
      if (!connectionManager.startConnectionAttempt()) {
        console.log('[MessagesPage] Connection attempt already in progress, skipping');
        isInitializingRef.current = false;
        return;
      }
      
      console.log(`[MessagesPage] Initializing chat connection`);
      
      // Set a timeout for connection with a longer timeout to account for slow networks
      connectionManager.setConnectionTimeout(() => {
        console.log('[MessagesPage] Connection attempt timed out after 20 seconds');
        if (isMounted.current) {
          // Force reset the connection manager state to allow retry
          connectionManager.reset();
        }
        isInitializingRef.current = false;
      }, 20000); // 20 seconds timeout
      
      try {
        // Initialize chat and store cleanup function
        const cleanupFn = await initializeChat(userDetails.userId, token);
        
        // Clear timeout since connection was successful
        connectionManager.clearConnectionTimeout();
        
        // Store cleanup function
        cleanup = typeof cleanupFn === 'function' ? cleanupFn : () => {};
        
        // Mark connection as successful
        connectionManager.endConnectionAttempt('success');
        
        console.log('[MessagesPage] Chat connection successfully initialized');
        isInitializingRef.current = false;
      } catch (err) {
        console.error("[MessagesPage] Error setting up chat connection:", err);
        connectionManager.endConnectionAttempt(null);
        isInitializingRef.current = false;
        
        // Set a timeout to retry connection after a delay if still mounted
        if (isMounted.current) {
          setTimeout(() => {
            if (isMounted.current && !connectionManager.hasInitialized) {
              console.log('[MessagesPage] Retrying connection...');
              isInitializingRef.current = false;
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
      isInitializingRef.current = false;
      clearTimeout(mountTimer);
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
  }, [userDetails.userId, token]); // Minimal dependencies
  
  // Separate effect for URL parameter handling
  useEffect(() => {
    const userIdParam = searchParams.get('user');
    if (userIdParam && !selectedChatId) {
      console.log(`[MessagesPage] Auto-selecting chat from URL param: ${userIdParam}`);
      selectChat(userIdParam);
    }
  }, [searchParams]); // Removed selectChat from dependencies to prevent loops

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-show sidebar on desktop
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    // Debounced notification handler to prevent rapid re-renders
  const debouncedNotificationHandler = useMemo(
    () => debounce((notifications) => {
      const unreadChatNotification = notifications.find(n => n.type === 'chat' && !n.readAt);

      if (unreadChatNotification && !notificationProcessedRef.current.has(unreadChatNotification.id)) {
        // Mark as processed to prevent duplicate handling
        notificationProcessedRef.current.add(unreadChatNotification.id);
        
        // Show toast
        toast.info(`💬 New message from ${unreadChatNotification.senderName || 'someone'}`, {
          position: 'bottom-left',
          autoClose: 3000,
        });

        // Native browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: unreadChatNotification.message || 'You have a new message',
            icon: '/notification-icon.png',
          });
        }
        
        // Clean up processed notifications after some time
        setTimeout(() => {
          notificationProcessedRef.current.delete(unreadChatNotification.id);
        }, 10000);
      }
    }, 100),
    [debounce]
  );

  // Effect for handling new chat notifications (debounced)
  useEffect(() => {
    if (notifications.length > 0) {
      debouncedNotificationHandler(notifications);
    }
  }, [notifications, debouncedNotificationHandler]);

  // Effect for marking selected chat notifications as read
  useEffect(() => {
    if (!selectedChatId) return;

    const relatedNotifications = notifications.filter(
      n => n.type === 'chat' &&
           n.relatedEntityId === selectedChatId &&
           !n.readAt
    );

    if (relatedNotifications.length > 0) {
      // Batch dispatch to prevent multiple re-renders
      relatedNotifications.forEach(n => dispatch(markNotificationAsRead(n.id)));
    }
  }, [selectedChatId, notifications, dispatch]);

  // Memoized requestPermission callback
  const requestPermission = useCallback(async () => {
    try {
      const result = await Notification.requestPermission();
      setPermissionGranted(result === 'granted');
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }, []);



  
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
    
    // On mobile, hide sidebar when chat is selected
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle going back to conversations on mobile
  const handleBackToConversations = () => {
    if (isMobile) {
      setShowSidebar(true);
    }
  };
  
  // Handle sending a new message
  const handleSendNewMessage = (receiverId, messageText) => {
    // Log parameters to help debug
    console.log("handleSendNewMessage parameters:", { userId: userDetails.userId, receiverId, messageText });
    
    // Check and validate message text first
    if (!messageText || typeof messageText !== 'string') {
      console.error("Invalid message text:", messageText);
      return;
    }
    
    // Make sure parameters are correctly ordered - sometimes they get swapped
    handleSendMessage(userDetails.userId, receiverId, messageText);
  };
  
  // Added state to handle offline content display
  // const [showOfflineContent, setShowOfflineContent] = useState(false); // Already declared above

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
  const ConnectionStatus = ({ state, isPolling }) => {
    const [isVisible, setIsVisible] = useState(true);
    
    // Auto-hide disconnected status after 5 seconds on mobile
    useEffect(() => {
      if (state === 'Disconnected' && window.innerWidth <= 768) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
      setIsVisible(true);
    }, [state]);
    
    // Don't show anything if connected and not polling, or if hidden
    if (!isVisible || (state === 'Connected' && !isPolling)) {
      return null;
    }
    
    let statusConfig = {};
    
    if (isPolling) {
      statusConfig = {
        color: '#ff9800',
        text: 'Using backup connection',
        icon: '🔄'
      };
    } else {
      switch (state) {
        case 'Connecting':
          statusConfig = {
            color: '#2196f3',
            text: 'Connecting...',
            icon: '🔗'
          };
          break;
        case 'Reconnecting':
          statusConfig = {
            color: '#ff9800',
            text: 'Reconnecting...',
            icon: '🔄'
          };
          break;
        case 'Disconnected':
          statusConfig = {
            color: '#f44336',
            text: window.innerWidth <= 768 ? 'Connection issue' : 'Connection issue - tap to dismiss',
            icon: '❌'
          };
          break;
        default:
          return null;
      }
    }

    return (
      <div 
        className={`connection-status ${state.toLowerCase()}`}
        onClick={() => state === 'Disconnected' && setIsVisible(false)}
        style={{
          position: 'fixed',
          top: window.innerWidth <= 768 ? '10px' : '70px',
          right: window.innerWidth <= 768 ? '10px' : '20px',
          backgroundColor: statusConfig.color,
          color: 'white',
          padding: window.innerWidth <= 768 ? '6px 12px' : '8px 16px',
          borderRadius: '20px',
          fontSize: window.innerWidth <= 768 ? '12px' : '14px',
          fontWeight: '500',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          maxWidth: window.innerWidth <= 768 ? '250px' : 'auto',
          backdropFilter: 'blur(10px)',
          cursor: state === 'Disconnected' ? 'pointer' : 'default',
          transition: 'opacity 0.3s ease'
        }}
      >
        <span>{statusConfig.icon}</span>
        <span>{statusConfig.text}</span>
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

  const hasUnreadChat = notifications.some(n => n.type === 'chat' && !n.readAt);

  // Show initial loading screen to prevent flash
  if (isInitialMount) {
    return (
      <div className="messages">
        <div className="messages-loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="messages">{/* Loading overlay - show when initially loading conversations */}
      {isLoading && conversations.length === 0 && (
        <div className="messages-loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Loading conversations...</p>
          </div>
        </div>
      )}
      
      {hasUnreadChat && <NotificationPermissionButton 
      permissionGranted={permissionGranted}
  requestPermission={requestPermission}
      />}

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
                    const cleanupFn = await initializeChat(userDetails.userId, token);
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
        <div className="header-content">
          <h1>My Messages</h1>
          <div className="header-actions">
            <ConnectionStatus 
              state={isLoading ? 'Connecting' : (error && connectionState === 'Disconnected') ? 'Disconnected' : connectionState || 'Connected'} 
              isPolling={isPollingActive}
            />
            <NotificationPermissionButton 
              permissionGranted={permissionGranted} 
              requestPermission={requestPermission} 
            />
          </div>
        </div>
      </div>
      
      <div className="messages-container">
        {/* Mobile back button - only show when chat is selected on mobile */}
        {isMobile && selectedChatId && !showSidebar && (
          <div className="mobile-back-header">
            <button className="back-button" onClick={handleBackToConversations}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back to Conversations</span>
            </button>
          </div>
        )}

        {/* Sidebar - show/hide based on mobile state */}
        <div className={`sidebar-container ${isMobile && !showSidebar ? 'mobile-hidden' : ''}`}>
          <Sidebar 
            conversations={conversations} 
            selectedChatId={selectedChatId} 
            onSelectChat={handleSelectChat} 
            unreadMessages={unreadMessages}
          />
        </div>
        
        {/* Chat area - show/hide based on mobile state */}
        <div className={`chat-container ${isMobile && showSidebar ? 'mobile-hidden' : ''}`}>
          {conversations.length === 0 ? (
            <EmptyMessageState isConnecting={isLoading} />
          ) : selectedChatId ? (
            <ChatArea 
              messages={messages || []}
              recipient={recipient || conversations.find(c => c.id === selectedChatId)}
              userId={userDetails.userId}
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
    </div>
  );
};

export default Messages;
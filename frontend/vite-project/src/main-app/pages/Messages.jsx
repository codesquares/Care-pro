import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/messages/Sidebar.jsx';
import ChatArea from '../components/messages/Chatarea.jsx';
import ToastContainer from '../components/toast/ToastContainer.jsx';
import { useMessageContext } from '../context/MessageContext.jsx';
import { useNotificationContext } from '../context/NotificationsContext.jsx';
import '../components/messages/messages.scss';

const Messages = ({ userId: propsUserId, token: propsToken }) => {
  const [searchParams] = useSearchParams();
  const { requestPermission } = useNotificationContext();
  // Track whether we're online for better error handling
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userId = user?.id;
  console.log("user from image component", userId);

  // const token = localStorage.getItem('authToken');
  // Use props userId and token or default values to ensure we have something
  // const userId = propsUserId || localStorage.getItem('userId') || "currentUser";
  const token = propsToken || localStorage.getItem('authToken') || "mock-token";
  console.log("userId from image component", token);
  
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
  
  // Initialize chat connection on component mount with strict retry limits
  useEffect(() => {
    // Request notification permission
    requestPermission();
    
    // Flag to track if initialization has been attempted
    // This helps prevent infinite request loops
    const hasInitialized = { current: false };
    
    // Track if this component is still mounted
    const isMounted = { current: true };
    
    // Track connection attempts to prevent infinite loops
    const connectionAttemptsRef = { current: 0 };
    const MAX_CONNECTION_ATTEMPTS = 1; // Only try once to prevent endless retries
    
    // Store error state at the moment of effect execution
    // to avoid dependency on the continuously updated error state
    const initialErrorState = error;
    
    // Exit early if we've already initialized to prevent multiple concurrent connections
    if (hasInitialized.current) {
      console.log("[MessagesPage] Chat connection already initialized, skipping");
      return () => {}; // Return empty cleanup function
    }
    
    // Mark that we've attempted initialization
    hasInitialized.current = true;
    
    // Connect to SignalR - only if we have a user ID and token
    let cleanup = () => {};
    
    // Avoid recreating connections unnecessarily
    const setupConnection = async () => {
      // Stop if we've reached max attempts to prevent infinite loops
      if (connectionAttemptsRef.current >= MAX_CONNECTION_ATTEMPTS) {
        console.log(`[MessagesPage] Hit max connection attempts (${MAX_CONNECTION_ATTEMPTS}), stopping retry loop`);
        return;
      }
      
      if (userId && token) {
        console.log(`[MessagesPage] Initializing chat connection (attempt ${connectionAttemptsRef.current + 1}/${MAX_CONNECTION_ATTEMPTS})`);
        connectionAttemptsRef.current += 1;
        
        try {
          // Initialize chat and store cleanup function
          cleanup = initializeChat(userId, token);
          
          // Wait a bit before checking if we need to retry
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Only retry once if error condition still exists and we haven't hit max attempts
          // Using a local variable to check error status, not the React state
          const needsRetry = 
            isMounted.current && 
            initialErrorState &&
            initialErrorState.includes('Could not connect') && 
            connectionAttemptsRef.current < MAX_CONNECTION_ATTEMPTS;
            
          if (needsRetry) {
            console.log("[MessagesPage] Connection attempt failed, trying once more");
            
            // Clean up the failed connection first
            cleanup();
            
            // Try again after a short delay with increasing backoff
            setTimeout(() => {
              if (isMounted.current) {
                console.log("[MessagesPage] Retrying connection...");
                cleanup = initializeChat(userId, token);
              }
            }, 2000); // Fixed backoff time
          }
        } catch (err) {
          console.error("[MessagesPage] Error setting up chat connection:", err);
        }
      }
    };
    
    // Start the connection setup only once
    setupConnection();
    
    // Return cleanup function
    return () => {
      console.log("[MessagesPage] Cleaning up chat connection");
      isMounted.current = false;
      cleanup();
    };
  // IMPORTANT: We intentionally don't include 'error' in the dependency array
  // to prevent infinite re-renders when errors occur
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
    selectChat(chatId);
  };
  
  // Handle sending a new message
  const handleSendNewMessage = (receiverId, messageText) => {
    handleSendMessage(userId, receiverId, messageText);
  };
  
  return (
    <div className="messages">
      <h1>Messaging Dashboard</h1>
      
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
                onClick={() => {
                  console.log("[MessagesPage] Manual retry requested by user");
                  // Use a one-time retry that won't trigger an infinite loop
                  const cleanup = initializeChat(userId, token);
                  // Don't trigger additional refreshes - let the system handle it naturally
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
          <p>Connecting to messaging service...</p>
        </div>
      )}
      
      <div className="messages-dashboard-header">
        <h1>Message Dashboard</h1>
        <p>View and manage all your conversations</p>
      </div>
      
      <div className="messages-container">
        <Sidebar 
          conversations={conversations} 
          selectedChatId={selectedChatId} 
          onSelectChat={handleSelectChat} 
          unreadMessages={unreadMessages}
        />
        
        {selectedChatId ? (
          <ChatArea 
            messages={messages}
            recipient={recipient}
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
              <p>
                Choose a conversation from the sidebar to start messaging or 
                continue an existing conversation.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default Messages;
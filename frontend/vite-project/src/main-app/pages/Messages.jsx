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
  
  // Use props userId and token or default values to ensure we have something
  const userId = propsUserId || localStorage.getItem('userId') || "currentUser";
  const token = propsToken || localStorage.getItem('token') || "mock-token";
  
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
  
  // Initialize chat connection on component mount
  useEffect(() => {
    // Request notification permission
    requestPermission();
    
    // Connect to SignalR
    const cleanup = initializeChat(userId, token);
    
    // Check for user ID in URL params to auto-select a chat
    const userIdParam = searchParams.get('user');
    if (userIdParam && !selectedChatId) {
      selectChat(userIdParam);
    }
    
    return cleanup;
  }, [userId, token, initializeChat, requestPermission, searchParams, selectedChatId, selectChat]);
  
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
      
      {error && (
        <div className="error-message">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="error-content">
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button onClick={() => initializeChat(userId, token)}>
              Retry Connection
            </button>
          </div>
        </div>
      )}
      
      {isLoading && !error && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Connecting to messaging service...</p>
        </div>
      )}
      
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
import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useMessageContext } from '../../context/MessageContext';
import ChatArea from './Chatarea';
import './messages.scss';
import './direct-message.scss';

const DirectMessage = () => {
  const { recipientId } = useParams();
  const location = useLocation();
  const recipientName = location.state?.recipientName || "User";
  
  const {
    messages,
    selectedChatId,
    recipient,
    isLoading,
    error,
    selectChat,
    handleSendMessage,
    initializeChat,
  } = useMessageContext();

  // Get current user ID from localStorage
  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userId = user?.id;
  const token = localStorage.getItem('authToken') || "mock-token";
  
  // We no longer initialize chat here - that's handled in the parent Messages component only
  
  // Separate effect for selecting chat to avoid connection cycling
  useEffect(() => {
    if (recipientId && recipientId !== selectedChatId && !isLoading) {
      console.log(`[DirectMessage] Selecting chat with recipient: ${recipientId}`);
      // Add a small delay to avoid race conditions with other initializations
      const timer = setTimeout(() => {
        selectChat(recipientId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [recipientId, selectedChatId, selectChat, isLoading]);

  // Handle sending a new message
  const handleSendNewMessage = (receiverId, messageText) => {
    handleSendMessage(userId, receiverId, messageText);
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error && !error.includes('sample data') && !error.includes('offline')) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => {
          // Use a delayed retry to avoid race conditions
          setTimeout(() => selectChat(recipientId), 500);
        }}>Try Again</button>
      </div>
    );
  }

  // Create a default recipient object if recipient doesn't exist yet
  const recipientObj = recipient || { 
    id: recipientId, 
    name: recipientName,
    // Add default values for properties used in ChatArea
    isOnline: Math.random() > 0.5, // Randomly set online status for new conversations
    lastActive: new Date().toISOString(), // Use current time as last active
    avatar: "/avatar.jpg",  // Default avatar image
    previewMessage: "Start a conversation..."
  };

  return (
    <div className="messages">
      <div className="direct-message-container">
        <div className="messages-header">
          <h2>Conversation with {recipientName || recipient?.name || "User"}</h2>
          {error && (
            <div className="connection-status">
              <span className="status-indicator offline"></span>
              <span className="status-text">Offline Mode</span>
            </div>
          )}
        </div>
        <div className="direct-chat-area">
          <ChatArea
            messages={messages || []}
            recipient={recipientObj}
            userId={userId}
            onSendMessage={handleSendNewMessage}
            isOfflineMode={!!error}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;

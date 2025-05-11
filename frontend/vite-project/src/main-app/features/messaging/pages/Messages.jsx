import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../features/messaging/components/Sidebar';
import ChatArea from '../features/messaging/components/ChatArea';
import ToastContainer from '../features/messaging/components/toast/ToastContainer';
import { useMessageContext } from '../features/messaging/context/MessageContext';
import { useNotificationContext } from '../features/messaging/context/NotificationContext';
import '../../styles/main-app/pages/Messages.scss';

const Messages = ({ userId, token }) => {
  const [searchParams] = useSearchParams();
  const { requestPermission } = useNotificationContext();
  
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
          {error}
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

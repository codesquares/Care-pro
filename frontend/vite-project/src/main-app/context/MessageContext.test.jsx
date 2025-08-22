import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';

// Minimal test version to isolate hook issues
const MessageContext = createContext();

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  console.log('MessageProvider render started');
  
  // Basic state hooks
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [recipient, setRecipient] = useState({});
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  
  console.log('State hooks completed');
  
  // Basic callbacks
  const selectChat = useCallback((chatId) => {
    console.log('Selecting chat:', chatId);
    setSelectedChatId(chatId);
  }, []);
  
  const handleSendMessage = useCallback(async (senderId, receiverId, messageText) => {
    console.log('Sending message:', { senderId, receiverId, messageText });
    // Mock implementation
    return `message-${Date.now()}`;
  }, []);
  
  const initializeChat = useCallback(async (userId, token) => {
    console.log('Initializing chat:', { userId, token });
    // Mock implementation
    return () => console.log('Chat cleanup');
  }, []);
  
  const handleDeleteMessage = useCallback(async (messageId) => {
    console.log('Deleting message:', messageId);
    // Mock implementation
    return true;
  }, []);
  
  console.log('Callbacks completed');
  
  // Context value
  const contextValue = useMemo(() => ({
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
    handleDeleteMessage,
  }), [
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
    handleDeleteMessage,
  ]);
  
  console.log('Context value created, rendering provider');
  
  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageProvider;

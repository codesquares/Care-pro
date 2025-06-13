import React, { useState, useEffect, useRef } from 'react';
import './chatarea.scss';
import MessageInput from './MessageInput';
import MessageStatus from './MessageStatus';
import { formatDistanceToNow } from 'date-fns';
import { useMessageContext } from '../../context/MessageContext';

const ChatArea = ({ messages, recipient, userId, onSendMessage, isOfflineMode = false }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { handleDeleteMessage } = useMessageContext();
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [visibleMessages, setVisibleMessages] = useState([]);
  
  // Define safeRecipient at component level to ensure it's available throughout
  // This prevents the undefined safeRecipient issue in handleSendMessage
  const safeRecipient = recipient ? {
    avatar: recipient.avatar || '/avatar.jpg',
    name: recipient.recipientName || 'Care Provider',
    isOnline: recipient.isOnline || false,
    lastActive: recipient.lastActive || new Date().toISOString(),
    id: recipient.receiverId || null
  } : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Process messages to add read receipt info for display
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      const processedMessages = messages.map(msg => {
        let statusText = '';
        
        if (msg.senderId === userId) {
          // Only show status for messages sent by current user
          if (msg.status === 'read') {
            statusText = msg.readAt 
              ? `Read ${new Date(msg.readAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
              : 'Read';
          } else if (msg.status === 'delivered') {
            statusText = 'Delivered';
          } else if (msg.status === 'sent') {
            statusText = 'Sent';
          } else if (msg.status === 'sending') {
            statusText = 'Sending...';
          } else if (msg.status === 'failed') {
            statusText = 'Failed to send';
          } else if (msg.status === 'pending') {
            statusText = 'Waiting to send (offline)';
          }
        }
        
        return {
          ...msg,
          statusText
        };
      });
      
      setVisibleMessages(processedMessages);
    } else {
      setVisibleMessages([]);
    }
  }, [messages, userId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDeleteMenu && !e.target.closest('.message-actions-menu')) {
        setShowDeleteMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteMenu]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Use the component-level safeRecipient variable
      // Extract recipient ID with fallbacks
      let effectiveRecipientId = safeRecipient?.id;
      
      // If no ID in safeRecipient, check original recipient
      if (!effectiveRecipientId && recipient) {
        console.log('No ID in safeRecipient, checking original recipient object');
        
        // Check all possible ID fields in the original recipient object
        const possibleIdFields = ['id', 'caregiverId', 'userId', '_id', 'recipientId'];
        
        for (const field of possibleIdFields) {
          if (recipient[field]) {
            effectiveRecipientId = recipient[field];
            console.log(`Found ID in original recipient.${field}:`, effectiveRecipientId);
            break;
          }
        }
      }
      
      // Check URL if no ID found yet
      if (!effectiveRecipientId) {
        console.log('No ID found in recipient objects, checking URL');
        const pathSegments = window.location.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        // Simple validation that it looks like an ID format
        if (lastSegment && lastSegment.length > 8) {
          effectiveRecipientId = lastSegment;
          console.log('Using ID from URL path:', effectiveRecipientId);
        }
      }
      
      // Final decision
      if (!effectiveRecipientId) {
        console.error('Failed to find any valid recipient ID for messaging');
        alert('Unable to send message: Missing recipient information. Please refresh the page or try accessing this conversation again from your messages list.');
        return;
      }
      
      // Log the final decision for debugging
      console.log('Sending message to recipient:', {
        recipientId: effectiveRecipientId,
        recipientName: safeRecipient?.name || 'Unknown',
        originalRecipientId: safeRecipient?.id,
        fromUrlParams: effectiveRecipientId !== safeRecipient?.id,
        senderId: userId
      });
      
      // Send message with our best determined ID - ensure both userId and recipientId are passed correctly
      if (message && typeof message === 'string' && 
          effectiveRecipientId && typeof effectiveRecipientId === 'string') {
        console.log("Sending message from ChatArea:", { 
          userId, 
          recipientId: effectiveRecipientId, 
          messagePreview: message.length > 20 ? message.substring(0, 20) + '...' : message 
        });
        
        // Based on the error stack trace, onSendMessage should receive recipientId and message
        // onSendMessage is a prop passed from parent that should handle the userId internally
        onSendMessage(effectiveRecipientId, message);
      } else {
        console.error("Invalid parameters for sending message:", { 
          userId, 
          recipientId: effectiveRecipientId, 
          messageType: typeof message,
          message: message ? (message.length > 20 ? message.substring(0, 20) + '...' : message) : null
        });
      }
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleMessageActions = (e, messageId) => {
    e.stopPropagation();
    setShowDeleteMenu(prev => prev === messageId ? null : messageId);
  };
  
  const deleteMessage = async (messageId) => {
    await handleDeleteMessage(messageId);
    setShowDeleteMenu(null);
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};

    // If messages is undefined or not an array, return empty object
    if (!messages || !Array.isArray(messages)) {
      return groups;
    }

    messages.forEach((msg) => {
      if (!msg.timestamp) {
        const now = new Date();
        const dateKey = now.toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push({ ...msg, timestamp: now.toISOString() });
      } else {
        try {
          const date = new Date(msg.timestamp);
          if (isNaN(date.getTime())) throw new Error('Invalid date');
          const dateKey = date.toDateString();
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(msg);
        } catch (error) {
          console.error('Error parsing message timestamp:', error);
          const now = new Date();
          const dateKey = now.toDateString();
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push({ ...msg, timestamp: now.toISOString() });
        }
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(visibleMessages);
  const isNewConversation = !visibleMessages || visibleMessages.length === 0;

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Add safety check for recipient object
  if (!recipient || typeof recipient !== 'object' || !safeRecipient) {
    return (
      <div className="chat-area">
        <div className="error-state">
          <h3>Unable to load conversation</h3>
          <p>Recipient information is missing or invalid. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="recipient-info">
          <img src={safeRecipient.avatar} alt={safeRecipient.name} className="avatar" />
          <div className="recipient-details">
            <h3>{safeRecipient.name}</h3>
            <div className="status-indicator">
              {safeRecipient.isOnline ? (
                <span className="status online">Online</span>
              ) : (
                <span className="status offline">
                  {safeRecipient.lastActive
                    ? `Last active ${formatDistanceToNow(new Date(safeRecipient.lastActive), { addSuffix: true })}`
                    : 'Not recently active'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </header>

      <div className="messages-container">
        {isOfflineMode && (
          <div className="offline-mode-banner">
            <i className="offline-icon">⚠️</i>
            <span>You're in offline mode. Messages will sync when connection is restored.</span>
          </div>
        )}

        <div className="messages-area">
          {isNewConversation ? (
            <div className="new-conversation-message">
              <div className="welcome-message">
                <img src={safeRecipient.avatar} alt={safeRecipient.name} className="welcome-avatar" />
                <h3>Start a conversation with {safeRecipient.name}</h3>
                <p>Send a message to begin chatting</p>
                {isOfflineMode && (
                  <div className="offline-note">
                    <small>Note: You're currently offline. Your messages will be delivered when you're back online.</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            Object.keys(messageGroups).map((dateKey) => (
              <div key={dateKey} className="message-group">
                <div className="message-date">
                  <span>{formatMessageDate(dateKey)}</span>
                </div>
                {messageGroups[dateKey].map((msg, index) => (
                  <div key={`${dateKey}-${index}`} className={`message ${msg.senderId === userId ? 'sent' : 'received'} ${msg.isDeleted ? 'deleted' : ''}`}>
                    <div className="message-bubble">
                      {msg.isDeleted ? (
                        <p className="deleted-message-text">This message was deleted</p>
                      ) : (
                        <p>{msg.text || msg.content}</p>
                      )}
                      <div className="message-meta">
                        <span className="message-time">
                          {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.senderId === userId && !msg.isDeleted && (
                          <div className="message-status-container">
                            <MessageStatus status={isOfflineMode && msg.status === 'sending' ? 'pending' : (msg.status || 'sent')} />
                            {msg.statusText && <span className="status-text" title={msg.statusText}>{msg.statusText}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Only show actions for your own messages that are not deleted */}
                    {msg.senderId === userId && !msg.isDeleted && (
                      <div className="message-actions">
                        <button className="action-button" onClick={(e) => handleMessageActions(e, msg.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                            <path d="M3 9.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm4.5 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm4.5 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/>
                          </svg>
                        </button>
                        {showDeleteMenu === msg.id && (
                          <div className="message-actions-menu">
                            <button className="delete-message-button" onClick={() => deleteMessage(msg.id)}>
                              Delete Message
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-area">
        <MessageInput
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          placeholder={isOfflineMode ? 'Compose message (offline mode)' : 'Type your message...'}
        />
      </div>
    </div>
  );
};

export default ChatArea;

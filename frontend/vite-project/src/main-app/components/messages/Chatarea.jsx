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
      onSendMessage(recipient.id, message);
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

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="recipient-info">
          <img src={recipient.avatar} alt={recipient.name} className="avatar" />
          <div className="recipient-details">
            <h3>{recipient.name}</h3>
            <div className="status-indicator">
              {recipient.isOnline ? (
                <span className="status online">Online</span>
              ) : (
                <span className="status offline">
                  {recipient.lastActive
                    ? `Last active ${formatDistanceToNow(new Date(recipient.lastActive), { addSuffix: true })}`
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
                <img src={recipient.avatar} alt={recipient.name} className="welcome-avatar" />
                <h3>Start a conversation with {recipient.name}</h3>
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

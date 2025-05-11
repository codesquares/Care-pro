import React, { useState } from 'react';
import './ChatArea.scss';
import MessageInput from './MessageInput';
import MessageStatus from './MessageStatus';
import { formatDistanceToNow } from 'date-fns';

const ChatArea = ({ messages, recipient, userId, onSendMessage }) => {
  const [message, setMessage] = useState('');
  
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
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(msg);
    });
    
    return groups;
  };
  
  const messageGroups = groupMessagesByDate(messages);
  
  // Format the date for display
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="recipient-info">
          <img 
            src={recipient.avatar} 
            alt={recipient.name} 
            className="avatar"
          />
          <div className="recipient-details">
            <h3>{recipient.name}</h3>
            <div className="status-indicator">
              {recipient.isOnline ? (
                <span className="status online">Online</span>
              ) : (
                <span className="status offline">
                  Last active {formatDistanceToNow(new Date(recipient.lastActive), { addSuffix: true })}
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
        <div className="messages-area">
          {Object.keys(messageGroups).map(dateKey => (
            <div key={dateKey} className="message-group">
              <div className="message-date">
                <span>{formatMessageDate(dateKey)}</span>
              </div>
              
              {messageGroups[dateKey].map((msg, index) => (
                <div 
                  key={`${dateKey}-${index}`} 
                  className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.senderId === userId && <MessageStatus status={msg.status || 'sent'} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-input-area">
        <MessageInput 
          message={message} 
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};

export default ChatArea;

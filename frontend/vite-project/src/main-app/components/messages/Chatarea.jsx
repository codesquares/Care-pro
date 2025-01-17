// ChatArea.js (Modified)
import React from 'react';
import MessageInput from './MessageInput';
import './chatarea.scss';

const ChatArea = ({ messages, recipient, onSendMessage }) => {
  return (
    <div className="chat-area">
      <header className="chat-header">
        <img src={recipient.avatar} alt={recipient.name} className="avatar" />
        <h4>{recipient.name}</h4>
        <div className="actions">
          <button>Create Offer</button>
          <button>Report</button>
        </div>
      </header>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isSender ? 'sent' : 'received'}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatArea;

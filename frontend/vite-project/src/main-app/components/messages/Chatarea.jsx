// ChatArea.js (Modified)
import React from 'react';
import MessageInput from './MessageInput';
import './chatarea.scss';
import Button from "../button/Button";

const ChatArea = ({ messages, recipient, onSendMessage }) => {
  return (
    <div className="chat-area">
      <header className="chat-header">
        <img src={recipient.avatar} alt={recipient.name} className="avatar" />
        <h4>{recipient.name}</h4>
        <div className="actions">
          <Button>Offer</Button>
          <Button>Report</Button>
        </div>
      </header>
      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isSender ? 'sent' : 'received'}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        <div className="message-input">
      <MessageInput onSendMessage={onSendMessage} />
      </div>
      </div>
    </div>
  );
};

export default ChatArea;

// MessageInput.js
import React, { useState } from 'react';
import './messageInput.scss';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message); // Send the message to the parent component or server.
      setMessage(''); // Clear the input field after sending.
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <textarea
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
        rows={1}
        className="input-field"
      />
      <button onClick={handleSend} className="send-button">
        Send
      </button>
    </div>
  );
};

export default MessageInput;

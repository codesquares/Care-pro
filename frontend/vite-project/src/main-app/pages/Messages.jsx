import React, { useState } from 'react';
import Sidebar from '../components/messages/Sidebar';
import ChatArea from '../components/messages/Chatarea';
import {conversations} from '../utilities/data';
import '../../styles/main-app/pages/Messages.scss';

const Messages = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState({});



  const handleSelectChat = (chatId) => {
    const chat = conversations.find((c) => c.id === chatId);
    setSelectedChatId(chatId);
    setRecipient(chat);
    // Fetch messages for the selected chat here (e.g., via API).
    setMessages([
      { text: 'Hi there!', isSender: false },
      { text: 'Hello!', isSender: true },
    ]);
    console.log(chatId, "xhat selexted");
  };

  const handleSendMessage = (newMessage) => {
    setMessages([...messages, { text: newMessage, isSender: true }]);
    // Optionally send the message to the server here.
  };

  return (
    <div className="messages">
      <Sidebar conversations={conversations} onSelectChat={handleSelectChat} />
      {selectedChatId ? (
        <ChatArea messages={messages} recipient={recipient} onSendMessage={handleSendMessage} />
      ) : (
        <div className="placeholder">Select a chat to start messaging</div>
      )}
    
    </div>
  );
};

export default Messages;

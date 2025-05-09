// import React, { useState, useEffect } from 'react';
// import Sidebar from '../components/messages/Sidebar';
// import ChatArea from '../components/messages/Chatarea';
// import { connectToChat, sendMessage, disconnectFromChat } from "../services/ChatService";
// import {conversations} from '../utilities/data';
// import '../../styles/main-app/pages/Messages.scss';

// const Messages = ({userId, token}) => {
//   const [selectedChatId, setSelectedChatId] = useState(null);
//   const [recipient, setRecipient] = useState({});
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState("");
//   const [receiverId, setReceiverId] = useState("");


//   useEffect(() => {
//     connectToChat(token, (senderId, newMessage) => {
//         setMessages(prevMessages => [...prevMessages, { senderId, text: newMessage }]);
//     });

//     return () => {
//         disconnectFromChat();
//     };
// }, [token]);

// const handleSelectChat = (chatId) => {
//   const chat = conversations.find((c) => c.id === chatId);
//   setSelectedChatId(chatId);
//   setRecipient(chat);
//   // Fetch messages for the selected chat here (e.g., via API).
//   setMessages([
//     { text: 'Hi there!', isSender: false },
//     { text: 'Hello!', isSender: true },
//   ]);
//   console.log(chatId, "xhat selexted");
// };


// const handleSendMessage = async () => {
//     if (message.trim() && receiverId) {
//         await sendMessage(userId, receiverId, message);
//         setMessages(prevMessages => [...prevMessages, { senderId: userId, text: message }]);
//         setMessage("");
//     }
// };

//   return (
//     <div className="messages">
//       <Sidebar conversations={conversations} onSelectChat={handleSelectChat} />
//       {selectedChatId ? (
//         <ChatArea messages={messages} recipient={recipient} onSendMessage={handleSendMessage} />
//       ) : (
//         <div className="placeholder">Select a chat to start messaging</div>
//       )}
    
//     </div>
//   );
// };

// export default Messages;

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/messages/Sidebar';
import ChatArea from '../components/messages/Chatarea';
import { connectToChat, sendMessage, disconnectFromChat } from '../services/ChatService';
import '../../styles/main-app/pages/Messages.scss';
import axios from 'axios';

const Messages = ({ userId, token }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [recipient, setRecipient] = useState({});
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');

  // Fetch all users the current user has chatted with
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          `https://carepro-api20241118153443.azurewebsites.net/api/chat/users/${userId}`
        );
        setConversations(response.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };

    //fetchConversations();
  }, [userId]);

  // Connect to SignalR hub
  useEffect(() => {
    connectToChat(token, (senderId, newMessage) => {
      setMessages(prev => [...prev, { senderId, text: newMessage }]);
    });

    return () => disconnectFromChat();
  }, [token]);

  const handleSelectChat = async (chatId) => {
    const chat = conversations.find((c) => c.id === chatId);
    setSelectedChatId(chatId);
    setRecipient(chat);
    setReceiverId(chat.id);
    setMessages([]);

    // Fetch previous messages (optional)
    // try {
    //   const res = await axios.get(
    //     `https://carepro-api20241118153443.azurewebsites.net/api/chat/messages?user1=${userId}&user2=${chatId}`
    //   );
    //   setMessages(res.data);
    // } catch (err) {
    //   console.error('Failed to fetch messages:', err);
    // }
  };

  const handleSendMessage = async () => {
    if (message.trim() && receiverId) {
      await sendMessage(userId, receiverId, message);
      setMessages(prevMessages => [...prevMessages, { senderId: userId, text: message }]);
      setMessage('');
    }
  };

  return (
    <div className="messages">
      <Sidebar conversations={conversations} onSelectChat={handleSelectChat} />
      {selectedChatId ? (
        <ChatArea
          messages={messages}
          recipient={recipient}
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          userId={userId}
        />
      ) : (
        <div className="placeholder">Select a chat to start messaging</div>
      )}
    </div>
  );
};

export default Messages;

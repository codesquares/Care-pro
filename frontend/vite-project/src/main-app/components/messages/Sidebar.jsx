import React, { useState, useEffect } from 'react';
import './sidebar.scss';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = ({ conversations, selectedChatId, onSelectChat, unreadMessages }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  
  // Function to get initials from name (similar to NavigationBar)
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "?";
    
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length === 0) return "?";
    
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    
    return initials.slice(0, 2);
  };
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(chat => {
        const name = chat.name || chat.FullName || chat.fullName || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.previewMessage && chat.previewMessage.toLowerCase().includes(searchTerm.toLowerCase()));
      });
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Messages</h2>
      </div>
      
      <div className="search-container">
        <div className="search-inner">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search conversations..." 
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="chat-list-container">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            {searchTerm ? 'No conversations matching your search' : 'You cannot chat with anyone as of this moment'}
          </div>
        ) : (
          <ul className="chat-list">
            {filteredConversations.map((chat) => {
              // Use chat.id if available, otherwise fall back to chat.userId
              const chatId = chat.id || chat.userId;
              const unreadCount = unreadMessages?.[chatId] || 0;
              
              if (!chatId) {
                console.error("Chat without ID:", chat);
              }
              
              return (
                <li 
                  key={chatId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}
                  className={`chat-item ${selectedChatId === chatId ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => chatId && onSelectChat(chatId)}
                >
                  <div className="avatar-container">
                    <div className="avatar avatar-receiver">
                      {getInitials(chat.name || chat.FullName || chat.fullName)}
                    </div>
                    {chat.isOnline && <span className="online-indicator"></span>}
                  </div>
                  
                  <div className="chat-preview">
                    <div className="chat-header">
                      <h4>{chat.name || chat.FullName || chat.fullName}</h4>
                      <span className="chat-time">
                        {chat.lastMessage?.timestamp ? 
                          formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: false }) : 
                          chat.lastActive}
                      </span>
                    </div>
                    <div className="chat-content">
                      <p className="preview-message">{chat.previewMessage}</p>
                      {unreadCount > 0 && (
                        <span className="unread-count">{unreadCount}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
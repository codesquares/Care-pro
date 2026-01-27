import { useState,  useCallback, useMemo } from 'react';
import './sidebar.css';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = ({ conversations, selectedChatId, onSelectChat, unreadMessages, headerActions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle chat selection with smart refresh detection
  const handleChatClick = useCallback((chatId) => {
    console.log('Sidebar: Chat clicked:', chatId, 'currently selected:', selectedChatId);
    
    if (chatId) {
      // If clicking on the same chat that's already selected, force refresh
      // This helps ensure messages sent while viewing the chat are visible
      const forceReload = selectedChatId === chatId;
      console.log('Sidebar: Force reload needed:', forceReload);
      
      onSelectChat(chatId, forceReload);
    }
  }, [selectedChatId, onSelectChat]);
  
  // Memoized function to get initials from name
  const getInitials = useCallback((name) => {
    if (!name || typeof name !== "string") return "?";
    
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length === 0) return "?";
    
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    
    return initials.slice(0, 2);
  }, []);
  
  // Memoized filtered conversations to prevent unnecessary re-calculations
  const filteredConversations = useMemo(() => {
    if (searchTerm.trim() === '') {
      return conversations;
    }
    
    return conversations.filter(chat => {
      const name = chat.name || chat.FullName || chat.fullName || '';
      const preview = chat.previewMessage || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             preview.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, conversations]);
  
  // Memoized search handler
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Memoized clear search handler
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-main">
          <h2>My Messages</h2>
          {headerActions && <div className="mobile-actions">{headerActions}</div>}
        </div>
        <div className="filter-dropdown">
          <label htmlFor="chat-filter" className="sr-only">Filter conversations</label>
          <select id="chat-filter" defaultValue="all" aria-label="Filter conversations by type">
            <option value="all">All chats</option>
            <option value="unread">Unread</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      
        <div className="search-container">
          <div className="search-inner">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search conversations..." 
              className="search-input"
              aria-label="Search conversations"
              aria-describedby="search-results-count"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div id="search-results-count" className="sr-only">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        
      <div className="chat-list-container">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations" role="status">
            {searchTerm ? 'No conversations matching your search' : 'You cannot chat with anyone as of this moment'}
          </div>
        ) : (
          <>
            <div className="sr-only" aria-live="polite">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} available
            </div>
            <ul className="chat-list" role="list" aria-label="Conversation list">
            {filteredConversations.map((chat) => {
              // Use chat.id if available, otherwise fall back to chat.userId
              const chatId = chat.id || chat.userId;
              const unreadCount = unreadMessages?.[chatId] || 0;
              // Get the role of the conversation partner (if available)
              const partnerRole = chat.role || chat.partnerRole || chat.userRole;
              
              if (!chatId) {
                console.error("Chat without ID:", chat);
              }
              
              return (
                <li 
                  key={chatId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}
                  className={`chat-item ${selectedChatId === chatId ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleChatClick(chatId)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && chatId) {
                      e.preventDefault();
                      handleChatClick(chatId);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Chat with ${chat.name || chat.FullName || chat.fullName}${partnerRole ? ` (${partnerRole})` : ''}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
                >
                  <div className="avatar-container">
                    <div className="avatar avatar-receiver">
                      {getInitials(chat.name || chat.FullName || chat.fullName)}
                    </div>
                    {chat.isOnline && <span className="online-indicator"></span>}
                  </div>
                  
                  <div className="chat-preview">
                    <div className="chat-header">
                      <div className="chat-name-row">
                        <h4>{chat.name || chat.FullName || chat.fullName}</h4>
                        {partnerRole && (
                          <span className={`role-badge ${partnerRole.toLowerCase()}`}>
                            {partnerRole}
                          </span>
                        )}
                      </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
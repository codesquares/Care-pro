import { useState, useCallback, useMemo } from 'react';
import './sidebar.css';
import { formatDistanceToNow } from 'date-fns';

// Gradient color pairs for avatars based on name hash
const AVATAR_GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#f6d365', '#fda085'],
  ['#89f7fe', '#66a6ff'],
];

const getAvatarGradient = (name) => {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const Sidebar = ({ conversations, selectedChatId, onSelectChat, unreadMessages, headerActions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Handle chat selection with smart refresh detection
  const handleChatClick = useCallback((chatId) => {
    if (chatId) {
      const forceReload = selectedChatId === chatId;
      onSelectChat(chatId, forceReload);
    }
  }, [selectedChatId, onSelectChat]);
  
  // Memoized function to get initials from name
  const getInitials = useCallback((name) => {
    if (!name || typeof name !== "string") return "?";
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length === 0) return "?";
    return names.map((n) => n[0].toUpperCase()).join("").slice(0, 2);
  }, []);
  
  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Apply filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter(chat => {
        const chatId = chat.id || chat.userId;
        return (unreadMessages?.[chatId] || 0) > 0;
      });
    }
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(chat => {
        const name = chat.name || chat.FullName || chat.fullName || '';
        const preview = chat.previewMessage || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               preview.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  }, [searchTerm, conversations, activeFilter, unreadMessages]);
  
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Count total unread
  const totalUnread = useMemo(() => {
    if (!unreadMessages) return 0;
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  }, [unreadMessages]);
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-main">
          <div className="header-title-group">
            <h2>Messages</h2>
            {totalUnread > 0 && (
              <span className="total-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
          </div>
          {headerActions && <div className="mobile-actions">{headerActions}</div>}
        </div>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
            aria-label="Show all conversations"
          >
            All
          </button>
          <button 
            className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
            aria-label="Show unread conversations"
          >
            Unread
            {totalUnread > 0 && <span className="filter-badge">{totalUnread}</span>}
          </button>
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
            <div className="no-conversations-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p>{searchTerm ? 'No conversations matching your search' : activeFilter === 'unread' ? 'No unread messages' : 'No conversations yet'}</p>
              <span className="no-conversations-hint">
                {searchTerm ? 'Try a different search term' : activeFilter === 'unread' ? 'You\'re all caught up!' : 'Start a conversation from a caregiver or client profile'}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="sr-only" aria-live="polite">
              {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} available
            </div>
            <ul className="chat-list" role="list" aria-label="Conversation list">
            {filteredConversations.map((chat, index) => {
              const chatId = chat.id || chat.userId;
              const unreadCount = unreadMessages?.[chatId] || 0;
              const partnerRole = chat.role || chat.partnerRole || chat.userRole;
              const chatName = chat.name || chat.FullName || chat.fullName;
              const gradient = getAvatarGradient(chatName);
              
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
                  style={{ animationDelay: `${index * 0.03}s` }}
                  aria-label={`Chat with ${chatName}${partnerRole ? ` (${partnerRole})` : ''}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
                >
                  <div className="avatar-container">
                    <div 
                      className="avatar avatar-receiver"
                      style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                    >
                      {getInitials(chatName)}
                    </div>
                    {chat.isOnline && <span className="online-indicator" aria-label="Online"></span>}
                  </div>
                  
                  <div className="chat-preview">
                    <div className="chat-header">
                      <div className="chat-name-row">
                        <h4>{chatName}</h4>
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
                      <p className={`preview-message ${unreadCount > 0 ? 'has-unread' : ''}`}>{chat.previewMessage}</p>
                      {unreadCount > 0 && (
                        <span className="unread-count" aria-label={`${unreadCount} unread`}>{unreadCount}</span>
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
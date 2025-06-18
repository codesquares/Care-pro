import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationBell.css';

const NotificationBell = ({ navigateTo }) => {
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle click outside of notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'Message':
        return '💬';
      case 'Payment':
        return '💰';
      case 'SystemNotice':
        return '🔔';
      case 'NewGig':
        return '🛠️';
      default:
        return '📝';
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell" 
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {safeNotifications.length > 0 && (
              <button 
                className="mark-all-read" 
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-content">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : safeNotifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              safeNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <p>{notification.content}</p>
                    <span className="notification-time">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                  </div>
                  {!notification.isRead && <span className="unread-indicator"></span>}
                </div>
              ))
            )}
          </div>
          
          <div className="notification-footer">
            <button onClick={() => navigateTo && navigateTo('/notifications')}>
              See all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

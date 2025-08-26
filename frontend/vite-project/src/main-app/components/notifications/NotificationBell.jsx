import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../Redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import './NotificationBell.css';

const NotificationBell = ({ navigateTo, bellIcon: BellIcon }) => {
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const dropdownRef = useRef(null);

  const toggleNotifications = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setExpandedNotificationId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    // Toggle expansion
    if (expandedNotificationId === notification.id) {
      setExpandedNotificationId(null);
    } else {
      setExpandedNotificationId(notification.id);
      // Mark as read if unread
      if (!notification.isRead) {
        dispatch(markNotificationAsRead(notification.id));
      }
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'NewMessage':
      case 'Message':
        return '💬';
      case 'Payment':
        return '💰';
      case 'SystemNotice':
        return '📢';
      case 'NewGig':
        return '🛠️';
      case 'Signup':
        return '👋';
      default:
        return '🔔';
    }
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  console.log('Notifications:', notifications);
  console.log('Unread Count:', unreadCount);

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={toggleNotifications}>
        {BellIcon ? (
          <BellIcon className="bell-icon" />
        ) : (
          '🔔'
        )}
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read"
                onClick={() => dispatch(markAllNotificationsAsRead())}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-content">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${
                      expandedNotificationId === notification.id ? 'expanded' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-main">
                      <div className="notification-icon">
                        {getNotificationTypeIcon(notification.type)}
                      </div>
                      <div className="notification-text">
                        <div className="notification-title">
                          {notification.title || 'Notification'}
                        </div>
                        <div className="notification-preview">
                          {notification.content || notification.message || 'New notification'}
                        </div>
                        <div className="notification-time">
                          {formatNotificationTime(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.isRead && <div className="unread-dot"></div>}
                      <div className="expand-indicator">
                        {expandedNotificationId === notification.id ? '▼' : '▶'}
                      </div>
                    </div>
                    
                    {expandedNotificationId === notification.id && (
                      <div className="notification-details">
                        <div className="notification-full-content">
                          {notification.content || notification.message || 'No additional details available.'}
                        </div>
                        {notification.relatedEntityId && (
                          <div className="notification-metadata">
                            <small>Related to: {notification.relatedEntityId}</small>
                          </div>
                        )}
                        {notification.link && navigateTo && (
                          <button 
                            className="notification-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo(notification.link);
                              setIsOpen(false);
                            }}
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length >= 1 && (
            <div className="notification-footer">
              <button 
                className="view-all-notifications"
                onClick={() => {
                  if (navigateTo) {
                    // Get user role to determine correct path
                    const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
                    const userRole = user.role;
                    
                    if (userRole === 'Client') {
                      navigateTo('/app/client/notifications');
                    } else if (userRole === 'Caregiver' || userRole === 'CareGiver') {
                      navigateTo('/app/caregiver/notifications');
                    } else {
                      // Fallback for other roles or unrecognized roles
                      navigateTo('/notifications');
                    }
                    setIsOpen(false);
                  }
                }}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

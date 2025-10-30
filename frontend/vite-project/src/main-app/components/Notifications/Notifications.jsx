import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../Redux/slices/notificationSlice';
import { formatDistanceToNow } from "date-fns";
import "./Notifications.css";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user?.firstName) {
      setUserName(user.firstName);
    }
  }, []);

  useEffect(() => {
    // Fetch notifications when component mounts
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
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

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="notifications-page-wrapper">      
      <div className="notifications-page">
        <div className="notifications-back-section">
          <button className="back-button" onClick={handleGoBack} aria-label="Go back">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M19 12H5M12 19L5 12L12 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        </div>
        
        <div className="notifications-welcome-section">
          <h1 className="header">Hi {userName}! 👋</h1>
        </div>

        <div className="notifications-content-section">
          <div className="notifications-header-container">
            <h2 className="notifications-header">
              Notifications
              {notifications.length > 0 && unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead} 
                  className="mark-all-read-btn"
                >
                  Mark all as read ({unreadCount})
                </button>
              )}
            </h2>
            <button 
              className="close-notifications-btn" 
              onClick={handleGoBack}
              aria-label="Close notifications"
              title="Close notifications"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M18 6L6 18M6 6L18 18" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          
          <div className="notifications-box">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔔</div>
                <h3>No notifications yet</h3>
                <p>You'll see notifications here when you receive messages, payments, or system updates.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-entry ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title || 'Notification'}
                    </div>
                    <p className="notification-message">
                      {notification.content || notification.message || 'New notification'}
                    </p>
                    <span className="notification-time">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notifications-summary">
              <p>
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All notifications have been read'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;


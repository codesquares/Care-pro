import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../Redux/slices/notificationSlice';
import './NotificationBell.css';

const NotificationBell = ({ navigateTo, bellIcon }) => {
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleNotifications = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 console.log('Notifications:', notifications);
 console.log('Unread Count:', unreadCount);
  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={toggleNotifications}>
        {bellIcon ? (
          <img src={bellIcon} alt="Notifications" />
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
              <button onClick={() => dispatch(markAllNotificationsAsRead())}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-content">
            {loading ? (
              <p>Loading...</p>
            ) : notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    if (!n.isRead) dispatch(markNotificationAsRead(n.id));
                    if (navigateTo && n.link) navigateTo(n.link);
                  }}
                >
                  <p>{n.title}</p>
                  <small>{n.message}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

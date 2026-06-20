import  { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../Redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import {
  getNotificationRoute,
  getNotificationActionLabel,
  getNotificationTypeIcon,
  normalizeNotificationType,
  extractPaymentActionRequiredUrl,
} from '../../utils/notificationRoutes';
import './NotificationBell.css';

const NotificationBell = ({ navigateTo, bellIcon: BellIcon }) => {
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Get current user role for route resolution
  const getUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("userDetails") || "{}");
      return user.role || '';
    } catch {
      return '';
    }
  };

  const toggleNotifications = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      dispatch(markNotificationAsRead(notification.id));
    }

    // Navigate to the relevant page
    const userRole = getUserRole();
    const route = getNotificationRoute(notification, userRole);

    console.log('[NotificationBell] Click:', {
      rawType: notification.type,
      relatedEntityId: notification.relatedEntityId,
      orderId: notification.orderId,
      senderId: notification.senderId,
      userRole,
      resolvedRoute: route,
      hasNavigateTo: !!navigateTo,
    });

    if (route && navigateTo) {
      setIsOpen(false);
      navigateTo(route);
    }
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const userRole = getUserRole();

  // Resolved check for service_location_not_set notifications:
  // if the client has already set GPS (written to localStorage by ContractDetailPage),
  // show the card as greyed-out resolved rather than actionable.
  const isGpsLocationResolved = (notification) => {
    if (normalizeNotificationType(notification.type) !== 'ServiceLocationNotSet') return false;
    const contractId = notification.relatedEntityId;
    if (!contractId) return false;
    return localStorage.getItem(`gps_set_contract_${contractId}`) === 'true';
  };

  const isPaymentActionRequired = (notification) =>
    normalizeNotificationType(notification.type) === 'PaymentActionRequired';

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={toggleNotifications} ref={buttonRef}>
        {BellIcon ? (
          <BellIcon className="bell-icon" />
        ) : (
          '🔔'
        )}
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown" ref={dropdownRef}>
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
                {notifications.map((notification) => {
                  const route = getNotificationRoute(notification, userRole);
                  const isClickable = !!route && !!navigateTo;
                  const isServiceLocationNotSet = normalizeNotificationType(notification.type) === 'ServiceLocationNotSet';
                  const actionRequired = isPaymentActionRequired(notification) || isServiceLocationNotSet;
                  const resolved = isGpsLocationResolved(notification);
                  const authUrl = isPaymentActionRequired(notification)
                    ? extractPaymentActionRequiredUrl(notification.content || notification.message || '')
                    : null;

                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        !notification.isRead ? 'unread' : ''
                      } ${
                        isClickable ? 'clickable' : ''
                      } ${
                        actionRequired ? 'notification-item--action-required' : ''
                      } ${
                        resolved ? 'notification-item--resolved' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      role={isClickable ? 'link' : undefined}
                      title={isClickable ? getNotificationActionLabel(notification.type) : undefined}
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
                          {isPaymentActionRequired(notification) && (
                            authUrl ? (
                              <button
                                className="notification-cta-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(authUrl, '_blank', 'noopener,noreferrer');
                                }}
                              >
                                Complete Payment
                              </button>
                            ) : (
                              <span className="notification-fallback-note">
                                Please check your email or dashboard to continue payment.
                              </span>
                            )
                          )}
                          {resolved && (
                            <span className="notification-resolved-tag">✅ Location confirmed</span>
                          )}
                        </div>
                        {!notification.isRead && <div className="unread-dot"></div>}
                        {isClickable && (
                          <div className="notification-go-arrow" aria-hidden="true">›</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {notifications.length >= 1 && (
            <div className="notification-footer">
              <button 
                className="view-all-notifications"
                onClick={() => {
                  if (navigateTo) {
                    const role = getUserRole();
                    
                    if (role === 'Client') {
                      navigateTo('/app/client/notifications');
                    } else if (role === 'Caregiver' || role === 'CareGiver') {
                      navigateTo('/app/caregiver/notifications');
                    } else {
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

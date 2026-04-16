import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, fetchUnreadCount, notificationReceived, unreadCountUpdated, clearNotifications } from './main-app/Redux/slices/notificationSlice';
import { useAuth } from './main-app/context/AuthContext';
import signalRNotificationService from './main-app/services/signalRNotificationService';

const CARE_REQUEST_TYPES = [
  'care_request_matched',
  'care_request_no_match',
  'care_request_admin_match_update',
  'care_request_admin_no_match',
];

const NotificationPoller = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const { notifications } = useSelector((state) => state.notifications);
  const seenIdsRef = useRef(new Set());
  const connectedRef = useRef(false);

  // ── SignalR connection: connect on login, disconnect on logout ──
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Not logged in → disconnect if we were connected, clear state
      if (connectedRef.current) {
        signalRNotificationService.disconnect();
        connectedRef.current = false;
        dispatch(clearNotifications());
      }
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Immediately fetch existing notifications via REST on login
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    // Wire up SignalR push handlers before connecting
    signalRNotificationService.onNotification((notification) => {
      dispatch(notificationReceived(notification));
    });
    signalRNotificationService.onUnreadCountChanged((count) => {
      dispatch(unreadCountUpdated(count));
    });

    signalRNotificationService.connect(token, user.id).then(() => {
      connectedRef.current = true;
    });

    return () => {
      signalRNotificationService.disconnect();
      connectedRef.current = false;
    };
  }, [isAuthenticated, user?.id, dispatch]);

  // ── Emit CustomEvents for care-request notifications (unchanged) ──
  useEffect(() => {
    if (!notifications?.length) return;

    for (const n of notifications) {
      if (
        !seenIdsRef.current.has(n.id) &&
        CARE_REQUEST_TYPES.includes(n.type?.toLowerCase?.())
      ) {
        window.dispatchEvent(
          new CustomEvent('care-request-update', {
            detail: { type: n.type, relatedEntityId: n.relatedEntityId },
          })
        );
      }
      seenIdsRef.current.add(n.id);
    }
  }, [notifications]);

  return null;
};

export default NotificationPoller;


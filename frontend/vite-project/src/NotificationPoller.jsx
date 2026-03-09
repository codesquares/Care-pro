import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, fetchUnreadCount } from './main-app/Redux/slices/notificationSlice';

const CARE_REQUEST_TYPES = [
  'care_request_matched',
  'care_request_no_match',
  'care_request_admin_match_update',
  'care_request_admin_no_match',
];

const NotificationPoller = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.notifications);
  const seenIdsRef = useRef(new Set());

  // Emit CustomEvents for new care-request notifications so open pages can react
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

  useEffect(() => {
    // Check for auth token before making API calls
    const token = localStorage.getItem('authToken');
    if (!token) {
      return; // Don't poll notifications if not logged in
    }

    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    const interval = setInterval(() => {
      // Re-check token on each poll in case user logs out
      const currentToken = localStorage.getItem('authToken');
      if (currentToken) {
        dispatch(fetchNotifications());
        dispatch(fetchUnreadCount());
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
};

export default NotificationPoller;


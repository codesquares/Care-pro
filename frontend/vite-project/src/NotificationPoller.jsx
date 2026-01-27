import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchNotifications, fetchUnreadCount } from './main-app/Redux/slices/notificationSlice';

const NotificationPoller = () => {
  const dispatch = useDispatch();

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


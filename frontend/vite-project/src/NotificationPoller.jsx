import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchNotifications, fetchUnreadCount } from './main-app/Redux/slices/notificationSlice';

const NotificationPoller = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    const interval = setInterval(() => {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
};

export default NotificationPoller;


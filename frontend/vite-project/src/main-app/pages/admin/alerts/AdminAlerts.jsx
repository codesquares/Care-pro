import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../../Redux/slices/notificationSlice';
import { getNotificationRoute, getNotificationActionLabel } from '../../../utils/notificationRoutes';
import './admin-alerts.css';

// Admin "Alerts" inbox: the persistent, personal notification list for the signed-in admin
// (package requests, declined assignments, failed contracts/payments, incidents, disputes, withdrawals).
// Deliberately separate from /app/admin/notifications, which is the SuperAdmin broadcast console.
// Reuses the shared notification Redux state (fed by NotificationPoller / SignalR) and route resolver.
const timeAgo = (ts) => {
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return 'Recently'; }
};

const AdminAlerts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((s) => s.notifications);
  const role = (() => { try { return JSON.parse(localStorage.getItem('userDetails') || '{}').role || ''; } catch { return ''; } })();

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const open = (n) => {
    if (!n.isRead) dispatch(markNotificationAsRead(n.id));
    const route = getNotificationRoute(n, role);
    if (route) navigate(route);
  };

  return (
    <div className="aa-page">
      <div className="aa-head">
        <div>
          <h1 className="aa-title">Alerts</h1>
          <p className="aa-sub">Items that need staff attention. {unreadCount > 0 ? `${unreadCount} unread.` : 'You are all caught up.'}</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="aa-markall" onClick={() => dispatch(markAllNotificationsAsRead())}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="aa-empty">Loading alerts…</div>
      ) : notifications.length === 0 ? (
        <div className="aa-empty" data-testid="aa-empty">No alerts yet.</div>
      ) : (
        <ul className="aa-list" data-testid="aa-list">
          {notifications.map((n) => {
            const route = getNotificationRoute(n, role);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`aa-row${n.isRead ? '' : ' aa-row--unread'}`}
                  data-testid="aa-row"
                  data-type={n.type}
                  data-route={route || ''}
                  onClick={() => open(n)}
                  disabled={!route}
                >
                  <span className="aa-dot" aria-hidden="true" />
                  <span className="aa-body">
                    <span className="aa-row-title">{n.title || getNotificationActionLabel(n.type)}</span>
                    <span className="aa-row-text">{n.content}</span>
                    <span className="aa-row-meta">
                      {timeAgo(n.createdAt)}{route ? ` · ${getNotificationActionLabel(n.type)}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminAlerts;

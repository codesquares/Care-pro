import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchNotifications, fetchUnreadCount, notificationReceived, unreadCountUpdated, clearNotifications } from './main-app/Redux/slices/notificationSlice';
import { useAuth } from './main-app/context/AuthContext';
import signalRNotificationService from './main-app/services/signalRNotificationService';
import { subscribeForPush } from './main-app/services/pushService';
import { normalizeNotificationType, getNotificationRoute, getNotificationActionLabel } from './main-app/utils/notificationRoutes';

// Notification types that show a green success toast
const SUCCESS_TYPES = new Set([
  'VisitApproved', 'OrderCompleted', 'WithdrawalCompleted',
  'BookingConfirmed', 'NegotiationAgreed', 'NegotiationBothAgreed',
  'ContractApproved', 'RefundApproved',
  'CommitmentConfirmed',
]);

// Notification types that show an amber warning toast
const WARN_TYPES = new Set([
  'WithdrawalRejected', 'DisputeUnderReview', 'BookingCommitmentExpired',
  'OrderCancelled', 'VisitCancelledByClient', 'VisitCancellationRequested',
  'RefundRejected', 'PaymentFailed', 'SubscriptionSuspended',
  'NegotiationAbandoned', 'ContractRejected',
]);

// Notification types that fire an info toast
const INFO_TYPES = new Set([
  'CaregiverCheckedIn', 'ObservationReportFiled', 'IncidentReported',
  'VisitRescheduled', 'WithdrawalVerified',
  'CareRequestCreated', 'CareRequestPaused', 'CareRequestReopened', 'CareRequestClosed',
  'CareRequestMatched', 'CareRequestNewResponder',
  'NewMessage', 'NewReview', 'ShortlistRemoved',
  'RefundRequested', 'DisputeRaised',
  'RefundRequestAdminAlert', 'ChatViolationFlagged',
  'TaskProposalAccepted', 'TaskProposalRejected', 'TaskProposalSubmitted',
  'ContractSent', 'ContractRevisionRequested', 'ContractPendingClientApproval',
]);

const CARE_REQUEST_TYPES = [
  'care_request_matched',
  'care_request_no_match',
  'care_request_admin_match_update',
  'care_request_admin_no_match',
];

// IDs already toasted this session — prevents duplicate toasts on reconnect
const toastedIds = new Set();

const NotificationPoller = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { notifications } = useSelector((state) => state.notifications);
  const seenIdsRef = useRef(new Set());
  const connectedRef = useRef(false);

  // ── SignalR connection: connect on login, disconnect on logout ──
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (connectedRef.current) {
        signalRNotificationService.disconnect();
        connectedRef.current = false;
        dispatch(clearNotifications());
      }
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    signalRNotificationService.onNotification((notification) => {
      dispatch(notificationReceived(notification));
      fireToast(notification, user?.role, navigate);
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

  // ── Re-subscribe when the SW rotates the push subscription ──
  useEffect(() => {
    if (!isAuthenticated || !('serviceWorker' in navigator)) return;

    const handleSWMessage = (event) => {
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        subscribeForPush().catch((err) =>
          console.warn('[NotificationPoller] Push re-subscribe failed:', err)
        );
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, [isAuthenticated]);

  return null;
};

// ── Real-time toast dispatcher ─────────────────────────────────────────────
// Fires outside the component to avoid stale-closure issues with navigate.
function fireToast(notification, userRole, navigate) {
  const notifId = notification?.id || notification?.Id;

  // Deduplicate — don't toast the same notification twice
  if (notifId && toastedIds.has(notifId)) return;
  if (notifId) toastedIds.add(notifId);

  const canonical = normalizeNotificationType(notification?.type);
  const route = getNotificationRoute(notification, userRole);
  const label = getNotificationActionLabel(notification?.type);
  const title = notification?.title || notification?.Title || label;

  // Build the toast content
  const toastContent = route ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      <button
        onClick={() => navigate(route)}
        style={{
          alignSelf: 'flex-start', cursor: 'pointer', padding: '2px 10px',
          borderRadius: 4, border: '1px solid currentColor', background: 'transparent',
          color: 'inherit', fontSize: 12, fontWeight: 600, marginTop: 2,
        }}
      >
        {label}
      </button>
    </div>
  ) : (
    <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
  );

  const toastOpts = {
    containerId: 'main-toast-container',
    autoClose: 6000,
    toastId: notifId || undefined,
  };

  if (SUCCESS_TYPES.has(canonical)) {
    toast.success(toastContent, toastOpts);
  } else if (WARN_TYPES.has(canonical)) {
    toast.warn(toastContent, toastOpts);
  } else if (INFO_TYPES.has(canonical)) {
    toast.info(toastContent, toastOpts);
  }
  // All other types → silent (bell badge only)
}

export default NotificationPoller;


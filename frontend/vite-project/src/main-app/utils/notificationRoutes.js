/**
 * Notification Route Resolver
 * 
 * Maps notification types + relatedEntityId to the correct
 * in-app route based on the user's role.
 * 
 * Used by NotificationBell and NotificationsPage to make
 * notifications clickable and navigate to the relevant page.
 */

/**
 * Given a notification object and the current user's role,
 * returns the path to navigate to, or null if no navigation applies.
 *
 * @param {Object} notification - The notification object from the API
 * @param {string} notification.type - Notification type (e.g. 'ContractSent', 'NewMessage')
 * @param {string} [notification.relatedEntityId] - The related entity ID (orderId, gigId, etc.)
 * @param {string} [notification.senderId] - The sender's user ID
 * @param {string} [notification.link] - Optional pre-built link from backend
 * @param {string} userRole - The current user's role ('Client', 'Caregiver', 'CareGiver', 'Admin')
 * @returns {string|null} The route path to navigate to, or null
 */
export const getNotificationRoute = (notification, userRole) => {
  if (!notification) return null;

  // If the backend provided a direct link, use it
  if (notification.link) {
    return notification.link;
  }

  const { type, relatedEntityId, senderId } = notification;
  const role = (userRole || '').toLowerCase();
  const isClient = role === 'client';
  const isCaregiver = role === 'caregiver';
  const isAdmin = role === 'admin';

  switch (type) {
    // ── Contract notifications ───────────────────────────
    case 'ContractSent':
    case 'ContractApproved':
    case 'ContractRejected':
    case 'ContractRevisionRequested':
      if (!relatedEntityId) return null;
      if (isClient) return `/app/client/my-order/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/order-details/${relatedEntityId}`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Message notifications ────────────────────────────
    case 'NewMessage':
    case 'Message':
    case 'MessageNotification':
    case 'chat':
      // Navigate to the conversation with the sender
      if (senderId) {
        if (isClient) return `/app/client/message/${senderId}`;
        if (isCaregiver) return `/app/caregiver/message/${senderId}`;
      }
      // Fallback to messages list
      if (isClient) return `/app/client/message`;
      if (isCaregiver) return `/app/caregiver/message`;
      return null;

    // ── Payment notifications ────────────────────────────
    case 'Payment':
      if (isClient) return `/app/client/payment`;
      if (isCaregiver) return `/app/caregiver/earnings`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Order / Booking notifications ────────────────────
    case 'OrderNotification':
    case 'BookingConfirmed':
    case 'OrderCompleted':
    case 'OrderDisputed':
      if (!relatedEntityId) return null;
      if (isClient) return `/app/client/my-order/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/order-details/${relatedEntityId}`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Review notifications ─────────────────────────────
    case 'NewReview':
      if (!relatedEntityId) return null;
      if (isClient) return `/app/client/my-order/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/order-details/${relatedEntityId}`;
      return null;

    // ── Gig notifications ────────────────────────────────
    case 'NewGig':
      if (relatedEntityId) return `/service/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/create-gigs`;
      return null;

    // ── Withdrawal notifications ─────────────────────────
    case 'WithdrawalRequest':
    case 'withdrawal':
      if (isCaregiver) return `/app/caregiver/withdraw`;
      if (isAdmin) return `/app/admin/withdrawals`;
      return null;

    // ── Verification notifications ───────────────────────
    case 'VerificationUpdate':
      if (isCaregiver) return `/app/caregiver/verification`;
      return null;

    // ── System / generic ─────────────────────────────────
    case 'SystemNotice':
    case 'SystemAlert':
      // SystemNotice with a relatedEntityId might be an order-related notice
      // (e.g. "New Review Received" is sent as SystemNotice with orderId)
      if (relatedEntityId) {
        if (isClient) return `/app/client/my-order/${relatedEntityId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${relatedEntityId}`;
      }
      return null;

    // ── Signup (admin only) ──────────────────────────────
    case 'Signup':
      if (isAdmin) return `/app/admin/users`;
      return null;

    default:
      return null;
  }
};

/**
 * Returns a user-friendly action label for the notification type.
 * Used for the "View Contract" / "Open Message" button text.
 */
export const getNotificationActionLabel = (type) => {
  switch (type) {
    case 'ContractSent':
      return 'View Contract';
    case 'ContractApproved':
    case 'ContractRejected':
    case 'ContractRevisionRequested':
      return 'View Contract';
    case 'NewMessage':
    case 'Message':
    case 'MessageNotification':
    case 'chat':
      return 'Open Conversation';
    case 'Payment':
      return 'View Payment';
    case 'OrderNotification':
    case 'BookingConfirmed':
    case 'OrderCompleted':
    case 'OrderDisputed':
      return 'View Order';
    case 'NewReview':
      return 'View Review';
    case 'NewGig':
      return 'View Gig';
    case 'WithdrawalRequest':
    case 'withdrawal':
      return 'View Withdrawal';
    case 'VerificationUpdate':
      return 'View Verification';
    default:
      return 'View Details';
  }
};

/**
 * Returns the emoji/icon for each notification type.
 * Centralized so both NotificationBell and NotificationsPage use the same icons.
 */
export const getNotificationTypeIcon = (type) => {
  switch (type) {
    case 'NewMessage':
    case 'Message':
    case 'MessageNotification':
    case 'chat':
      return '💬';
    case 'Payment':
      return '💰';
    case 'SystemNotice':
    case 'SystemAlert':
      return '📢';
    case 'NewGig':
      return '🛠️';
    case 'Signup':
      return '👋';
    case 'ContractSent':
      return '📋';
    case 'ContractApproved':
      return '✅';
    case 'ContractRejected':
      return '❌';
    case 'ContractRevisionRequested':
      return '📝';
    case 'OrderNotification':
    case 'BookingConfirmed':
      return '🛒';
    case 'OrderCompleted':
      return '🎉';
    case 'OrderDisputed':
      return '⚠️';
    case 'NewReview':
      return '⭐';
    case 'WithdrawalRequest':
    case 'withdrawal':
      return '💸';
    case 'VerificationUpdate':
      return '🔒';
    default:
      return '🔔';
  }
};

/**
 * Notification Route Resolver
 * 
 * Maps notification types + relatedEntityId to the correct
 * in-app route based on the user's role.
 * 
 * Used by NotificationBell and NotificationsPage to make
 * notifications clickable and navigate to the relevant page.
 */

// ── Explicit map from every known variant → canonical PascalCase type ──
// Backend uses snake_case constants (NotificationTypes.*) since the DB migration.
// Frontend code historically used PascalCase. This map bridges both.
const TYPE_MAP = {
  // Contract
  'contract_sent':               'ContractSent',
  'contractsent':                'ContractSent',
  'contract sent':               'ContractSent',
  'contract_pending_approval':   'ContractSent',
  'contract_approved':           'ContractApproved',
  'contractapproved':            'ContractApproved',
  'contract approved':           'ContractApproved',
  'contract_client_approved':    'ContractApproved',
  'contractclientapproved':      'ContractApproved',
  'contract client approved':    'ContractApproved',
  'contract_rejected':           'ContractRejected',
  'contractrejected':            'ContractRejected',
  'contract rejected':           'ContractRejected',
  'contract_revision_requested': 'ContractRevisionRequested',
  'contractrevisionrequested':   'ContractRevisionRequested',
  'contract revision requested': 'ContractRevisionRequested',
  'contract_review_requested':   'ContractRevisionRequested',
  'contractreviewrequested':     'ContractRevisionRequested',
  'contract review requested':   'ContractRevisionRequested',
  'contract_revision':           'ContractRevisionRequested',

  // Message / Chat
  'chat_message':                'NewMessage',
  'chat message':                'NewMessage',
  'new_message':                 'NewMessage',
  'new message':                 'NewMessage',
  'newmessage':                  'NewMessage',
  'message':                     'NewMessage',
  'message_notification':        'NewMessage',
  'message notification':        'NewMessage',
  'messagenotification':         'NewMessage',
  'chat':                        'NewMessage',

  // Payment (multiple backend constants map here)
  'payment':                     'Payment',
  'payment_received':            'PaymentReceived',
  'paymentreceived':             'PaymentReceived',
  'payment_confirmed':           'PaymentConfirmed',
  'paymentconfirmed':            'PaymentConfirmed',
  'payment_notification':        'Payment',
  'order_payment':               'OrderPayment',
  'orderpayment':                'OrderPayment',
  'refund_processed':            'RefundProcessed',
  'refundprocessed':             'RefundProcessed',
  'earnings_added':              'EarningsAdded',
  'earningsadded':               'EarningsAdded',

  // Order / Booking
  'order_notification':          'OrderNotification',
  'ordernotification':           'OrderNotification',
  'order notification':          'OrderNotification',
  'order_update':                'OrderNotification',
  'order update':                'OrderNotification',
  'order_received':              'OrderNotification',
  'orderreceived':               'OrderNotification',
  'order received':              'OrderNotification',
  'order_confirmation':          'OrderConfirmation',
  'orderconfirmation':           'OrderConfirmation',
  'order_cancelled':             'OrderCancelled',
  'ordercancelled':              'OrderCancelled',
  'booking_confirmed':           'BookingConfirmed',
  'bookingconfirmed':            'BookingConfirmed',
  'order_completed':             'OrderCompleted',
  'ordercompleted':              'OrderCompleted',
  'order_disputed':              'OrderDisputed',
  'orderdisputed':               'OrderDisputed',

  // Review
  'new_review':                  'NewReview',
  'newreview':                   'NewReview',
  'review':                      'NewReview',

  // Gig
  'new_gig':                     'NewGig',
  'newgig':                      'NewGig',
  'gig_created':                 'NewGig',

  // Withdrawal
  'withdrawal_request':          'WithdrawalRequest',
  'withdrawalrequest':           'WithdrawalRequest',
  'withdrawal request':          'WithdrawalRequest',
  'withdrawal':                  'WithdrawalRequest',

  // Verification
  'verification_update':         'VerificationUpdate',
  'verificationupdate':          'VerificationUpdate',
  'verification.completed':      'VerificationUpdate',
  'verification.failed':         'VerificationUpdate',
  'verification.submitted':      'VerificationUpdate',
  'verification_completed':      'VerificationUpdate',
  'verification_failed':         'VerificationUpdate',
  'verification_submitted':      'VerificationUpdate',
  'identity_verification':       'VerificationUpdate',

  // System
  'system_notice':               'SystemNotice',
  'systemnotice':                'SystemNotice',
  'system_alert':                'SystemAlert',
  'systemalert':                 'SystemAlert',
  'system':                      'SystemNotice',

  // Signup
  'signup':                      'Signup',
  'new_signup':                  'Signup',
  'user_signup':                 'Signup',

  // Misc
  'caregiver_report':            'SystemNotice',
};

// Set of all canonical types for fast exact-match check
const KNOWN_CANONICAL = new Set([
  'ContractSent', 'ContractApproved', 'ContractRejected', 'ContractRevisionRequested',
  'NewMessage', 'Payment', 'PaymentReceived', 'PaymentConfirmed', 'OrderPayment',
  'RefundProcessed', 'EarningsAdded',
  'OrderNotification', 'OrderConfirmation', 'OrderCancelled', 'BookingConfirmed',
  'OrderCompleted', 'OrderDisputed',
  'NewReview', 'NewGig', 'WithdrawalRequest', 'VerificationUpdate',
  'SystemNotice', 'SystemAlert', 'Signup',
]);

/**
 * Converts a snake_case or dot.notation string to PascalCase.
 * e.g. "order_completed" → "OrderCompleted", "verification.failed" → "VerificationFailed"
 */
const toPascalCase = (str) =>
  str
    .split(/[\s_.]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

/**
 * Normalizes notification type strings from any backend/frontend format
 * into the canonical PascalCase values used by the routing switch.
 *
 * Resolution order:
 * 1. Exact canonical match (already PascalCase)
 * 2. Explicit map lookup (lowercase)
 * 3. Auto-convert snake_case/dot.notation → PascalCase
 * 4. Fall back to original string
 *
 * @param {string} type - The raw notification type from the API
 * @returns {string} The normalized canonical type
 */
export const normalizeNotificationType = (type) => {
  if (!type) return '';

  // 1. Already canonical
  if (KNOWN_CANONICAL.has(type)) return type;

  const lower = type.toLowerCase().trim();

  // 2. Explicit map
  if (TYPE_MAP[lower]) return TYPE_MAP[lower];

  // 3. Auto-convert snake_case / dot.notation → PascalCase and check
  const pascal = toPascalCase(lower);
  if (KNOWN_CANONICAL.has(pascal)) return pascal;

  // 4. Fallback — log so we can catch unmapped types during development
  console.warn(`[NotificationRoutes] Unknown notification type: "${type}" (normalized: "${pascal}")`);
  return pascal; // Still return PascalCase even if not in our known set
};

/**
 * Given a notification object and the current user's role,
 * returns the path to navigate to, or null if no navigation applies.
 *
 * @param {Object} notification - The notification object from the API
 * @param {string} notification.type - Notification type (e.g. 'ContractSent', 'NewMessage')
 * @param {string} [notification.relatedEntityId] - The related entity ID (orderId, gigId, etc.)
 * @param {string} [notification.orderId] - Fallback entity ID from backend
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

  const type = normalizeNotificationType(notification.type);
  // Use relatedEntityId, fall back to orderId (backend sometimes sends orderId separately)
  const relatedEntityId = notification.relatedEntityId || notification.orderId;
  const senderId = notification.senderId;
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
    case 'PaymentReceived':
    case 'PaymentConfirmed':
    case 'OrderPayment':
    case 'RefundProcessed':
      if (isClient) return `/app/client/payment`;
      if (isCaregiver) return `/app/caregiver/earnings`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Earnings notifications (caregiver) ───────────────
    case 'EarningsAdded':
      if (isCaregiver) return `/app/caregiver/earnings`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Order / Booking notifications ────────────────────
    case 'OrderNotification':
    case 'OrderConfirmation':
    case 'BookingConfirmed':
    case 'OrderCompleted':
    case 'OrderDisputed':
    case 'OrderCancelled':
      if (!relatedEntityId) {
        // Even without a specific order, route to the orders list
        if (isClient) return `/app/client/my-orders`;
        if (isCaregiver) return `/app/caregiver/orders`;
        if (isAdmin) return `/app/admin/orders`;
        return null;
      }
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
      console.warn(`[NotificationRoutes] No route for type: "${type}" (raw: "${notification.type}")`, notification);
      return null;
  }
};

/**
 * Returns a user-friendly action label for the notification type.
 * Used for the "View Contract" / "Open Message" button text.
 */
export const getNotificationActionLabel = (rawType) => {
  const type = normalizeNotificationType(rawType);
  switch (type) {
    case 'ContractSent':
    case 'ContractApproved':
    case 'ContractRejected':
    case 'ContractRevisionRequested':
      return 'View Contract';
    case 'NewMessage':
      return 'Open Conversation';
    case 'Payment':
    case 'PaymentReceived':
    case 'PaymentConfirmed':
    case 'OrderPayment':
    case 'RefundProcessed':
    case 'EarningsAdded':
      return 'View Payment';
    case 'OrderNotification':
    case 'OrderConfirmation':
    case 'BookingConfirmed':
    case 'OrderCompleted':
    case 'OrderDisputed':
    case 'OrderCancelled':
      return 'View Order';
    case 'NewReview':
      return 'View Review';
    case 'NewGig':
      return 'View Gig';
    case 'WithdrawalRequest':
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
export const getNotificationTypeIcon = (rawType) => {
  const type = normalizeNotificationType(rawType);
  switch (type) {
    case 'NewMessage':
      return '💬';
    case 'Payment':
    case 'PaymentReceived':
    case 'PaymentConfirmed':
    case 'OrderPayment':
      return '💰';
    case 'EarningsAdded':
      return '💵';
    case 'RefundProcessed':
      return '🔄';
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
    case 'OrderConfirmation':
    case 'BookingConfirmed':
      return '🛒';
    case 'OrderCompleted':
      return '🎉';
    case 'OrderDisputed':
      return '⚠️';
    case 'OrderCancelled':
      return '🚫';
    case 'NewReview':
      return '⭐';
    case 'WithdrawalRequest':
      return '💸';
    case 'VerificationUpdate':
      return '🔒';
    default:
      return '🔔';
  }
};

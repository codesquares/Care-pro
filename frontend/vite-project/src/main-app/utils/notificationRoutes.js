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
  'refund_requested':            'RefundRequested',
  'refundrequested':             'RefundRequested',
  'refund_approved':             'RefundApproved',
  'refundapproved':              'RefundApproved',
  'refund_rejected':             'RefundRejected',
  'refundrejected':              'RefundRejected',
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

  // Gig lifecycle
  'new_gig':                     'NewGig',
  'newgig':                      'NewGig',
  'gig_created':                 'NewGig',
  'gig_published':               'GigPublished',
  'gigpublished':                'GigPublished',
  'gig published':               'GigPublished',
  'draft_generated':             'DraftGenerated',
  'draftgenerated':              'DraftGenerated',
  'draft generated':             'DraftGenerated',
  'draft_saved':                 'DraftGenerated',
  'draftsaved':                  'DraftGenerated',
  'draft saved':                 'DraftGenerated',
  'gig_paused':                  'GigPaused',
  'gigpaused':                   'GigPaused',
  'gig paused':                  'GigPaused',
  'gig_shared':                  'GigShared',
  'gigshared':                   'GigShared',
  'gig shared':                  'GigShared',
  'gig_deleted':                 'GigDeleted',
  'gigdeleted':                  'GigDeleted',
  'gig deleted':                 'GigDeleted',

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

  // Care Request Matching
  'care_request_matched':              'CareRequestMatched',
  'carerequestmatched':                'CareRequestMatched',
  'care_request_no_match':             'CareRequestNoMatch',
  'carerequestnomatch':                'CareRequestNoMatch',
  'care_request_admin_match_update':   'CareRequestAdminMatchUpdate',
  'carerequestadminmatchupdate':       'CareRequestAdminMatchUpdate',
  'care_request_admin_no_match':       'CareRequestAdminNoMatch',
  'carerequestadminnomatch':           'CareRequestAdminNoMatch',
  'care_request_new_responder':        'CareRequestNewResponder',
  'carerequestnewresponder':           'CareRequestNewResponder',
  'care request new responder':        'CareRequestNewResponder',

  // Negotiation
  'negotiation_started':          'NegotiationStarted',
  'negotiationstarted':           'NegotiationStarted',
  'negotiation started':          'NegotiationStarted',
  'negotiation_counter':          'NegotiationCounter',
  'negotiationcounter':           'NegotiationCounter',
  'negotiation counter':          'NegotiationCounter',
  'negotiation_agreed':           'NegotiationAgreed',
  'negotiationagreed':            'NegotiationAgreed',
  'negotiation agreed':           'NegotiationAgreed',
  'negotiation_converted':        'NegotiationConverted',
  'negotiationconverted':         'NegotiationConverted',
  'negotiation converted':        'NegotiationConverted',
  'negotiation_abandoned':        'NegotiationAbandoned',
  'negotiationabandoned':         'NegotiationAbandoned',
  'negotiation abandoned':        'NegotiationAbandoned',
  'negotiation_both_agreed':      'NegotiationBothAgreed',
  'negotiationbothagreed':        'NegotiationBothAgreed',
  'negotiation both agreed':      'NegotiationBothAgreed',
  'negotiation_caregiver_agreed': 'NegotiationCaregiverAgreed',
  'negotiationcaregiveragreed':   'NegotiationCaregiverAgreed',
  'negotiation caregiver agreed': 'NegotiationCaregiverAgreed',
  'negotiation_caregiver_submitted': 'NegotiationCaregiverSubmitted',
  'negotiationcaregiversubmitted':   'NegotiationCaregiverSubmitted',
  'negotiation caregiver submitted': 'NegotiationCaregiverSubmitted',
  'negotiation_client_agreed':    'NegotiationClientAgreed',
  'negotiationclientagreed':      'NegotiationClientAgreed',
  'negotiation client agreed':    'NegotiationClientAgreed',
  'negotiation_client_submitted': 'NegotiationClientSubmitted',
  'negotiationclientsubmitted':   'NegotiationClientSubmitted',
  'negotiation client submitted': 'NegotiationClientSubmitted',

  // Task Proposal
  'task_proposal_accepted':       'TaskProposalAccepted',
  'taskproposalaccepted':         'TaskProposalAccepted',
  'task proposal accepted':       'TaskProposalAccepted',
  'task_proposal_rejected':       'TaskProposalRejected',
  'taskproposalrejected':         'TaskProposalRejected',
  'task proposal rejected':       'TaskProposalRejected',
  'task_proposal_submitted':      'TaskProposalSubmitted',
  'taskproposalsubmitted':        'TaskProposalSubmitted',
  'task proposal submitted':      'TaskProposalSubmitted',

  // Visit / Task Sheet
  'visit_submitted':             'VisitSubmitted',
  'visitsubmitted':              'VisitSubmitted',
  'visit submitted':             'VisitSubmitted',
  'visit_completed':             'VisitSubmitted',
  'visit_approved':              'VisitApproved',
  'visitapproved':               'VisitApproved',
  'visit approved':              'VisitApproved',

  // Visit cancellation
  'visit_cancelled_by_client':      'VisitCancelledByClient',
  'visitcancelledbyclient':         'VisitCancelledByClient',
  'visit cancelled by client':      'VisitCancelledByClient',
  'visit_cancellation_requested':   'VisitCancellationRequested',
  'visitcancellationrequested':     'VisitCancellationRequested',
  'visit cancellation requested':   'VisitCancellationRequested',

  // Misc
  'caregiver_report':            'SystemNotice',

  // Broadcast
  'broadcast':                   'Broadcast',

  // Gig Deletion (GDPR)
  'gig_deletion_reminder':       'GigDeletionReminder',
  'gigdeletionreminder':         'GigDeletionReminder',
  'gig deletion reminder':       'GigDeletionReminder',
  'gig_permanently_deleted':     'GigPermanentlyDeleted',
  'gigpermanentlydeleted':       'GigPermanentlyDeleted',
  'gig permanently deleted':     'GigPermanentlyDeleted',

  // Disputes
  'dispute_raised':              'DisputeRaised',
  'disputeraised':               'DisputeRaised',
  'dispute raised':              'DisputeRaised',

  // Subscriptions
  'subscription_terminated':     'SubscriptionTerminated',
  'subscriptionterminated':      'SubscriptionTerminated',
  'subscription terminated':     'SubscriptionTerminated',
  'subscription_created':        'SubscriptionCreated',
  'subscriptioncreated':         'SubscriptionCreated',
  'subscription created':        'SubscriptionCreated',

  // Payment failures
  'payment_failed':              'PaymentFailed',
  'paymentfailed':               'PaymentFailed',
  'payment failed':              'PaymentFailed',

  // Subscription lifecycle (in addition to created/terminated above)
  'subscription_suspended':      'SubscriptionSuspended',
  'subscriptionsuspended':       'SubscriptionSuspended',
  'subscription suspended':      'SubscriptionSuspended',
  'subscription_past_due':       'SubscriptionSuspended',
  'subscriptionpastdue':         'SubscriptionSuspended',
  'subscription past due':       'SubscriptionSuspended',

  // Contract extras
  'contract_pending_client_approval': 'ContractPendingClientApproval',
  'contractpendingclientapproval':    'ContractPendingClientApproval',
  'contract pending client approval': 'ContractPendingClientApproval',
  'contract_revised':            'ContractRevised',
  'contractrevised':             'ContractRevised',
  'contract revised':            'ContractRevised',

  // Commitment fee
  'commitment_confirmed':        'CommitmentConfirmed',
  'commitmentconfirmed':         'CommitmentConfirmed',
  'commitment confirmed':        'CommitmentConfirmed',

  // Account Deletion
  'account_deletion_scheduled':   'AccountDeletionScheduled',
  'accountdeletionscheduled':     'AccountDeletionScheduled',
  'account deletion scheduled':   'AccountDeletionScheduled',
  'account_deletion_cancelled':   'AccountDeletionCancelled',
  'accountdeletioncancelled':     'AccountDeletionCancelled',
  'account deletion cancelled':   'AccountDeletionCancelled',
  'account_permanently_deleted':  'AccountPermanentlyDeleted',
  'accountpermanentlydeleted':    'AccountPermanentlyDeleted',
  'account permanently deleted':  'AccountPermanentlyDeleted',

  // Certificate
  'certificate_uploaded':         'CertificateUploaded',
  'certificateuploaded':          'CertificateUploaded',
  'certificate uploaded':         'CertificateUploaded',
  'certificate_verification':     'CertificateVerification',
  'certificateverification':      'CertificateVerification',
  'certificate verification':     'CertificateVerification',
  'certificate_approved':         'CertificateVerification',
  'certificateapproved':          'CertificateVerification',
  'certificate_rejected':         'CertificateVerification',
  'certificaterejected':          'CertificateVerification',
  'certificate_review_required':  'CertificateVerification',
  'certificatereviewrequired':    'CertificateVerification',

  // Visit Rescheduled
  'visit_rescheduled':             'VisitRescheduled',
  'visitrescheduled':              'VisitRescheduled',
  'visit rescheduled':             'VisitRescheduled',

  // Caregiver Checked In
  'caregiver_checked_in':          'CaregiverCheckedIn',
  'caregivercheckedin':            'CaregiverCheckedIn',
  'caregiver checked in':          'CaregiverCheckedIn',

  // Dispute Under Review
  'dispute_under_review':          'DisputeUnderReview',
  'disputeunderreview':            'DisputeUnderReview',
  'dispute under review':          'DisputeUnderReview',

  // Incident Reported
  'incident_reported':             'IncidentReported',
  'incidentreported':              'IncidentReported',
  'incident reported':             'IncidentReported',

  // Observation Report Filed
  'observation_report_filed':      'ObservationReportFiled',
  'observationreportfiled':        'ObservationReportFiled',
  'observation report filed':      'ObservationReportFiled',

  // Care Request lifecycle (client)
  'care_request_created':          'CareRequestCreated',
  'carerequestcreated':            'CareRequestCreated',
  'care request created':          'CareRequestCreated',
  'care_request_paused':           'CareRequestPaused',
  'carerequestpaused':             'CareRequestPaused',
  'care request paused':           'CareRequestPaused',
  'care_request_reopened':         'CareRequestReopened',
  'carequestreopened':             'CareRequestReopened',
  'care request reopened':         'CareRequestReopened',
  'care_request_closed':           'CareRequestClosed',
  'carerequestclosed':             'CareRequestClosed',
  'care request closed':           'CareRequestClosed',

  // Shortlist Removed (caregiver)
  'care_request_shortlist_removed': 'ShortlistRemoved',
  'shortlistremoved':               'ShortlistRemoved',
  'care request shortlist removed': 'ShortlistRemoved',

  // Booking Commitment Expired (client)
  'booking_commitment_expired':    'BookingCommitmentExpired',
  'bookingcommitmentexpired':      'BookingCommitmentExpired',
  'booking commitment expired':    'BookingCommitmentExpired',

  // Withdrawal lifecycle (caregiver)
  'withdrawal_verified':           'WithdrawalVerified',
  'withdrawalverified':            'WithdrawalVerified',
  'withdrawal verified':           'WithdrawalVerified',
  'withdrawal_completed':          'WithdrawalCompleted',
  'withdrawalcompleted':           'WithdrawalCompleted',
  'withdrawal completed':          'WithdrawalCompleted',
  'withdrawal_rejected':           'WithdrawalRejected',
  'withdrawalrejected':            'WithdrawalRejected',
  'withdrawal rejected':           'WithdrawalRejected',

  // Refund Request Admin Alert
  'refund_request_admin_alert':    'RefundRequestAdminAlert',
  'refundrequestadminalert':       'RefundRequestAdminAlert',
  'refund request admin alert':    'RefundRequestAdminAlert',

  // Chat Violation Flagged (admin)
  'chat_violation_flagged':        'ChatViolationFlagged',
  'chatviolationflagged':          'ChatViolationFlagged',
  'chat violation flagged':        'ChatViolationFlagged',
};

// Set of all canonical types for fast exact-match check
const KNOWN_CANONICAL = new Set([
  'ContractSent', 'ContractApproved', 'ContractRejected', 'ContractRevisionRequested',
  'NewMessage', 'Payment', 'PaymentReceived', 'PaymentConfirmed', 'OrderPayment',
  'RefundProcessed', 'EarningsAdded',
  'RefundRequested', 'RefundApproved', 'RefundRejected',
  'OrderNotification', 'OrderConfirmation', 'OrderCancelled', 'BookingConfirmed',
  'OrderCompleted', 'OrderDisputed',
  'NewReview', 'NewGig',
  'GigPublished', 'DraftGenerated', 'GigPaused', 'GigShared', 'GigDeleted',
  'WithdrawalRequest', 'VerificationUpdate',
  'SystemNotice', 'SystemAlert', 'Signup',
  'CareRequestMatched', 'CareRequestNoMatch',
  'CareRequestAdminMatchUpdate', 'CareRequestAdminNoMatch',
  'CareRequestNewResponder',
  'NegotiationStarted', 'NegotiationCounter', 'NegotiationAgreed',
  'NegotiationConverted', 'NegotiationAbandoned',
  'NegotiationBothAgreed', 'NegotiationCaregiverAgreed', 'NegotiationCaregiverSubmitted',
  'NegotiationClientAgreed', 'NegotiationClientSubmitted',
  'TaskProposalAccepted', 'TaskProposalRejected', 'TaskProposalSubmitted',
  'VisitSubmitted',
  'VisitApproved',
  'VisitCancelledByClient',
  'VisitCancellationRequested',
  'Broadcast',
  'GigDeletionReminder', 'GigPermanentlyDeleted',
  'DisputeRaised',
  'SubscriptionTerminated', 'SubscriptionCreated', 'SubscriptionSuspended',
  'PaymentFailed',
  'ContractPendingClientApproval', 'ContractRevised',
  'CommitmentConfirmed',
  'CertificateUploaded', 'CertificateVerification',
  'AccountDeletionScheduled', 'AccountDeletionCancelled', 'AccountPermanentlyDeleted',
  'VisitRescheduled',
  'CaregiverCheckedIn',
  'DisputeUnderReview',
  'IncidentReported',
  'ObservationReportFiled',
  'CareRequestCreated', 'CareRequestPaused', 'CareRequestReopened', 'CareRequestClosed',
  'ShortlistRemoved',
  'BookingCommitmentExpired',
  'WithdrawalVerified', 'WithdrawalCompleted', 'WithdrawalRejected',
  'RefundRequestAdminAlert',
  'ChatViolationFlagged',
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
    // relatedEntityId may be a contract ID (backend-generated notifications),
    // so prefer notification.orderId when available for routing to the order page
    case 'ContractSent':
    case 'ContractApproved':
    case 'ContractRejected':
    case 'ContractRevisionRequested': {
      const contractOrderId = notification.orderId || relatedEntityId;
      if (contractOrderId) {
        if (isClient) return `/app/client/my-order/${contractOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${contractOrderId}`;
      }
      // Fallback to orders list when no ID is available
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      if (isAdmin) return `/app/admin/orders`;
      return null;
    }

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
      if (isClient) return `/app/client/payment`;
      if (isCaregiver) return `/app/caregiver/earnings`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    case 'RefundProcessed':
    case 'RefundRequested':
    case 'RefundApproved':
    case 'RefundRejected':
      if (isClient) return `/app/client/wallet`;
      if (isAdmin) return `/app/admin/refunds`;
      return null;

    // ── Earnings notifications (caregiver) ───────────────
    case 'EarningsAdded':
      if (isCaregiver) return `/app/caregiver/earnings`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    // ── Commitment fee confirmed ──────────────────────────
    // senderId = the other party in the conversation
    // relatedEntityId = gigId (fallback only)
    case 'CommitmentConfirmed':
      if (isClient) {
        // Client paid — CTA is to chat with the caregiver (senderId = caregiver)
        if (senderId) return `/app/client/message/${senderId}`;
        return `/app/client/message`;
      }
      if (isCaregiver) {
        // Caregiver notified — CTA is to open the conversation with the client (senderId = client)
        if (senderId) return `/app/caregiver/message/${senderId}`;
        return `/app/caregiver/message`;
      }
      // Last-resort deep link to the gig page
      if (relatedEntityId) return `/service/${relatedEntityId}`;
      return null;

    // ── Certificate notifications ────────────────────────
    // Caregivers land on their profile (Certifications section).
    // Admin has no in-app destination here.
    case 'CertificateUploaded':
    case 'CertificateVerification':
      if (isCaregiver) return `/app/caregiver/profile`;
      return null;

    // ── Order / Booking notifications ────────────────────
    case 'OrderNotification':
    case 'OrderConfirmation':
    case 'BookingConfirmed':
    case 'OrderDisputed':
    case 'OrderCancelled':
      if (relatedEntityId) {
        if (isClient) return `/app/client/my-order/${relatedEntityId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${relatedEntityId}`;
        if (isAdmin) return `/app/admin/orders`;
        return null;
      }
      // Even without a specific order, route to the orders list
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      if (isAdmin) return `/app/admin/orders`;
      return null;

    case 'OrderCompleted': {
      // Caregiver → wallet (credit just landed); Client → order detail
      if (isCaregiver) return `/app/caregiver/wallet`;
      if (relatedEntityId && isClient) return `/app/client/my-order/${relatedEntityId}`;
      if (isClient) return `/app/client/my-orders`;
      if (isAdmin) return `/app/admin/orders`;
      return null;
    }

    // ── Review notifications ─────────────────────────────
    case 'NewReview':
      // Caregiver → dedicated reviews page (GET /api/reviews/caregiver/{id})
      if (isCaregiver) return `/app/caregiver/profile/reviews`;
      if (relatedEntityId && isClient) return `/app/client/my-order/${relatedEntityId}`;
      if (isClient) return `/app/client/my-orders`;
      return null;

    // ── Gig notifications ────────────────────────────────
    case 'NewGig':
      if (relatedEntityId) return `/service/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/create-gigs`;
      return null;

    // relatedEntityId = gig ID for all gig lifecycle types
    case 'GigPublished':
    case 'GigShared': // reserved — handle gracefully when it ships
      if (relatedEntityId && isCaregiver) return `/service/${relatedEntityId}`;
      if (isCaregiver) return `/app/caregiver/profile`;
      return null;

    case 'DraftGenerated':
    case 'GigPaused':
    case 'GigDeleted':
      if (isCaregiver) return `/app/caregiver/profile`;
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
      // Fallback to notifications page
      if (isClient) return `/app/client/notifications`;
      if (isCaregiver) return `/app/caregiver/notifications`;
      return null;

    // ── Broadcast ────────────────────────────────────────
    case 'Broadcast':
      if (isClient) return `/app/client/notifications`;
      if (isCaregiver) return `/app/caregiver/notifications`;
      if (isAdmin) return `/app/admin/notifications`;
      return null;

    // ── Care Request Matching ─────────────────────────
    case 'CareRequestMatched':
      if (isClient && relatedEntityId) return `/app/client/care-requests/${relatedEntityId}/matches`;
      if (isClient) return `/app/client/care-requests`;
      return null;

    case 'CareRequestNoMatch':
      if (isClient && relatedEntityId) return `/app/client/care-requests/${relatedEntityId}/matches`;
      if (isClient) return `/app/client/care-requests`;
      return null;

    case 'CareRequestAdminMatchUpdate':
    case 'CareRequestAdminNoMatch':
      if (isAdmin && relatedEntityId) return `/app/admin/care-requests/${relatedEntityId}`;
      if (isAdmin) return `/app/admin/care-requests`;
      return null;

    // ── Care Request: New Responder (caregiver responded to a request) ─
    case 'CareRequestNewResponder':
      if (isClient && relatedEntityId) return `/app/client/care-requests/${relatedEntityId}/matches`;
      if (isClient) return `/app/client/care-requests`;
      if (isAdmin && relatedEntityId) return `/app/admin/care-requests/${relatedEntityId}`;
      if (isAdmin) return `/app/admin/care-requests`;
      return null;

    // ── Negotiation notifications ─────────────────────────
    case 'NegotiationStarted':
    case 'NegotiationCounter':
    case 'NegotiationAgreed':
    case 'NegotiationConverted':
    case 'NegotiationAbandoned':
    case 'NegotiationBothAgreed':
    case 'NegotiationCaregiverAgreed':
    case 'NegotiationCaregiverSubmitted':
    case 'NegotiationClientAgreed':
    case 'NegotiationClientSubmitted': {
      const negOrderId = notification.orderId || relatedEntityId;
      if (negOrderId) {
        if (isClient) return `/app/client/my-order/${negOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${negOrderId}`;
      }
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      return null;
    }

    // ── Task Proposal notifications ──────────────────────
    case 'TaskProposalAccepted':
    case 'TaskProposalRejected':
    case 'TaskProposalSubmitted': {
      const proposalOrderId = notification.orderId || relatedEntityId;
      if (proposalOrderId) {
        if (isClient) return `/app/client/my-order/${proposalOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${proposalOrderId}`;
      }
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      return null;
    }

    // ── Visit / Task Sheet notifications ─────────────────
    case 'VisitApproved': {
      // Caregiver goes to wallet (payment just arrived).
      // Client goes to the order details page.
      if (isCaregiver) return `/app/caregiver/wallet`;
      if (isClient) {
        const visitOrderId = notification.orderId || relatedEntityId;
        if (visitOrderId) return `/app/client/my-order/${visitOrderId}`;
        return `/app/client/my-orders`;
      }
      return null;
    }

    case 'VisitSubmitted':
    case 'VisitCancelledByClient':
    case 'VisitCancellationRequested': {
      const visitOrderId = notification.orderId || relatedEntityId;
      if (visitOrderId) {
        if (isClient) return `/app/client/my-order/${visitOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${visitOrderId}`;
      }
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      return null;
    }

    // ── Signup (admin only) ──────────────────────────────
    case 'Signup':
      if (isAdmin) return `/app/admin/users`;
      return null;

    // ── Gig Deletion (GDPR) ──────────────────────────────
    case 'GigDeletionReminder':
      // Deep-link caregivers to deleted gigs tab to restore
      if (isCaregiver) return `/app/caregiver/profile?tab=deleted`;
      return null;

    case 'GigPermanentlyDeleted':
      // Informational only — link to profile gigs section
      if (isCaregiver) return `/app/caregiver/profile`;
      return null;

    // ── Disputes ─────────────────────────────────────────
    case 'DisputeRaised': {
      const disputeOrderId = notification.orderId || relatedEntityId;
      if (disputeOrderId) {
        if (isClient) return `/app/client/my-order/${disputeOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${disputeOrderId}`;
        if (isAdmin) return `/app/admin/orders/${disputeOrderId}`;
      }
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      if (isAdmin) return `/app/admin/orders`;
      return null;
    }

    // ── Subscriptions ────────────────────────────────────
    case 'SubscriptionTerminated':
    case 'SubscriptionCreated':
      if (isClient) return `/app/client/subscriptions`;
      if (isAdmin) return `/app/admin/subscriptions`;
      return null;

    // ── Payment failures ─────────────────────────────────
    // PaymentFailed notifications are emitted by the recurring-subscription
    // auto-charge flow. relatedEntityId on these is a Subscriptions._id, NOT a
    // ClientOrders._id. Backend now also populates `orderId` with the
    // originating ClientOrders._id (Subscriptions.OriginalOrderId) when known.
    // Defense in depth: only route to /my-order/{id} when notification.orderId
    // is explicitly set; otherwise fall back to subscriptions/payment pages
    // rather than blindly using relatedEntityId (which would 404).
    case 'PaymentFailed':
    case 'SubscriptionSuspended': {
      const failedOrderId = notification.orderId; // do NOT fall back to relatedEntityId here
      if (failedOrderId) {
        if (isClient) return `/app/client/my-order/${failedOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${failedOrderId}`;
        if (isAdmin) return `/app/admin/orders/${failedOrderId}`;
      }
      // No reliable order id — route to the subscriptions/payment area instead
      if (isClient) return `/app/client/subscriptions`;
      if (isAdmin) return `/app/admin/subscriptions`;
      return null;
    }

    // ── Contract extras ──────────────────────────────────
    case 'ContractPendingClientApproval':
    case 'ContractRevised': {
      const contractOrderId = notification.orderId || relatedEntityId;
      if (contractOrderId) {
        if (isClient) return `/app/client/my-order/${contractOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${contractOrderId}`;
        if (isAdmin) return `/app/admin/orders/${contractOrderId}`;
      }
      if (isClient) return `/app/client/my-orders`;
      if (isCaregiver) return `/app/caregiver/orders`;
      if (isAdmin) return `/app/admin/orders`;
      return null;
    }

    // ── Account Deletion ─────────────────────────────────────────────
    case 'AccountDeletionScheduled':
      // Route to settings so the user can see/cancel their pending deletion
      if (isClient) return `/app/client/settings`;
      if (isCaregiver) return `/app/caregiver/settings`;
      return null;

    case 'AccountDeletionCancelled':
      // Informational — route to settings as confirmation
      if (isClient) return `/app/client/settings`;
      if (isCaregiver) return `/app/caregiver/settings`;
      return null;

    case 'AccountPermanentlyDeleted':
      // Email-only notification — no in-app destination
      return null;

    // ── Visit Rescheduled ────────────────────────────────
    case 'VisitRescheduled': {
      // Backend: use orderId (not relatedEntityId which is the taskSheetId)
      const reschOrderId = notification.orderId || relatedEntityId;
      if (reschOrderId && isCaregiver) return `/app/caregiver/order-details/${reschOrderId}`;
      if (isCaregiver) return `/app/caregiver/orders`;
      return null;
    }

    // ── Caregiver Checked In ─────────────────────────────
    case 'CaregiverCheckedIn': {
      const checkinOrderId = notification.orderId || relatedEntityId;
      if (checkinOrderId && isClient) return `/app/client/my-order/${checkinOrderId}`;
      if (isClient) return `/app/client/my-order`;
      return null;
    }

    // ── Dispute Under Review ─────────────────────────────
    case 'DisputeUnderReview': {
      const disputeOrderId = notification.orderId || relatedEntityId;
      if (disputeOrderId) {
        if (isClient) return `/app/client/my-order/${disputeOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${disputeOrderId}`;
      }
      if (isAdmin) return `/app/admin/disputes`;
      if (isClient) return `/app/client/my-order`;
      if (isCaregiver) return `/app/caregiver/orders`;
      return null;
    }

    // ── Incident Reported ────────────────────────────────
    case 'IncidentReported': {
      if (isAdmin && relatedEntityId) return `/app/admin/incidents/${relatedEntityId}`;
      if (isAdmin) return `/app/admin/disputes`;
      const incidentOrderId = notification.orderId || relatedEntityId;
      if (incidentOrderId) {
        if (isClient) return `/app/client/my-order/${incidentOrderId}`;
        if (isCaregiver) return `/app/caregiver/order-details/${incidentOrderId}`;
      }
      return null;
    }

    // ── Observation Report Filed ─────────────────────────
    case 'ObservationReportFiled': {
      const obsOrderId = notification.orderId || relatedEntityId;
      if (obsOrderId && isClient) return `/app/client/my-order/${obsOrderId}`;
      if (isClient) return `/app/client/my-order`;
      return null;
    }

    // ── Care Request Lifecycle (client) ──────────────────
    case 'CareRequestCreated':
    case 'CareRequestPaused':
    case 'CareRequestReopened':
    case 'CareRequestClosed':
      if (isClient && relatedEntityId) return `/app/client/care-requests/${relatedEntityId}/detail`;
      if (isClient) return `/app/client/your-requests`;
      return null;

    // ── Shortlist Removed (caregiver) ────────────────────
    case 'ShortlistRemoved':
      if (isCaregiver) return `/app/caregiver/my-responses`;
      return null;

    // ── Booking Commitment Expired ───────────────────────
    case 'BookingCommitmentExpired':
      if (isClient) return `/app/client/bookings`;
      return null;

    // ── Withdrawal Lifecycle ─────────────────────────────
    case 'WithdrawalVerified':
    case 'WithdrawalCompleted':
    case 'WithdrawalRejected':
      if (isCaregiver) return `/app/caregiver/withdraw`;
      if (isAdmin) return `/app/admin/withdrawals`;
      return null;

    // ── Refund Request Admin Alert ───────────────────────
    case 'RefundRequestAdminAlert':
      if (isAdmin) return `/app/admin/refunds`;
      if (isClient) return `/app/client/wallet`;
      return null;

    // ── Chat Violation Flagged ───────────────────────────
    case 'ChatViolationFlagged':
      if (isAdmin) return `/app/admin/chat-compliance`;
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
    case 'EarningsAdded':
      return 'View Payment';
    case 'RefundRequested':
    case 'RefundApproved':
    case 'RefundRejected':
    case 'RefundProcessed':
      return 'View Refund';
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
    case 'GigPublished':
    case 'GigPaused':
    case 'GigShared':
      return 'View Gig';
    case 'DraftGenerated':
      return 'View Draft';
    case 'GigDeleted':
      return 'View Gigs';
    case 'WithdrawalRequest':
      return 'View Withdrawal';
    case 'VerificationUpdate':
      return 'View Verification';
    case 'CertificateUploaded':
    case 'CertificateVerification':
      return 'View Certificate';
    case 'CareRequestMatched':
      return 'View Matches';
    case 'CareRequestNoMatch':
      return 'View Request';
    case 'CareRequestAdminMatchUpdate':
    case 'CareRequestAdminNoMatch':
      return 'Review Request';
    case 'NegotiationStarted':
    case 'NegotiationCounter':
    case 'NegotiationAgreed':
    case 'NegotiationConverted':
    case 'NegotiationAbandoned':
    case 'NegotiationBothAgreed':
    case 'NegotiationCaregiverAgreed':
    case 'NegotiationCaregiverSubmitted':
    case 'NegotiationClientAgreed':
    case 'NegotiationClientSubmitted':
      return 'View Order';
    case 'CareRequestNewResponder':
      return 'View Responder';
    case 'TaskProposalAccepted':
    case 'TaskProposalRejected':
    case 'TaskProposalSubmitted':
      return 'View Proposal';
    case 'VisitApproved':
      return 'View Wallet';
    case 'VisitSubmitted':
    case 'VisitCancelledByClient':
    case 'VisitCancellationRequested':
      return 'View Visit';
    case 'GigDeletionReminder':
      return 'Restore Gig';
    case 'GigPermanentlyDeleted':
      return 'View Details';
    case 'DisputeRaised':
      return 'View Dispute';
    case 'SubscriptionTerminated':
    case 'SubscriptionCreated':
      return 'View Subscription';
    case 'PaymentFailed':
      return 'View Payment';
    case 'SubscriptionSuspended':
      return 'View Subscription';
    case 'CommitmentConfirmed':
      return 'Chat Now';
    case 'ContractPendingClientApproval':
    case 'ContractRevised':
      return 'View Contract';
    case 'Broadcast':
      return 'View';
    case 'SystemNotice':
    case 'SystemAlert':
      return 'View';
    case 'AccountDeletionScheduled':
      return 'Cancel Deletion';
    case 'AccountDeletionCancelled':
      return 'View Settings';
    case 'AccountPermanentlyDeleted':
      return 'View Details';
    case 'VisitRescheduled':
      return 'View Order';
    case 'CaregiverCheckedIn':
      return 'View Order';
    case 'DisputeUnderReview':
      return 'View Dispute';
    case 'IncidentReported':
      return 'View Incident';
    case 'ObservationReportFiled':
      return 'View Report';
    case 'CareRequestCreated':
    case 'CareRequestPaused':
    case 'CareRequestReopened':
    case 'CareRequestClosed':
      return 'View Request';
    case 'ShortlistRemoved':
      return 'View Responses';
    case 'BookingCommitmentExpired':
      return 'View Bookings';
    case 'WithdrawalVerified':
      return 'View Withdrawal';
    case 'WithdrawalCompleted':
      return 'View Earnings';
    case 'WithdrawalRejected':
      return 'View Withdrawal';
    case 'RefundRequestAdminAlert':
      return 'Review Refund';
    case 'ChatViolationFlagged':
      return 'Review Violation';
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
    case 'GigPublished':
      return '🚀';
    case 'DraftGenerated':
      return '📝';
    case 'GigPaused':
      return '⏸️';
    case 'GigShared':
      return '🔗';
    case 'GigDeleted':
      return '🗑️';
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
    case 'CareRequestMatched':
      return '🤝';
    case 'CareRequestNoMatch':
      return '🔍';
    case 'CareRequestAdminMatchUpdate':
      return '📋';
    case 'CareRequestAdminNoMatch':
      return '⚠️';
    case 'NegotiationStarted':
      return '🤝';
    case 'NegotiationCounter':
      return '🔄';
    case 'NegotiationAgreed':
      return '✅';
    case 'NegotiationConverted':
      return '📋';
    case 'NegotiationAbandoned':
      return '🚫';
    case 'NegotiationBothAgreed':
      return '✅';
    case 'NegotiationCaregiverAgreed':
    case 'NegotiationClientAgreed':
      return '👍';
    case 'NegotiationCaregiverSubmitted':
    case 'NegotiationClientSubmitted':
      return '📝';
    case 'CareRequestNewResponder':
      return '🙋';
    case 'TaskProposalAccepted':
      return '✅';
    case 'TaskProposalRejected':
      return '❌';
    case 'TaskProposalSubmitted':
      return '📋';
    case 'VisitApproved':
      return '💸';
    case 'VisitSubmitted':
      return '📋';
    case 'VisitCancelledByClient':
      return '🚫';
    case 'VisitCancellationRequested':
      return '⚠️';
    case 'GigDeletionReminder':
      return '⚠️';
    case 'GigPermanentlyDeleted':
      return 'ℹ️';
    case 'AccountDeletionScheduled':
      return '🗑️';
    case 'AccountDeletionCancelled':
      return '✅';
    case 'AccountPermanentlyDeleted':
      return 'ℹ️';
    case 'DisputeRaised':
      return '⚖️';
    case 'SubscriptionTerminated':
      return '🚫';
    case 'SubscriptionCreated':
      return '🎉';
    case 'PaymentFailed':
      return '❗';
    case 'SubscriptionSuspended':
      return '⏸️';
    case 'CommitmentConfirmed':
      return '🔓';
    case 'RefundRequested':
      return '💰';
    case 'RefundApproved':
      return '✅';
    case 'RefundRejected':
      return '❌';
    case 'ContractPendingClientApproval':
      return '📋';
    case 'ContractRevised':
      return '📝';
    case 'VisitRescheduled':
      return '🔄';
    case 'CaregiverCheckedIn':
      return '📍';
    case 'DisputeUnderReview':
      return '⚖️';
    case 'IncidentReported':
      return '🚨';
    case 'ObservationReportFiled':
      return '📋';
    case 'CareRequestCreated':
      return '📝';
    case 'CareRequestPaused':
      return '⏸️';
    case 'CareRequestReopened':
      return '🔓';
    case 'CareRequestClosed':
      return '🔒';
    case 'ShortlistRemoved':
      return 'ℹ️';
    case 'BookingCommitmentExpired':
      return '⏰';
    case 'WithdrawalVerified':
      return '🔍';
    case 'WithdrawalCompleted':
      return '✅';
    case 'WithdrawalRejected':
      return '❌';
    case 'RefundRequestAdminAlert':
      return '🚨';
    case 'ChatViolationFlagged':
      return '🚩';
    default:
      return '🔔';
  }
};

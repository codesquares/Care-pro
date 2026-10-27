/**
 * Package Subscription Service
 * A client's recurring care-package subscriptions (created when a Recurring payment link is paid).
 * Consumes /api/client/package-subscriptions. Responses are { success, data } like the other services.
 */
import api from './api';

const errorOf = (error) => error.response?.data?.message || error.message;

const PackageSubscriptionService = {
  /** @returns {Promise<{success: boolean, data?: Array, error?: string}>} */
  async list() {
    try {
      const response = await api.get('/client/package-subscriptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching package subscriptions:', error);
      return { success: false, error: errorOf(error) };
    }
  },

  /** One subscription including its payment history. */
  async get(id) {
    try {
      const response = await api.get(`/client/package-subscriptions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching package subscription:', error);
      return { success: false, error: errorOf(error) };
    }
  },

  /** Stop auto-renewal. The period already paid for continues; nothing more is charged. */
  async cancel(id, reason) {
    try {
      const response = await api.post(`/client/package-subscriptions/${id}/cancel`, { reason: reason || null });
      return response.data;
    } catch (error) {
      console.error('Error cancelling package subscription:', error);
      return { success: false, error: errorOf(error) };
    }
  },
};

export const formatNaira = (value) => `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Statuses where auto-renewal is already stopped, so there is nothing left to cancel. */
export const isStopped = (status) => ['PendingCancellation', 'Cancelled', 'Terminated', 'Expired'].includes(status);

/**
 * What the client should understand about a subscription's billing at a glance.
 * @returns {{ tone: 'ok'|'warn'|'error'|'muted', text: string }}
 */
export const billingNote = (s) => {
  if (s.status === 'PendingCancellation') {
    return { tone: 'warn', text: `Auto-renewal stopped. Your service continues until ${formatDate(s.currentPeriodEnd)}.` };
  }
  if (s.status === 'Cancelled' || s.status === 'Terminated' || s.status === 'Expired') {
    return { tone: 'muted', text: 'This subscription has ended. You will not be charged again.' };
  }
  if (s.status === 'Suspended') {
    return { tone: 'error', text: 'Suspended after failed payments. Please contact support.' };
  }
  if (s.status === 'PastDue') {
    return { tone: 'warn', text: 'Your last payment failed. We will retry automatically.' };
  }
  if (s.status === 'Charging') {
    return { tone: 'ok', text: 'A payment is being processed…' };
  }
  if (!s.hasSavedCard) {
    return { tone: 'error', text: 'No card is saved for this subscription, so it will not renew automatically. Please contact support.' };
  }
  return { tone: 'ok', text: `Next charge of ${formatNaira(s.recurringAmount)} on ${formatDate(s.nextChargeDate)}.` };
};

export default PackageSubscriptionService;

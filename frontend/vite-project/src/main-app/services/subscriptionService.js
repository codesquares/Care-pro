/**
 * Subscription Service
 * Handles subscription-related operations for clients, caregivers, and admins.
 * Consumes the /api/subscriptions endpoints.
 */
import api from './api';

const SubscriptionService = {
  // ========================
  // CLIENT ENDPOINTS
  // ========================

  /**
   * Get all subscriptions for the logged-in client.
   * @returns {Promise<Array>}
   */
  async getClientSubscriptions() {
    try {
      const response = await api.get('/subscriptions/client');
      return response.data;
    } catch (error) {
      console.error('Error fetching client subscriptions:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Get aggregate subscription summary for the logged-in client.
   * Returns: totalActive, totalMonthlySpend, nextPaymentDate, nextPaymentAmount, subscriptions[]
   * @returns {Promise<Object>}
   */
  async getClientSubscriptionSummary() {
    try {
      const response = await api.get('/subscriptions/client/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching client subscription summary:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // CAREGIVER ENDPOINTS
  // ========================

  /**
   * Get all subscriptions linked to the caregiver's gigs.
   * @returns {Promise<Array>}
   */
  async getCaregiverSubscriptions() {
    try {
      const response = await api.get('/subscriptions/caregiver');
      return response.data;
    } catch (error) {
      console.error('Error fetching caregiver subscriptions:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // SINGLE SUBSCRIPTION
  // ========================

  /**
   * Get full subscription details by ID.
   * @param {string} subscriptionId
   * @returns {Promise<Object>}
   */
  async getSubscriptionById(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Get subscription by order ID — useful after payment confirmation.
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async getSubscriptionByOrderId(orderId) {
    try {
      const response = await api.get(`/subscriptions/by-order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription by order:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // CANCEL / REACTIVATE
  // ========================

  /**
   * Gracefully cancel a subscription at the end of the current period.
   * @param {string} subscriptionId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async cancelSubscription(subscriptionId, reason) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Reactivate a pending cancellation — undo cancel.
   * @param {string} subscriptionId
   * @returns {Promise<Object>}
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // TERMINATE
  // ========================

  /**
   * Immediately terminate a subscription.
   * @param {string} subscriptionId
   * @param {string} reason
   * @param {boolean} issueProRatedRefund
   * @returns {Promise<Object>}
   */
  async terminateSubscription(subscriptionId, reason, issueProRatedRefund = true) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/terminate`, {
        reason,
        issueProRatedRefund,
      });
      return response.data;
    } catch (error) {
      console.error('Error terminating subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // PLAN CHANGES
  // ========================

  /**
   * Change plan (upgrade / downgrade).
   * @param {string} subscriptionId
   * @param {Object} planData - { newBillingCycle?: string, newFrequencyPerWeek?: number }
   * @returns {Promise<Object>}
   */
  async changePlan(subscriptionId, planData) {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}/plan`, planData);
      return response.data;
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Get plan change history.
   * @param {string} subscriptionId
   * @returns {Promise<Array>}
   */
  async getPlanHistory(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/plan-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching plan history:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // PAUSE / RESUME
  // ========================

  /**
   * Pause a subscription.
   * @param {string} subscriptionId
   * @param {string} reason
   * @param {string|null} resumeDate - ISO date string, optional
   * @returns {Promise<Object>}
   */
  async pauseSubscription(subscriptionId, reason, resumeDate = null) {
    try {
      const body = { reason };
      if (resumeDate) body.resumeDate = resumeDate;
      const response = await api.post(`/subscriptions/${subscriptionId}/pause`, body);
      return response.data;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Resume a paused subscription.
   * @param {string} subscriptionId
   * @returns {Promise<Object>}
   */
  async resumeSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/resume`);
      return response.data;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // PAYMENT METHOD
  // ========================

  /**
   * Update payment method — returns a Flutterwave link for card verification.
   * @param {string} subscriptionId
   * @param {string} redirectUrl
   * @returns {Promise<Object>}
   */
  async updatePaymentMethod(subscriptionId, redirectUrl) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/payment-method`, {
        redirectUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // BILLING HISTORY
  // ========================

  /**
   * Get all payment attempts for a subscription.
   * @param {string} subscriptionId
   * @returns {Promise<Array>}
   */
  async getBillingHistory(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // ADMIN ENDPOINTS
  // ========================

  /**
   * Get admin analytics dashboard data.
   * @returns {Promise<Object>}
   */
  async getAdminAnalytics() {
    try {
      const response = await api.get('/subscriptions/admin/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Get all subscriptions (admin) with optional status filter.
   * @param {string|null} status
   * @returns {Promise<Array>}
   */
  async getAdminSubscriptions(status = null) {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/subscriptions/admin/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin subscriptions:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  /**
   * Admin force-terminate a subscription.
   * @param {string} subscriptionId
   * @returns {Promise<Object>}
   */
  async adminTerminateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/admin/${subscriptionId}/terminate`);
      return response.data;
    } catch (error) {
      console.error('Error admin-terminating subscription:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // ========================
  // HELPERS
  // ========================

  /**
   * Estimate pro-rated refund client-side.
   * Server does the authoritative calculation, but this helps show an estimate.
   * @param {number} remainingDaysInPeriod
   * @param {number} recurringAmount
   * @param {string} billingCycle - 'weekly' or 'monthly'
   * @returns {number}
   */
  estimateProRatedRefund(remainingDaysInPeriod, recurringAmount, billingCycle) {
    const totalDays = billingCycle === 'weekly' ? 7 : 30;
    return Math.round((remainingDaysInPeriod / totalDays) * recurringAmount);
  },

  /**
   * Format a card display string.
   * @param {string} brand - e.g. "VISA"
   * @param {string} lastFour - e.g. "4081"
   * @returns {string}
   */
  formatCardDisplay(brand, lastFour) {
    return `${brand || 'Card'} ****${lastFour || '****'}`;
  },

  /**
   * Get the CSS class / color for a status badge.
   * @param {string} status
   * @returns {{ className: string, label: string }}
   */
  getStatusBadgeInfo(status) {
    const map = {
      Active: { className: 'sub-badge--active', label: 'Active' },
      PendingCancellation: { className: 'sub-badge--pending-cancel', label: 'Cancelling' },
      PastDue: { className: 'sub-badge--past-due', label: 'Past Due' },
      Suspended: { className: 'sub-badge--suspended', label: 'Suspended' },
      Paused: { className: 'sub-badge--paused', label: 'Paused' },
      Cancelled: { className: 'sub-badge--cancelled', label: 'Cancelled' },
      Terminated: { className: 'sub-badge--terminated', label: 'Terminated' },
      Expired: { className: 'sub-badge--expired', label: 'Expired' },
      Charging: { className: 'sub-badge--charging', label: 'Charging' },
    };
    return map[status] || { className: 'sub-badge--default', label: status || 'Unknown' };
  },
};

export default SubscriptionService;

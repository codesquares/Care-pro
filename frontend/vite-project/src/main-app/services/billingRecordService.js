/**
 * Billing Record Service
 * Handles billing record (invoice/receipt) operations.
 * Consumes the /api/BillingRecords endpoints.
 *
 * Billing records are auto-generated alongside every ClientOrder.
 * They provide a clear financial receipt showing what was paid,
 * for what period, and when the next charge happens.
 */
import api from './api';

const billingRecordService = {
  /**
   * Get a single billing record by ID.
   * @param {string} id - Billing record ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getBillingRecordById(id) {
    try {
      const response = await api.get(`/BillingRecords/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching billing record:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get the billing record (invoice) for a specific order.
   * @param {string} orderId
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getBillingRecordByOrderId(orderId) {
    try {
      const response = await api.get(`/BillingRecords/order/${orderId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching billing record by order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get all billing records (billing cycles) for a subscription.
   * @param {string} subscriptionId
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getBillingRecordsBySubscription(subscriptionId) {
    try {
      const response = await api.get(`/BillingRecords/subscription/${subscriptionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching billing records by subscription:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get all billing records (payment receipts) for a client.
   * @param {string} clientId
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getClientBillingRecords(clientId) {
    try {
      const response = await api.get(`/BillingRecords/client/${clientId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching client billing records:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get all billing records (income records) for a caregiver.
   * @param {string} caregiverId
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getCaregiverBillingRecords(caregiverId) {
    try {
      const response = await api.get(`/BillingRecords/caregiver/${caregiverId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching caregiver billing records:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get display metadata for a billing record status badge.
   * @param {string} status - "Paid", "Refunded", or "Disputed"
   * @returns {{ className: string, label: string, color: string }}
   */
  getStatusBadgeInfo(status) {
    const map = {
      Paid: { className: 'billing-badge--paid', label: 'Paid', color: '#1a7f4b' },
      Refunded: { className: 'billing-badge--refunded', label: 'Refunded', color: '#e65100' },
      Disputed: { className: 'billing-badge--disputed', label: 'Disputed', color: '#c62828' },
    };
    return map[status] || { className: 'billing-badge--default', label: status || 'Unknown', color: '#616161' };
  },
};

export default billingRecordService;

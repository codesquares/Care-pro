/**
 * Booking Commitment Service
 * Handles the ₦5,000 non-refundable booking commitment fee (gig access fee)
 * that clients must pay before they can message a caregiver about a gig.
 *
 * If the client proceeds to hire the caregiver, the commitment fee is
 * deducted from the order total. If they do not hire, the fee is
 * non-refundable.
 *
 * Endpoints consumed:
 *   POST /api/booking-commitment/initiate
 *   GET  /api/booking-commitment/check/{gigId}
 *   GET  /api/booking-commitment/status/{transactionReference}
 */
import api from './api';

/** Fixed commitment amount (display only – backend is the source of truth) */
export const COMMITMENT_AMOUNT = 5000;
export const COMMITMENT_CURRENCY = 'NGN';

const bookingCommitmentService = {
  /**
   * Check whether the current client has already unlocked a gig.
   * Use this to show/hide the "Pay ₦5,000 to Unlock" vs "Message Caregiver" button.
   *
   * @param {string} gigId
   * @returns {Promise<{success: boolean, data?: {hasAccess: boolean, gigId: string, caregiverId: string|null, unlockedAt: string|null, isAppliedToOrder: boolean}, error?: string}>}
   */
  async checkAccess(gigId) {
    try {
      const response = await api.get(`/booking-commitment/check/${gigId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error checking commitment access:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Initiate the ₦5,000 commitment payment for a gig.
   * Returns a Flutterwave checkout link to redirect the user to.
   *
   * @param {{ gigId: string, email: string, redirectUrl: string }} params
   * @returns {Promise<{success: boolean, data?: Object, error?: string, alreadyUnlocked?: boolean}>}
   */
  async initiatePayment({ gigId, email, redirectUrl }) {
    try {
      const response = await api.post('/booking-commitment/initiate', {
        gigId,
        email,
        redirectUrl,
      });

      const data = response.data;

      // Backend tells us the gig is already unlocked (paymentLink will be null)
      if (data.success && data.paymentLink === null) {
        return { success: true, data, alreadyUnlocked: true };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error initiating commitment payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get full status/details of a commitment payment (after Flutterwave redirect).
   * The backend verifies the payment with Flutterwave and returns the result.
   *
   * @param {string} transactionReference  e.g. "CAREPRO-COMMIT-20260302-A1B2C3D4"
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getPaymentStatus(transactionReference) {
    try {
      const response = await api.get(`/booking-commitment/status/${transactionReference}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching commitment payment status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Helper: determine if a SignalR or REST error is a commitment-gate block.
   * The backend hub throws: "You must pay the booking commitment fee before messaging this caregiver."
   *
   * @param {Error|string} error
   * @returns {boolean}
   */
  isCommitmentRequiredError(error) {
    const msg = typeof error === 'string'
      ? error
      : error?.message || error?.response?.data?.message || '';
    return msg.toLowerCase().includes('booking commitment fee');
  },
};

export default bookingCommitmentService;

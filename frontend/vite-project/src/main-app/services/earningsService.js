/**
 * @deprecated Most functions in this service are superseded by walletService.js.
 * Use walletService for all wallet/earnings/ledger data.
 *
 * Migration:
 *   - earningService.getCaregiverEarnings    → walletService.getWalletSummary
 *   - earningService.getUpdatedEarnings      → walletService.getWalletSummary
 *   - earningService.getCareGiverOrderDetails → clientOrderService or walletService.getLedgerHistory
 */
import api from './api';

export const earningService = {
  /**
   * @deprecated Use walletService.getWalletSummary instead.
   * Get caregiver earnings from the Earnings endpoint.
   * @param {string} caregiverId
   * @returns {Promise<Object>}
   */
  async getCaregiverEarnings(caregiverId) {
    try {
      const response = await api.get(`/Earnings/caregiver/${caregiverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching caregiver earnings:', error);
      throw error;
    }
  },

  /**
   * @deprecated Use walletService.getWalletSummary instead.
   * Get total amount earned and withdrawn summary.
   * @param {string} caregiverId
   * @returns {Promise<Object>} { totalAmountEarned, totalAmountWithdrawn, withdrawableAmount }
   */
  async getUpdatedEarnings(caregiverId) {
    try {
      const response = await api.get(
        `/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${caregiverId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching updated earnings:', error);
      throw error;
    }
  },

  /**
   * @deprecated Use walletService.getLedgerHistory or clientOrderService instead.
   * Get all orders for a caregiver.
   * @param {string} caregiverId
   * @returns {Promise<Array>}
   */
  async getCareGiverOrderDetails(caregiverId) {
    try {
      const response = await api.get(
        `/ClientOrders/CaregiverOrders/caregiverId?caregiverId=${caregiverId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching caregiver order details:', error);
      throw error;
    }
  },
};
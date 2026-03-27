/**
 * Client Wallet Service
 * Handles client wallet operations — credit balance from visit cancellations.
 * Endpoint: GET /api/ClientWallet
 */
import api from "./api";

const ClientWalletService = {
  /**
   * Get the current client's wallet.
   * The wallet is auto-created on first access (lazy initialization).
   * @returns {Promise<Object>} { success, data, error }
   */
  async getWallet() {
    try {
      const response = await api.get("/ClientWallet");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching client wallet:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Format a Naira amount for display.
   * @param {number} amount
   * @returns {string}
   */
  formatCurrency(amount) {
    if (amount == null) return "—";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
};

export default ClientWalletService;

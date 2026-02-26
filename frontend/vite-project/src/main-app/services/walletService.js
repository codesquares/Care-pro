/**
 * Wallet Service
 * Handles wallet-related operations for caregivers.
 * Consumes the /api/Wallet endpoints.
 *
 * The wallet is the single source of truth for a caregiver's financial state.
 * The ledger is an immutable audit log of every financial event.
 */
import api from './api';

/**
 * Ledger entry type display metadata.
 * Maps backend Type strings to UI labels, colors, and icons.
 */
const LEDGER_ENTRY_TYPES = {
  OrderReceived: {
    label: 'Order Received',
    color: '#2ecc71',
    icon: '💰',
    isCredit: true,
  },
  FundsReleased: {
    label: 'Funds Released',
    color: '#27ae60',
    icon: '✅',
    isCredit: true,
  },
  WithdrawalCompleted: {
    label: 'Withdrawal',
    color: '#e74c3c',
    icon: '🏦',
    isCredit: false,
  },
  Refund: {
    label: 'Refund',
    color: '#e67e22',
    icon: '↩️',
    isCredit: false,
  },
  DisputeHold: {
    label: 'Dispute Hold',
    color: '#f39c12',
    icon: '⚠️',
    isCredit: false,
  },
  Adjustment: {
    label: 'Adjustment',
    color: '#3498db',
    icon: '🔧',
    isCredit: true, // Can be either — amount sign determines credit/debit
  },
};

/**
 * Default empty wallet summary returned when the wallet doesn't exist yet
 * (backend may return 403 or 404 for caregivers with no orders).
 */
const EMPTY_WALLET_SUMMARY = {
  caregiverId: null,
  caregiverName: '',
  totalEarned: 0,
  withdrawableBalance: 0,
  pendingBalance: 0,
  totalWithdrawn: 0,
};

/**
 * Check if an API error indicates the wallet simply doesn't exist yet.
 * Backend returns 403 (IDOR check fails when wallet is null) or 404.
 */
const isWalletNotFoundError = (error) => {
  const status = error.response?.status;
  return status === 403 || status === 404;
};

const walletService = {
  /**
   * Get wallet summary for a caregiver.
   * Returns TotalEarned, WithdrawableBalance, PendingBalance, TotalWithdrawn.
   * If the wallet doesn't exist yet (403/404), returns an empty summary.
   * @param {string} caregiverId
   * @returns {Promise<{success: boolean, data?: Object, error?: string, isEmpty?: boolean}>}
   */
  async getWalletSummary(caregiverId) {
    try {
      const response = await api.get(`/Wallet/summary/${caregiverId}`);
      return { success: true, data: response.data };
    } catch (error) {
      // Wallet not created yet — return empty summary instead of error
      if (isWalletNotFoundError(error)) {
        return {
          success: true,
          data: { ...EMPTY_WALLET_SUMMARY, caregiverId },
          isEmpty: true,
        };
      }
      console.error('Error fetching wallet summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get ledger history for a caregiver.
   * Returns an array of immutable ledger entries (audit log).
   * If the wallet doesn't exist yet (403/404), returns an empty array.
   * @param {string} caregiverId
   * @param {number} [limit=50] - Max number of entries to return
   * @returns {Promise<{success: boolean, data?: Array, error?: string, isEmpty?: boolean}>}
   */
  async getLedgerHistory(caregiverId, limit = 50) {
    try {
      const response = await api.get(
        `/Wallet/ledger/${caregiverId}?limit=${limit}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      // Wallet not created yet — return empty ledger instead of error
      if (isWalletNotFoundError(error)) {
        return { success: true, data: [], isEmpty: true };
      }
      console.error('Error fetching ledger history:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get formatted transaction history for a caregiver.
   * Returns a display-friendly format compatible with the old transaction view.
   * If the wallet doesn't exist yet (403/404), returns an empty array.
   * @param {string} caregiverId
   * @returns {Promise<{success: boolean, data?: Array, error?: string, isEmpty?: boolean}>}
   */
  async getTransactionHistory(caregiverId) {
    try {
      const response = await api.get(
        `/Wallet/transactions/${caregiverId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      // Wallet not created yet — return empty transactions instead of error
      if (isWalletNotFoundError(error)) {
        return { success: true, data: [], isEmpty: true };
      }
      console.error('Error fetching transaction history:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Get display metadata for a ledger entry type.
   * @param {string} type - One of: OrderReceived, FundsReleased, WithdrawalCompleted, Refund, DisputeHold, Adjustment
   * @returns {{ label: string, color: string, icon: string, isCredit: boolean }}
   */
  getLedgerEntryTypeInfo(type) {
    return (
      LEDGER_ENTRY_TYPES[type] || {
        label: type || 'Unknown',
        color: '#95a5a6',
        icon: '📋',
        isCredit: true,
      }
    );
  },

  /**
   * All known ledger entry type keys.
   * Useful for building filter dropdowns.
   */
  LEDGER_ENTRY_TYPES,
};

export default walletService;

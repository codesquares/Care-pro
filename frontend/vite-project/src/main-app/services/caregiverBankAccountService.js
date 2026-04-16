/**
 * Caregiver Bank Account Service
 * Handles bank account CRUD operations for caregivers.
 * Consumes the /api/CaregiverBankAccount endpoints.
 *
 * - Caregivers can view and upsert their own bank account.
 * - Admins can view any caregiver's bank account and financial summary.
 */
import api from './api';

const caregiverBankAccountService = {
  /**
   * Get a caregiver's saved bank account details.
   * @param {string} caregiverId
   * @returns {Promise<{ success: boolean, data: object|null, error?: string }>}
   */
  async getBankAccount(caregiverId) {
    try {
      const response = await api.get(`/CaregiverBankAccount/${caregiverId}`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        // No bank account saved yet — not an error
        return { success: true, data: null };
      }
      console.error('Error fetching bank account:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.errorMessage || 'Failed to load bank account details.',
      };
    }
  },

  /**
   * Create or update the caregiver's bank account (upsert).
   * The caregiverId is extracted from the JWT token on the backend.
   * @param {{ fullName: string, bankName: string, accountNumber: string, accountName: string }} bankData
   * @returns {Promise<{ success: boolean, data: object|null, error?: string }>}
   */
  async upsertBankAccount(bankData) {
    try {
      const response = await api.post('/CaregiverBankAccount', {
        fullName: bankData.fullName,
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        accountName: bankData.accountName,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving bank account:', error);
      const data = error.response?.data;
      let msg = data?.errorMessage || data?.title || 'Failed to save bank account details.';
      if (data?.errors) {
        const fieldErrors = Object.values(data.errors).flat().join(' | ');
        if (fieldErrors) msg = fieldErrors;
      }
      return { success: false, data: null, error: msg };
    }
  },

  /**
   * Admin-only: Get a combined financial summary (wallet + bank account) for a caregiver.
   * @param {string} caregiverId
   * @returns {Promise<{ success: boolean, data: object|null, error?: string }>}
   */
  async getFinancialSummary(caregiverId) {
    try {
      const response = await api.get(`/CaregiverBankAccount/${caregiverId}/financial-summary`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.errorMessage || 'Failed to load financial summary.',
      };
    }
  },
};

export default caregiverBankAccountService;

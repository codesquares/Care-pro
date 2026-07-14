import api from './api';
import { parseApiError } from '../utils/uiErrorMapper';

const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const referralAdminService = {
  async getReferrers() {
    try {
      const response = await api.get('/referrals/referrers');
      const rows = response.data?.data || [];
      return { success: true, data: Array.isArray(rows) ? rows : [] };
    } catch (error) {
      // Some environments block GET on the primary route; retry the documented fallback path.
      if (error?.response?.status === 405) {
        try {
          const fallbackResponse = await api.get('/referrals/referrers/list');
          const fallbackRows = fallbackResponse.data?.data || [];
          return {
            success: true,
            data: Array.isArray(fallbackRows) ? fallbackRows : [],
            usedFallbackRoute: true,
          };
        } catch (fallbackError) {
          const parsedFallback = parseApiError(fallbackError, 'Failed to fetch referrers.');
          return {
            success: false,
            error: parsedFallback.message,
            uiErrorCode: parsedFallback.uiErrorCode,
            status: fallbackError?.response?.status,
            methodNotAllowed: fallbackError?.response?.status === 405,
          };
        }
      }

      const parsed = parseApiError(error, 'Failed to fetch referrers.');
      return {
        success: false,
        error: parsed.message,
        uiErrorCode: parsed.uiErrorCode,
        status: error?.response?.status,
        methodNotAllowed: error?.response?.status === 405,
      };
    }
  },

  async createReferrer(payload) {
    try {
      const response = await api.post('/referrals/referrers', payload);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      const parsed = parseApiError(error, 'Failed to create referrer.');
      return { success: false, error: parsed.message, uiErrorCode: parsed.uiErrorCode };
    }
  },

  async generateReferralCode(referrerId) {
    try {
      const response = await api.post('/referrals/codes', { referrerId });
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      const parsed = parseApiError(error, 'Failed to generate referral code.');
      return { success: false, error: parsed.message, uiErrorCode: parsed.uiErrorCode };
    }
  },

  async getRedemptions({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await api.get(`/referrals/redemptions${params.toString() ? `?${params}` : ''}`);
      const rows = response.data?.data || [];
      return { success: true, data: Array.isArray(rows) ? rows : [] };
    } catch (error) {
      const parsed = parseApiError(error, 'Failed to fetch redemptions.');
      return { success: false, error: parsed.message, uiErrorCode: parsed.uiErrorCode };
    }
  },

  async markRedemptionPaid(redemptionId) {
    try {
      const response = await api.post(`/referrals/redemptions/${redemptionId}/mark-paid`);
      return { success: true, data: response.data };
    } catch (error) {
      const parsed = parseApiError(error, 'Failed to mark redemption as paid.');
      return { success: false, error: parsed.message, uiErrorCode: parsed.uiErrorCode };
    }
  },

  async exportReferralRedemptions({ startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await api.get(
        `/admin/export/referral-redemptions${params.toString() ? `?${params}` : ''}`,
        { responseType: 'blob' }
      );
      triggerBlobDownload(response.data, 'referral_redemptions.xlsx');
      return { success: true };
    } catch (error) {
      const parsed = parseApiError(error, 'Failed to export referral redemptions.');
      return { success: false, error: parsed.message, uiErrorCode: parsed.uiErrorCode };
    }
  },
};

export default referralAdminService;

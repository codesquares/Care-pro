import api from './api';

export const earningsService = {
  // Get earnings for the current caregiver
  getCaregiverEarnings: async (caregiverId) => {
    try {
      const response = await api.get(`/Earnings/caregiver/${caregiverId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get withdrawal history for the caregiver
  getWithdrawalHistory: async (caregiverId) => {
    try {
      const response = await api.get(`/WithdrawalRequests/caregiver/${caregiverId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check if caregiver has pending withdrawal request
  hasPendingWithdrawal: async (caregiverId) => {
    try {
      const response = await api.get(`/WithdrawalRequests/has-pending/${caregiverId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new withdrawal request
  createWithdrawalRequest: async (withdrawalData) => {
    try {
      const response = await api.post('/WithdrawalRequests', withdrawalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const adminWithdrawalService = {
  // Get all withdrawal requests
  getAllWithdrawalRequests: async () => {
    try {
      const response = await api.get('/WithdrawalRequests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get withdrawal requests by status
  getWithdrawalRequestsByStatus: async (status) => {
    try {
      const response = await api.get(`/WithdrawalRequests/status/${status}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get withdrawal request by token
  getWithdrawalRequestByToken: async (token) => {
    try {
      const response = await api.get(`/WithdrawalRequests/token/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify a withdrawal request
  verifyWithdrawalRequest: async (verificationData) => {
    try {
      const response = await api.post('/WithdrawalRequests/verify', verificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Complete a withdrawal request
  completeWithdrawalRequest: async (token) => {
    try {
      const response = await api.post(`/WithdrawalRequests/complete/${token}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject a withdrawal request
  rejectWithdrawalRequest: async (rejectionData) => {
    try {
      const response = await api.post('/WithdrawalRequests/reject', rejectionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

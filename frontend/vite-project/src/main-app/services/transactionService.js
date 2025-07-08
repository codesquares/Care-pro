import api from './api';

export const transactionService = {
  // Get transaction history for a caregiver
  getCaregiverTransactions: async (caregiverId, page = 1, pageSize = 10) => {
    try {
      const response = await api.get(`/Transactions/caregiver/${caregiverId}?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single transaction by ID
  getTransactionById: async (id) => {
    try {
      const response = await api.get(`/Transactions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get transaction summary statistics (for dashboards)
  getTransactionSummary: async (caregiverId) => {
    try {
      const response = await api.get(`/Transactions/caregiver/${caregiverId}/summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const adminTransactionService = {
  // Get all transactions with filters
  getAllTransactions: async (filters = {}) => {
    try {
      // Convert filters to query params
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/Transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

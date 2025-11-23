// import api from './api';
import { use } from 'react';
import config from '../config'; // Import the config file for API URLs

const BASE_API_URL = config.BASE_URL;
const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');

export const withdrawalService = {
  // Get earnings for the current caregiver
  getCaregiverEarnings: async (caregiverId) => {
    try {
      const response = await fetch(`${BASE_API_URL}/Earnings/caregiver/${caregiverId}`,{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      // return response.data;
      return 0;
    } catch (error) {
      throw error;
    }
  },

  // Get withdrawal history for the caregiver
  getWithdrawalHistory: async (caregiverId) => {
    // const api_to_use = config.BASE_URL;
    // const api_to_use = `http://localhost:3000/api/withdrawal`;
    const authToken = localStorage.getItem('authToken');

    
    try {
      const response = await fetch(`${BASE_API_URL}/Earnings/transaction-history/${caregiverId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Ensure responseData is an array before filtering
      if (!Array.isArray(responseData)) {
        console.warn('Withdrawal history response is not an array:', responseData);
        return [];
      }

      const userSpecificdata = responseData.filter(request => request.caregiverId === caregiverId);
      return userSpecificdata;
    } catch (error) {
      console.error('Error in getWithdrawalHistory:', error);
      throw error;
    }
  },

  // Check if caregiver has pending withdrawal request
  // hasPendingWithdrawal: async (caregiverId) => {
  //   try {
  //     const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/has-pending/${caregiverId}`, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  //       }
  //     });
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  // Create a new withdrawal request
  createWithdrawalRequest: async (withdrawalData) => {

    console.log("All fields present?", {
      amountRequested: !!withdrawalData.amountRequested,
      caregiverId: !!withdrawalData.caregiverId,
      accountNumber: !!withdrawalData.accountNumber,
      bankName: !!withdrawalData.bankName,
      accountName: !!withdrawalData.accountName
    });
    
    const local_api = `${config.BASE_URL}/withdrawal?userId=${withdrawalData.caregiverId}`;
    // const authToken = localStorage.getItem('authToken');
    // console.log("Auth Token:", authToken);
    if (!withdrawalData || !withdrawalData.amountRequested || !withdrawalData.caregiverId) {
      throw new Error('Invalid withdrawal data');
    }
    
    try {
      const response = await fetch(`${local_api}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(withdrawalData)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.errorMessage || 'Failed to create withdrawal request');
      }
      return responseData;
    } catch (error) {
      throw error;
    }
  }
};

export const adminWithdrawalService = {
  // Get all withdrawal requests
  getAllWithdrawalRequests: async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('Withdrawal requests response is not an array:', data);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      throw error;
    }
  },

  // Get withdrawal requests by status
  getWithdrawalRequestsByStatus: async (status) => {
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/status/${status}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get withdrawal request by token
  getWithdrawalRequestByToken: async (token) => {
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/token/${token}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Verify a withdrawal request
  verifyWithdrawalRequest: async (verificationData) => {
    
    console.log("Verification Data:=====>", verificationData);
    console.log("userDetails:=====>", userDetails);
    verificationData.adminId = userDetails.id; // Add admin ID to verification data
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        
        body: JSON.stringify(verificationData)
      });
      const data = await response.json();
      return  data;
    } catch (error) {
      throw error;
    }
  },

  // Complete a withdrawal request
  completeWithdrawalRequest: async (token) => {
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/complete/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Reject a withdrawal request
  rejectWithdrawalRequest: async (rejectionData) => {
    try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(rejectionData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};

import config from '../config';

const BASE_API_URL = config.BASE_URL;

export const earningService = {
  // Get earnings for the current caregiver
  getCaregiverEarnings: async (caregiverId) => {
    try {
      const response = await fetch(`${BASE_API_URL}/Earnings/caregiver/${caregiverId}`,{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(`Error fetching earnings: ${data.message || 'Unknown error'}`);
      }
      console.log("Earnings Data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching caregiver earnings:", error);
      throw error;
    }
     
  },
  getUpdatedEarnings: async (caregiverId) => {
     try {
      const response = await fetch(`${BASE_API_URL}/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${caregiverId}`,{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(`Error fetching earnings: ${data.message || 'Unknown error'}`);
      }
      console.log("Earnings Data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching caregiver earnings:", error);
      throw error;
    }
  },
  getCareGiverOrderDetails: async (caregiverId) => {
    try {
      const response = await fetch(`${BASE_API_URL}/ClientOrders/CaregiverOrders/caregiverId?caregiverId=${caregiverId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(`Error fetching order details: ${data.message || 'Unknown error'}`);
      }
      console.log("Order Details:", data);
      return data;
    } catch (error) {
      console.error("Error fetching caregiver order details:", error);
      throw error;
    }
  }
}
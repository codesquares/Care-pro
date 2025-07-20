// import api from './api';
import config from '../config';

// Add these methods to your existing verificationService.js
const endpoint = config.LOCAL_API_URL;
export const saveDojahVerification = async (verificationData, userId) => {
  try {
    const response = await fetch(`${endpoint}/dojah/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        verificationData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving Dojah verification:', error);
    throw error;
  }
};

export const processDojahResponse = (response) => {
  // Extract relevant data from Dojah response
  const {
    first_name,
    last_name,
    bvn,
    nin,
    id_number,
    id_type,
    verification_status,
    status
  } = response;

  return {
    first_name,
    last_name,
    bvn,
    nin,
    id_number,
    id_type,
    status: status || verification_status
  };
};

export const getWebhookData = async (userId, token) => {
  try {
    const response = await fetch(`${endpoint}/dojah/data/${userId}?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching webhook data:', error);
    throw error;
  }
};

// Admin-only methods
export const getAllWebhookData = async (token) => {
  try {
    const response = await fetch(`${endpoint}/dojah/admin/all-data`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin role required.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all webhook data:', error);
    throw error;
  }
};

export const getWebhookStatistics = async (token) => {
  try {
    const response = await fetch(`${endpoint}/dojah/admin/statistics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied. Admin role required.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching webhook statistics:', error);
    throw error;
  }
};

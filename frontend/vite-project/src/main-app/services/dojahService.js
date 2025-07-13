import api from './api';

// Add these methods to your existing verificationService.js

export const saveDojahVerification = async (verificationData, userId) => {
  try {
    const response = await api.post('/dojah/save', {
      userId,
      verificationData
    });

    return response.data;
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

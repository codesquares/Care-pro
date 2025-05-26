// Helper function for getVerificationStatus to add explicit userId handling
const getVerificationStatus = async (userId = null, userType = 'caregiver') => {
  // Ensure we have a userId by getting it from localStorage if not provided
  if (!userId) {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    userId = userDetails?.id;
    
    // If still no userId, return a default unverified status
    if (!userId) {
      console.warn('No userId available for verification status check');
      return {
        verified: false,
        verificationStatus: 'unverified',
        message: 'User ID not available for verification check'
      };
    }
    
    // Use userType from user details if available
    if (userDetails?.userType) {
      userType = userDetails.userType;
    }
  }
  
  // Get token explicitly for this request
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found in localStorage for verification status request');
    return {
      verified: false,
      verificationStatus: 'unverified',
      message: 'Authentication token missing'
    };
  }
  
  try {
    const verificationResponse = await verificationApi.get('/kyc/status', {
      params: {
        userType,
        userId
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return verificationResponse.data;
  } catch (error) {
    console.error('Error getting verification status:', error);
    
    // Try to get user-specific cached data
    const userSpecificKey = `verificationStatus_${userType}_${userId}`;
    const cachedData = localStorage.getItem(userSpecificKey) || localStorage.getItem('verificationStatus');
    
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Return a default status if all else fails
    return {
      verified: false,
      verificationStatus: 'unverified',
      message: 'Unable to retrieve verification status'
    };
  }
};

// Export the function for integration
export { getVerificationStatus };

// DojahService - Updated for .NET Backend Integration
import config from '../config';

// Use .NET backend endpoint
const endpoint = config.BASE_URL;

// REMOVED METHODS (no longer needed with .NET backend):
// - saveDojahVerification() - replaced by verificationService.createVerification()
// - getWebhookData() - .NET backend handles webhooks internally
// Dojah integration now handled by verificationService.js and polling

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

// NEW METHODS - .NET Backend Endpoints

// Check verification status for a specific user
export const getDojahStatus = async (userId, userType, token) => {
  try {
    console.log('getDojahStatus called with:', { userId, userType, tokenLength: token?.length });
    
    // Backend requires token as query parameter AND in Authorization header
    const url = `${endpoint}/Dojah/status?userId=${userId}&userType=${userType}&token=${token}`;
    console.log('Making request to:', url.replace(token, '[TOKEN_REDACTED]'));
    console.log('📝 Note: 404 responses for this endpoint are expected for users without verification data');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      // Handle 404 as a valid "no verification found" response, not an error
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ message: 'No verification found for user' }));
        const message = errorData.message || 'No verification found for user';
        console.log('✅ getDojahStatus - 404 handled gracefully: No verification found for user (this is expected for unverified users)');
        
        // Return structured data instead of throwing error
        return {
          verified: false,
          verificationStatus: 'not_found',
          message: message,
          hasVerification: false,
          userId: userId,
          userType: userType
        };
      }
      
      // For other errors, get the response body for more details
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied. Admin role required.');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized. Please check your authentication token.');
      }
      throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Dojah status:', error);
    throw error;
  }
};

// Check webhook connectivity
export const checkWebhookStatus = async (token = null) => {
  try {
    const headers = {
      'accept': '*/*'
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${endpoint}/Dojah/webhook`, {
      method: 'GET',
      headers
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
    console.error('Error checking webhook status:', error);
    throw error;
  }
};

// Admin-only methods - Updated for .NET backend
export const getAllVerificationData = async (token, filters = {}) => {
  try {
    // Build query parameters for filtering
    const queryParams = new URLSearchParams();
    
    if (filters.term) {
      queryParams.append('term', filters.term);
    }
    if (filters.start) {
      queryParams.append('start', filters.start);
    }
    if (filters.end) {
      queryParams.append('end', filters.end);
    }
    
    const queryString = queryParams.toString();
    const url = `${endpoint}/Dojah/admin/all-data${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
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
    console.error('Error fetching all verification data:', error);
    throw error;
  }
};

export const getVerificationStatistics = async (token) => {
  try {
    const response = await fetch(`${endpoint}/Dojah/admin/statistics`, {
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
    console.error('Error fetching verification statistics:', error);
    throw error;
  }
};

// Export for compatibility (deprecated methods)
export const saveDojahVerification = () => {
  console.warn('saveDojahVerification is deprecated. Use verificationService.createVerification() instead.');
  throw new Error('Method deprecated. Use verificationService.createVerification()');
};

export const getWebhookData = () => {
  console.warn('getWebhookData is deprecated. Use verificationService.getVerificationStatus() instead.');
  throw new Error('Method deprecated. Use verificationService.getVerificationStatus()');
};

// Legacy alias for admin methods
export const getAllWebhookData = getAllVerificationData;
export const getWebhookStatistics = getVerificationStatistics;

// NEW UTILITY METHODS

// Test all .NET backend Dojah endpoints
export const testAllDojahEndpoints = async (authToken, userId = null, userType = 'Caregiver') => {
  const results = {
    webhook: { success: false, message: '', data: null },
    statistics: { success: false, message: '', data: null },
    allData: { success: false, message: '', data: null },
    status: { success: false, message: '', data: null }
  };

  // Test webhook endpoint
  try {
    const webhookResponse = await checkWebhookStatus(authToken);
    results.webhook = {
      success: true,
      message: 'Webhook endpoint is reachable',
      data: webhookResponse
    };
  } catch (error) {
    results.webhook = {
      success: false,
      message: `Webhook test failed: ${error.message}`,
      data: null
    };
  }

  // Test statistics endpoint (requires auth)
  if (authToken) {
    try {
      const statsResponse = await getVerificationStatistics(authToken);
      results.statistics = {
        success: true,
        message: 'Statistics endpoint is working',
        data: statsResponse
      };
    } catch (error) {
      results.statistics = {
        success: false,
        message: `Statistics test failed: ${error.message}`,
        data: null
      };
    }

    // Test all data endpoint (requires auth)
    try {
      const allDataResponse = await getAllVerificationData(authToken);
      results.allData = {
        success: true,
        message: 'All data endpoint is working',
        data: allDataResponse
      };
    } catch (error) {
      results.allData = {
        success: false,
        message: `All data test failed: ${error.message}`,
        data: null
      };
    }
  }

  // Test status endpoint (if userId provided)
  if (userId && authToken) {
    try {
      const statusResponse = await getDojahStatus(userId, userType, authToken);
      results.status = {
        success: true,
        message: 'Status endpoint is working',
        data: statusResponse
      };
    } catch (error) {
      results.status = {
        success: false,
        message: `Status test failed: ${error.message}`,
        data: null
      };
    }
  }

  return results;
};

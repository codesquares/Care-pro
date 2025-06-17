/**
 * This file contains test functions to diagnose notification service issues
 */
import axios from 'axios';

// API base URL
const API_URL = 'https://carepro-api20241118153443.azurewebsites.net';

/**
 * Tests if the notification endpoints are accessible with the current token
 * @returns {Promise<Object>} Test results
 */
export const testNotificationEndpoints = async () => {
  const results = {
    authToken: null,
    tokenValid: false,
    getNotifications: { success: false, error: null },
    getUnreadCount: { success: false, error: null },
    testEndpoint: { success: false, error: null }
  };
  
  // Get the authentication token
  const token = localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('carepro_token') || 
                sessionStorage.getItem('token');
                
  results.authToken = token ? `${token.substring(0, 10)}...` : null;
  
  if (!token) {
    console.error('No authentication token found');
    return results;
  }
  
  // Test token expiration by trying to parse it
  try {
    const base64Url = token.split('.')[1];
    if (base64Url) {
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const expiryDate = new Date(payload.exp * 1000);
      results.tokenValid = expiryDate > new Date();
      results.tokenExpiry = expiryDate.toLocaleString();
      results.tokenPayload = payload;
    } else {
      results.tokenValid = false;
      results.tokenError = 'Token is not in JWT format';
    }
  } catch (error) {
    results.tokenValid = false;
    results.tokenError = `Error parsing token: ${error.message}`;
  }
  
  // Create axios instance with the token
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 10000
  });
  
  // Test GET notifications endpoint
  try {
    const response = await api.get('/api/Notifications?page=1&pageSize=5');
    results.getNotifications.success = true;
    results.getNotifications.data = response.data;
  } catch (error) {
    results.getNotifications.success = false;
    results.getNotifications.error = error.message;
    if (error.response) {
      results.getNotifications.statusCode = error.response.status;
      results.getNotifications.responseData = error.response.data;
      results.getNotifications.headers = error.response.headers;
    }
  }
  
  // Test GET unread count endpoint
  try {
    const response = await api.get('/api/Notifications/unread/count');
    results.getUnreadCount.success = true;
    results.getUnreadCount.data = response.data;
  } catch (error) {
    results.getUnreadCount.success = false;
    results.getUnreadCount.error = error.message;
    if (error.response) {
      results.getUnreadCount.statusCode = error.response.status;
      results.getUnreadCount.responseData = error.response.data;
    }
  }
  
  return results;
};

/**
 * Tests if the backend server is accessible
 * @returns {Promise<Object>} Test results including server status
 */
export const testBackendConnection = async () => {
  try {
    // Test if the server is up using a simple GET request to Swagger UI
    const response = await axios.get(`${API_URL}/swagger/index.html`, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    return {
      success: response.status >= 200 && response.status < 500,
      statusCode: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isNetworkError: error.message.includes('Network Error')
    };
  }
};

// Export function to run all tests
export const runAllTests = async () => {
  console.log('🔍 Running notification service diagnostic tests...');
  
  // Test basic backend connectivity
  console.log('Testing backend connection...');
  const connectionTest = await testBackendConnection();
  
  // Test notification endpoints
  console.log('Testing notification endpoints...');
  const endpointTests = await testNotificationEndpoints();
  
  return {
    timestamp: new Date().toISOString(),
    backendConnection: connectionTest,
    endpoints: endpointTests
  };
};

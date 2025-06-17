import axios from 'axios';

// Direct API URL (no proxy)
const API_URL = 'https://carepro-api20241118153443.azurewebsites.net';

console.log('NotificationService using direct API URL with custom headers');

// Set up axios instance with authentication
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: false // Don't include credentials for cross-origin requests
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(config => {
  // Check multiple possible token storage locations
  const token = localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('carepro_token') || 
                sessionStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Adding auth token to request');
  } else {
    console.warn('No auth token found for API request');
  }
  
  // Add CORS headers
  config.headers['Access-Control-Allow-Origin'] = '*';
  config.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS';
  config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
  
  // Log full request details for debugging
  console.log('API Request:', {
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    method: config.method?.toUpperCase(),
    headers: Object.keys(config.headers).join(', '),
    hasAuthHeader: !!config.headers.Authorization
  });
  
  return config;
}, error => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log detailed error information
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error('API error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API no response error:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Get all notifications for current user
export const getNotifications = async (page = 1, pageSize = 10) => {
  try {
    // Check for auth token
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('carepro_token') || 
                  sessionStorage.getItem('token');
                  
    if (!token) {
      console.warn('No auth token available for notification request');
      return { items: [], totalCount: 0, currentPage: page, pageSize: pageSize };
    }
    
    // Try the Content controller path first
    const endpoint = `/api/Notifications?page=${page}&pageSize=${pageSize}`;
    console.log(`Fetching notifications from: ${API_URL}${endpoint}`);
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('Notification data received:', response.data);
      return response.data;
    } catch (primaryError) {
      // If the first attempt fails, try a fallback approach
      console.log('Primary notification endpoint failed, trying alternative approach...');
      
      // Create a more direct axios request with explicit headers
      const fallbackResponse = await axios({
        method: 'get',
        url: `${API_URL}/api/Notifications`,
        params: { page, pageSize },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        timeout: 15000
      });
      
      console.log('Fallback notification data received:', fallbackResponse.data);
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    if (error.response) {
      // The server responded with an error status code
      console.error('Server responded with error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    // Return empty data instead of throwing an error
    return { items: [], totalCount: 0, currentPage: page, pageSize: pageSize };
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    // Check for auth token
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('carepro_token') || 
                  sessionStorage.getItem('token');
                  
    if (!token) {
      console.warn('No auth token available for unread count request');
      return { count: 0 };
    }
    
    try {
      console.log(`Fetching unread count from: ${API_URL}/api/Notifications/unread/count`);
      const response = await apiClient.get('/api/Notifications/unread/count');
      return response.data;
    } catch (primaryError) {
      // If the first attempt fails, try a fallback approach
      console.log('Primary unread count endpoint failed, trying alternative approach...');
      
      // Create a more direct axios request with explicit headers
      const fallbackResponse = await axios({
        method: 'get',
        url: `${API_URL}/api/Notifications/unread/count`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        timeout: 15000
      });
      
      console.log('Fallback unread count received:', fallbackResponse.data);
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    // Return mock data if API call fails
    console.log('Using mock unread count due to API error');
    return { count: 0 };
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  try {
    console.log(`Marking notification as read: ${notificationId}`);
    const response = await apiClient.put(`/api/Notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await apiClient.put('/api/Notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/api/Notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Test the notification API connection
export const testNotificationApi = async () => {
  try {
    console.log('Testing notification API connection...');
    
    // Ensure we have a valid auth token
    const token = localStorage.getItem('token') || 
                localStorage.getItem('authToken') || 
                localStorage.getItem('carepro_token') || 
                sessionStorage.getItem('token');
                
    if (!token) {
      console.warn('No auth token available for API test');
      return {
        success: false,
        error: 'No authentication token found'
      };
    }
    
    // Create a payload with a recipient ID (using the current user's ID is fine for testing)
    // The backend expects a recipientId and message for test notifications
    const testPayload = {
      recipientId: 'self', // This will be replaced by the backend with the current user's ID
      message: 'This is a test notification from the frontend'
    };
    
    // Try direct API connection
    const response = await apiClient.post('/api/Notifications/test', testPayload, {
      timeout: 8000
    });
    
    console.log('API test succeeded:', response.data);
    return {
      success: true,
      response: response.data
    };
  } catch (error) {
    console.error('API test failed:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Error response details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response received'
    };
  }
};

// Import diagnostic test functions
import { runAllTests, testBackendConnection, testNotificationEndpoints } from './notificationServiceTest';

// Export diagnostic test functions
export const diagnosisTools = {
  runAllTests,
  testBackendConnection,
  testNotificationEndpoints
};

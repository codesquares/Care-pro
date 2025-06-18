import axios from 'axios';

// Use a relative URL to leverage the Vite development proxy
const isDev = import.meta.env ? import.meta.env.DEV : true;
// In development mode, use relative URLs for proxy. In production, use the full API URL
const API_URL = isDev ? '' : 'https://carepro-api20241118153443.azurewebsites.net';

console.log('NotificationService using ' + (isDev ? 'proxy URL' : 'direct API URL'));

// Set up axios instance with authentication
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: true // Enable sending credentials (cookies, authorization headers) for CORS requests
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
  
  // Log request details for debugging
  console.log('API Request:', {
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    method: config.method?.toUpperCase(),
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
    
    // Always properly capitalize API endpoint - matching the controller's name
    const endpoint = `/api/Notifications?page=${page}&pageSize=${pageSize}`;
    console.log(`Fetching notifications from: ${endpoint}`);
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('Notification raw data received:', response.data);
      
      // Process the response data to ensure it has the right format
      let formattedResponse;
      
      if (Array.isArray(response.data)) {
        // If the backend returns an array (likely scenario), wrap it in the expected structure
        formattedResponse = {
          items: response.data,
          totalCount: response.data.length,
          currentPage: page,
          pageSize: pageSize
        };
        console.log('Converted array response to paginated format');
      } else if (response.data && typeof response.data === 'object') {
        // If it's already an object, ensure it has the required properties
        formattedResponse = {
          items: Array.isArray(response.data.items) ? response.data.items : 
                (Array.isArray(response.data) ? response.data : []),
          totalCount: response.data.totalCount || 0,
          currentPage: response.data.currentPage || page,
          pageSize: response.data.pageSize || pageSize
        };
      } else {
        // Fallback for unexpected data format
        console.warn('Unexpected notification response format:', response.data);
        formattedResponse = { 
          items: [], 
          totalCount: 0, 
          currentPage: page, 
          pageSize: pageSize 
        };
      }
      
      console.log('Formatted notification data:', formattedResponse);
      return formattedResponse;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Server responded with error:', error.response?.data || error.message);
      // Provide fallback data structure in case of error
      return { items: [], totalCount: 0, currentPage: page, pageSize: pageSize };
    }
  } catch (outerError) {
    console.error('Unexpected error in getNotifications:', outerError);
    return { items: [], totalCount: 0, currentPage: page, pageSize: pageSize };
  }
};

// Get count of unread notifications
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
    
    const endpoint = '/api/Notifications/unread/count';
    console.log(`Fetching unread count from: ${API_URL}${endpoint}`);
    
    try {
      const response = await apiClient.get(endpoint);
      console.log('Unread count received:', response.data);
      
      // Ensure we return an object with a count property
      if (typeof response.data === 'object' && response.data !== null) {
        return {
          count: typeof response.data.count === 'number' ? response.data.count : 0
        };
      } else if (typeof response.data === 'number') {
        return { count: response.data };
      }
      
      return { count: 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      console.error('Error response details:', error.response?.data || error.message);
      return { count: 0 };
    }
  } catch (outerError) {
    console.error('Unexpected error in getUnreadCount:', outerError);
    return { count: 0 };
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  try {
    console.log(`Marking notification as read: ${notificationId}`);
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
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
    const response = await apiClient.post('/api/notifications/test', testPayload, {
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

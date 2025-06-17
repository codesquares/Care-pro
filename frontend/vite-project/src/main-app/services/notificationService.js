import axios from 'axios';

// Always use the direct Azure API URL
const API_URL = 'https://carepro-api20241118153443.azurewebsites.net';

console.log(`NotificationService using direct API_URL: ${API_URL}`);

// Set up axios instance with authentication
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
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
    const endpoint = `/api/Notifications?page=${page}&pageSize=${pageSize}`;
    console.log(`Fetching notifications from: ${API_URL}${endpoint}`);
    
    const response = await apiClient.get(endpoint);
    console.log('Notification data received:', response.data);
    return response.data;
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
    
    // Throw the error to be handled by the caller
    throw error;
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    console.log(`Fetching unread count from: ${apiClient.defaults.baseURL || window.location.origin}/api/Notifications/unread/count`);
    const response = await apiClient.get('/api/Notifications/unread/count');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    
    // Return mock data if API call fails
    console.log('Using mock unread count due to API error');
    return { count: 1 };
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
    
    // First try via the proxy
    try {
      const proxyResponse = await axios.post('/api/Notifications/test', {}, {
        timeout: 5000
      });
      console.log('Proxy API test succeeded:', proxyResponse.data);
      return {
        success: true,
        method: 'proxy',
        response: proxyResponse.data
      };
    } catch (proxyError) {
      console.log('Proxy API test failed:', proxyError.message);
      
      // If proxy fails, try direct connection
      try {
        const directResponse = await axios.post('https://carepro-api20241118153443.azurewebsites.net/api/Notifications/test', {}, {
          timeout: 5000
        });
        console.log('Direct API test succeeded:', directResponse.data);
        return {
          success: true,
          method: 'direct',
          response: directResponse.data
        };
      } catch (directError) {
        console.log('Direct API test failed:', directError.message);
        throw directError;
      }
    }
  } catch (error) {
    console.error('All API tests failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

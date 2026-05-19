import api from './api';
import config from '../config';

const API_URL = config.BASE_URL;

/**
 * Admin Service for CarePro Admin Dashboard
 * Handles all admin-related operations including user management, notifications, and communications
 * 
 * API Documentation Reference: CAREPRO ADMIN SERVICE - API ENDPOINTS DOCUMENTATION
 */
const adminService = {
  // ============================================
  // CAREGIVER MANAGEMENT
  // ============================================

  /**
   * Get all caregivers in the system
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllCaregivers: async () => {
    try {
      console.log('Fetching all caregivers...');
      const response = await api.get('/CareGivers/AllCaregiversAdmin');
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch caregivers'
      };
    }
  },

  /**
   * Get a single caregiver by ID
   * @param {string} caregiverId - The ID of the caregiver
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getCaregiverById: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return {
          success: false,
          error: 'Caregiver ID is required'
        };
      }

      console.log(`Fetching caregiver: ${caregiverId}`);
      const response = await api.get(`/CareGivers/${caregiverId}/admin`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Caregiver not found'
      };
    } catch (error) {
      console.error('Error fetching caregiver:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch caregiver'
      };
    }
  },

  /**
   * Get caregivers with filters (client-side filtering)
   * @param {Object} filters - Filter options
   * @param {boolean} [filters.isAvailable] - Filter by availability
   * @param {string} [filters.location] - Filter by location
   * @param {boolean} [filters.status] - Filter by status
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getFilteredCaregivers: async (filters = {}) => {
    try {
      const result = await adminService.getAllCaregivers();
      
      if (!result.success) {
        return result;
      }

      let filteredData = result.data;

      // Apply filters
      if (filters.isAvailable !== undefined) {
        filteredData = filteredData.filter(cg => cg.isAvailable === filters.isAvailable);
      }

      if (filters.location) {
        filteredData = filteredData.filter(cg => 
          cg.location && cg.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.status !== undefined) {
        filteredData = filteredData.filter(cg => cg.status === filters.status);
      }

      return {
        success: true,
        data: filteredData
      };
    } catch (error) {
      console.error('Error filtering caregivers:', error);
      return {
        success: false,
        error: error.message || 'Failed to filter caregivers'
      };
    }
  },

  // ============================================
  // CLIENT MANAGEMENT
  // ============================================

  /**
   * Get all clients in the system
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllClients: async () => {
    try {
      console.log('Fetching all clients...');
      const response = await api.get('/Clients/AllClientUsers');
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch clients'
      };
    }
  },

  /**
   * Get a single client by ID
   * @param {string} clientId - The ID of the client
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getClientById: async (clientId) => {
    try {
      if (!clientId) {
        return {
          success: false,
          error: 'Client ID is required'
        };
      }

      console.log(`Fetching client: ${clientId}`);
      const response = await api.get(`/Clients/${clientId}`);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'Client not found'
      };
    } catch (error) {
      console.error('Error fetching client:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch client'
      };
    }
  },

  /**
   * Get clients with filters (client-side filtering)
   * @param {Object} filters - Filter options
   * @param {boolean} [filters.status] - Filter by status
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getFilteredClients: async (filters = {}) => {
    try {
      const result = await adminService.getAllClients();
      
      if (!result.success) {
        return result;
      }

      let filteredData = result.data;

      // Apply filters
      if (filters.status !== undefined) {
        filteredData = filteredData.filter(client => client.status === filters.status);
      }

      return {
        success: true,
        data: filteredData
      };
    } catch (error) {
      console.error('Error filtering clients:', error);
      return {
        success: false,
        error: error.message || 'Failed to filter clients'
      };
    }
  },

  // ============================================
  // NOTIFICATION MANAGEMENT
  // ============================================

  /**
   * Send notification to a single user
   * @param {Object} notificationData
   * @param {string} notificationData.recipientId - User ID to receive notification
   * @param {string} notificationData.senderId - Admin/sender ID
   * @param {string} notificationData.type - Notification type (SystemAlert, OrderNotification, MessageNotification, WithdrawalRequest)
   * @param {string} notificationData.content - Notification message content
   * @param {string} [notificationData.title] - Notification title
   * @param {string} [notificationData.relatedEntityId] - Related entity ID (order, payment, gig)
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  sendNotification: async (notificationData) => {
    try {
      const { recipientId, senderId, type, content, title, relatedEntityId } = notificationData;

      // Validate required fields
      if (!recipientId || !senderId || !type || !content) {
        return {
          success: false,
          error: 'Missing required fields: recipientId, senderId, type, and content are required'
        };
      }

      // Validate notification type
      const validTypes = ['system_alert', 'order_received', 'order_confirmation', 'order_completed', 'order_cancelled', 'order_disputed', 'chat_message', 'withdrawal_request', 'withdrawal_verified', 'withdrawal_completed', 'withdrawal_rejected', 'certificate_uploaded', 'certificate_verification', 'subscription_created', 'system_notice'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
        };
      }

      console.log(`Sending notification to user: ${recipientId}`);
      
      const payload = {
        recipientId,
        senderId,
        type,
        content,
        ...(title && { title }),
        ...(relatedEntityId && { relatedEntityId })
      };

      const response = await api.post('/Notifications', payload);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send notification'
      };
    }
  },

  /**
   * Get notifications for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getUserNotifications: async (userId) => {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      console.log(`Fetching notifications for user: ${userId}`);
      const response = await api.get(`/Notifications?userId=${userId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notifications'
      };
    }
  },

  /**
   * Send notification to all caregivers
   * @param {Object} notificationData
   * @param {string} notificationData.senderId - Admin/sender ID
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.content - Notification message content
   * @param {string} [notificationData.title] - Notification title
   * @returns {Promise<{success: boolean, successCount?: number, failureCount?: number, errors?: Array, error?: string}>}
   */
  broadcastNotificationToCaregivers: async (notificationData) => {
    try {
      const { title, content, type } = notificationData;

      if (!title || !content) {
        return {
          success: false,
          error: 'Missing required fields: title and content are required'
        };
      }

      console.log('Broadcasting notification to all caregivers...');
      const response = await api.post('/Notifications/BroadcastToCaregivers', {
        title,
        message: content,
        type: type || 'broadcast'
      });

      return {
        success: true,
        successCount: response.data?.recipientsCount || 0,
        failureCount: 0,
        total: response.data?.recipientsCount || 0
      };
    } catch (error) {
      console.error('Error broadcasting notification to caregivers:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to broadcast notification'
      };
    }
  },

  /**
   * Send notification to all clients
   * @param {Object} notificationData
   * @param {string} notificationData.senderId - Admin/sender ID
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.content - Notification message content
   * @param {string} [notificationData.title] - Notification title
   * @returns {Promise<{success: boolean, successCount?: number, failureCount?: number, errors?: Array, error?: string}>}
   */
  broadcastNotificationToClients: async (notificationData) => {
    try {
      const { title, content, type } = notificationData;

      if (!title || !content) {
        return {
          success: false,
          error: 'Missing required fields: title and content are required'
        };
      }

      console.log('Broadcasting notification to all clients...');
      const response = await api.post('/Notifications/BroadcastToClients', {
        title,
        message: content,
        type: type || 'broadcast'
      });

      return {
        success: true,
        successCount: response.data?.recipientsCount || 0,
        failureCount: 0,
        total: response.data?.recipientsCount || 0
      };
    } catch (error) {
      console.error('Error broadcasting notification to clients:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to broadcast notification'
      };
    }
  },

  /**
   * Send notification to all users (caregivers and clients)
   * @param {Object} notificationData
   * @param {string} notificationData.senderId - Admin/sender ID
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.content - Notification message content
   * @param {string} [notificationData.title] - Notification title
   * @returns {Promise<{success: boolean, caregiversResult?: Object, clientsResult?: Object, error?: string}>}
   */
  broadcastNotificationToAllUsers: async (notificationData) => {
    try {
      const { title, content, type } = notificationData;

      if (!title || !content) {
        return {
          success: false,
          error: 'Missing required fields: title and content are required'
        };
      }

      console.log('Broadcasting notification to all users...');
      const response = await api.post('/Notifications/BroadcastToAll', {
        title,
        message: content,
        type: type || 'broadcast'
      });

      return {
        success: true,
        totalSuccessCount: response.data?.recipientsCount || 0,
        totalFailureCount: 0
      };
    } catch (error) {
      console.error('Error broadcasting notification to all users:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to broadcast notification'
      };
    }
  },

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get dashboard statistics
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getDashboardStats: async () => {
    try {
      console.log('Fetching dashboard statistics...');
      const response = await api.get('/Admins/DashboardStats');

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard statistics'
      };
    }
  },

  /**
   * Get caregiver performance metrics
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getCaregiverPerformanceMetrics: async () => {
    try {
      console.log('Fetching caregiver performance metrics...');
      
      const result = await adminService.getAllCaregivers();
      
      if (!result.success) {
        return result;
      }

      const caregivers = result.data;

      // Sort caregivers by different metrics
      const metrics = {
        topEarners: [...caregivers]
          .sort((a, b) => (b.totalEarning || 0) - (a.totalEarning || 0))
          .slice(0, 10)
          .map(cg => ({
            id: cg.id,
            name: `${cg.firstName} ${cg.lastName}`,
            totalEarning: cg.totalEarning || 0,
            noOfOrders: cg.noOfOrders || 0,
            profileImage: cg.profileImage
          })),
        mostOrders: [...caregivers]
          .sort((a, b) => (b.noOfOrders || 0) - (a.noOfOrders || 0))
          .slice(0, 10)
          .map(cg => ({
            id: cg.id,
            name: `${cg.firstName} ${cg.lastName}`,
            noOfOrders: cg.noOfOrders || 0,
            totalEarning: cg.totalEarning || 0,
            profileImage: cg.profileImage
          })),
        mostHours: [...caregivers]
          .sort((a, b) => (b.noOfHoursSpent || 0) - (a.noOfHoursSpent || 0))
          .slice(0, 10)
          .map(cg => ({
            id: cg.id,
            name: `${cg.firstName} ${cg.lastName}`,
            noOfHoursSpent: cg.noOfHoursSpent || 0,
            totalEarning: cg.totalEarning || 0,
            profileImage: cg.profileImage
          }))
      };

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error('Error fetching caregiver performance metrics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch performance metrics'
      };
    }
  },

  // ============================================
  // TRAINING MATERIALS MANAGEMENT
  // ============================================

  /**
   * Upload training material for caregivers or clients
   * @param {Object} trainingData
   * @param {string} trainingData.title - Title of the training material (3-200 characters)
   * @param {string} trainingData.userType - "Caregiver", "Cleaner", or "Both"
   * @param {File} trainingData.file - The actual file (PDF, Document, or Video)
   * @param {string} [trainingData.description] - Optional description (max 500 characters)
   * @param {string} trainingData.uploadedBy - Admin user ID uploading the material
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  uploadTrainingMaterial: async (trainingData) => {
    try {
      const { title, userType, file, description, uploadedBy } = trainingData;

      // Validate required fields
      if (!title || !userType || !file || !uploadedBy) {
        return {
          success: false,
          error: 'Missing required fields: title, userType, file, and uploadedBy are required'
        };
      }

      // Validate title length
      if (title.length < 3 || title.length > 200) {
        return {
          success: false,
          error: 'Title must be between 3 and 200 characters'
        };
      }

      // Validate userType
      const validUserTypes = ['Caregiver', 'Cleaner', 'Both'];
      if (!validUserTypes.includes(userType)) {
        return {
          success: false,
          error: `Invalid userType. Must be one of: ${validUserTypes.join(', ')}`
        };
      }

      // Validate description length if provided
      if (description && description.length > 500) {
        return {
          success: false,
          error: 'Description must not exceed 500 characters'
        };
      }

      console.log('Uploading training material:', title);

      // Create FormData
      const formData = new FormData();
      formData.append('Title', title);
      formData.append('UserType', userType);
      formData.append('File', file);
      formData.append('UploadedBy', uploadedBy);
      
      if (description) {
        formData.append('Description', description);
      }

      // Make API call using fetch (not axios) for FormData
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/TrainingMaterials/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          data: result.data,
          message: result.message || 'Training material uploaded successfully'
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to upload training material'
        };
      }
    } catch (error) {
      console.error('Error uploading training material:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload training material'
      };
    }
  },

  /**
   * Get available user types for training materials
   * @returns {Array<string>} Available user types
   */
  getTrainingUserTypes: () => {
    return ['Caregiver', 'Cleaner', 'Both'];
  },

  /**
   * Validate training material data before upload
   * @param {Object} trainingData
   * @returns {{isValid: boolean, errors?: Array<string>}}
   */
  validateTrainingMaterialData: (trainingData) => {
    const errors = [];
    const { title, userType, file, uploadedBy } = trainingData;

    if (!title) {
      errors.push('Title is required');
    } else if (title.length < 3 || title.length > 200) {
      errors.push('Title must be between 3 and 200 characters');
    }

    if (!userType) {
      errors.push('User type is required');
    } else if (!['Caregiver', 'Cleaner', 'Both'].includes(userType)) {
      errors.push('User type must be "Caregiver", "Cleaner", or "Both"');
    }

    if (!file) {
      errors.push('File is required');
    }

    if (!uploadedBy) {
      errors.push('Uploader ID is required');
    }

    if (trainingData.description && trainingData.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Get accepted file types for training materials
   * @returns {string} Accept attribute for file input
   */
  getAcceptedFileTypes: () => {
    return '.pdf,.doc,.docx,.mp4,.mov,.avi,.wmv,.ppt,.pptx';
  },

  /**
   * Get all training materials
   * Endpoint: GET /api/admin/TrainingMaterials
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  getAllTrainingMaterials: async () => {
    try {
      const response = await api.get('/admin/TrainingMaterials');
      const payload = response.data;
      return {
        success: true,
        data: payload.data || payload || [],
        count: payload.count ?? (Array.isArray(payload) ? payload.length : 0),
      };
    } catch (error) {
      console.error('Error fetching training materials:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch training materials' };
    }
  },

  /**
   * Get training materials filtered by user type
   * Endpoint: GET /api/admin/TrainingMaterials/by-user-type/{userType}?activeOnly=true
   * @param {string} userType - "Caregiver" | "Cleaner" | "Both"
   * @param {boolean} [activeOnly=true]
   * @returns {Promise<{success: boolean, data?: Array, totalCount?: number, userType?: string, error?: string}>}
   */
  getTrainingMaterialsByUserType: async (userType, activeOnly = true) => {
    try {
      const response = await api.get(`/admin/TrainingMaterials/by-user-type/${userType}`, {
        params: { activeOnly },
      });
      const payload = response.data;
      return {
        success: true,
        data: payload.data || payload || [],
        totalCount: payload.totalCount ?? (Array.isArray(payload) ? payload.length : 0),
        userType: payload.userType || userType,
      };
    } catch (error) {
      console.error('Error fetching training materials by user type:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch training materials' };
    }
  },

  /**
   * Get a single training material by ID
   * Endpoint: GET /api/admin/TrainingMaterials/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getTrainingMaterial: async (id) => {
    try {
      const response = await api.get(`/admin/TrainingMaterials/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching training material:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch training material' };
    }
  },

  /**
   * Update a training material (title, description, userType, optionally replace file)
   * Endpoint: PUT /api/admin/TrainingMaterials/{id}   multipart/form-data
   * @param {string} id
   * @param {Object} updateData
   * @param {string} [updateData.title]
   * @param {string} [updateData.description]
   * @param {string} [updateData.userType]
   * @param {File}   [updateData.file]
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  updateTrainingMaterial: async (id, updateData) => {
    try {
      const formData = new FormData();
      if (updateData.title)       formData.append('Title',       updateData.title);
      if (updateData.description !== undefined) formData.append('Description', updateData.description);
      if (updateData.userType)    formData.append('UserType',    updateData.userType);
      if (updateData.file)        formData.append('File',        updateData.file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/TrainingMaterials/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (response.ok && (result.success !== false)) {
        return { success: true, message: result.message || 'Training material updated successfully' };
      }
      return { success: false, error: result.message || 'Failed to update training material' };
    } catch (error) {
      console.error('Error updating training material:', error);
      return { success: false, error: error.message || 'Failed to update training material' };
    }
  },

  /**
   * Delete a training material (removes from DB and Cloudinary)
   * Endpoint: DELETE /api/admin/TrainingMaterials/{id}
   * @param {string} id
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  deleteTrainingMaterial: async (id) => {
    try {
      const response = await api.delete(`/admin/TrainingMaterials/${id}`);
      const payload = response.data;
      return { success: true, message: payload?.message || 'Training material deleted successfully' };
    } catch (error) {
      console.error('Error deleting training material:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to delete training material' };
    }
  },

  /**
   * Search training materials by title, description, or filename
   * Endpoint: GET /api/admin/TrainingMaterials/search?searchTerm=
   * @param {string} searchTerm - required
   * @returns {Promise<{success: boolean, data?: Array, count?: number, searchTerm?: string, error?: string}>}
   */
  searchTrainingMaterials: async (searchTerm) => {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return { success: false, error: 'Search term is required' };
      }
      const response = await api.get('/admin/TrainingMaterials/search', {
        params: { searchTerm: searchTerm.trim() },
      });
      const payload = response.data;
      return {
        success: true,
        data: payload.data || payload || [],
        count: payload.count ?? (Array.isArray(payload) ? payload.length : 0),
        searchTerm: payload.searchTerm || searchTerm,
      };
    } catch (error) {
      console.error('Error searching training materials:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to search training materials' };
    }
  },

  // ============================================
  // ADMIN USER MANAGEMENT
  // ============================================

  /**
   * Create a new admin account (SuperAdmin only)
   * Endpoint: POST /api/Admins
   * @param {Object} adminData
   * @param {string} adminData.FirstName
   * @param {string} adminData.LastName
   * @param {string} [adminData.MiddleName]
   * @param {string} adminData.Email
   * @param {string} adminData.Password
   * @param {string} adminData.Role - "Admin" | "SuperAdmin"
   * @param {string} [adminData.Department]
   * @param {string} [adminData.PhoneNo]
   * @param {string} [adminData.Status]
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/Admins', adminData);
      const payload = response.data;
      return { success: true, data: payload };
    } catch (error) {
      console.error('Error creating admin:', error);
      return { success: false, error: error.response?.data?.message || error.response?.data?.Message || error.message || 'Failed to create admin' };
    }
  },

  /**
   * Get all admin accounts
   * Endpoint: GET /api/Admins/AllAdminUsers
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllAdminUsers: async () => {
    try {
      const response = await api.get('/Admins/AllAdminUsers');
      const payload = response.data;
      return {
        success: true,
        data: Array.isArray(payload) ? payload : (payload.data || []),
      };
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch admin users' };
    }
  },

  /**
   * Get a single admin profile
   * Endpoint: GET /api/Admins/{adminUserId}
   * @param {string} adminUserId
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getAdminUser: async (adminUserId) => {
    try {
      const response = await api.get(`/Admins/${adminUserId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching admin user:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch admin user' };
    }
  },

  /**
   * Bulk-clear "testing" middle name for caregivers
   * PUT /api/Admin/Caregivers/BulkClearMiddleName
   */
  bulkClearCaregiverMiddleName: async (adminId, userIds, reason) => {
    try {
      const response = await api.put('/Admin/Caregivers/BulkClearMiddleName', { adminId, userIds, reason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error bulk-clearing caregiver middle names:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to clear caregiver middle names' };
    }
  },

  /**
   * Bulk-clear "testing" middle name for clients
   * PUT /api/Admin/Clients/BulkClearMiddleName
   */
  bulkClearClientMiddleName: async (adminId, userIds, reason) => {
    try {
      const response = await api.put('/Admin/Clients/BulkClearMiddleName', { adminId, userIds, reason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error bulk-clearing client middle names:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to clear client middle names' };
    }
  },

  // ============================================
  // GIGS MANAGEMENT
  // ============================================

  /**
   * Get all gigs in the system
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllGigs: async (params = {}) => {
    try {
      console.log('Fetching all gigs...');
      const queryParams = {};
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.pageSize = params.pageSize;
      if (params.status) queryParams.status = params.status;
      if (params.search) queryParams.search = params.search;
      if (params.category) queryParams.category = params.category;

      const response = await api.get('/Gigs', { params: queryParams });
      
      // Handle both paginated and full-list response shapes
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          count: response.data.count || response.data.totalCount || 0,
          totalCount: response.data.totalCount,
          page: response.data.page,
          pageSize: response.data.pageSize,
          hasMore: response.data.hasMore
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch gigs'
      };
    }
  },

  /**
   * Get a single gig by ID
   * @param {string} gigId - The ID of the gig
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getGigById: async (gigId) => {
    try {
      if (!gigId) {
        return { success: false, error: 'Gig ID is required' };
      }

      console.log(`Fetching gig: ${gigId}...`);
      const response = await api.get(`/Gigs/${gigId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching gig:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch gig'
      };
    }
  },

  /**
   * Get all gigs created by a specific caregiver
   * @param {string} caregiverId - The caregiver ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getGigsByCaregiver: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }

      console.log(`Fetching gigs for caregiver: ${caregiverId}...`);
      const response = await api.get(`/Gigs/caregiver/${caregiverId}`);
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching caregiver gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch caregiver gigs'
      };
    }
  },

  /**
   * Get paused gigs by caregiver
   * @param {string} caregiverId - The caregiver ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getPausedGigsByCaregiver: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }

      console.log(`Fetching paused gigs for caregiver: ${caregiverId}...`);
      const response = await api.get(`/Gigs/${caregiverId}/paused`);
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching paused gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch paused gigs'
      };
    }
  },

  /**
   * Get draft gigs by caregiver
   * @param {string} caregiverId - The caregiver ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getDraftGigsByCaregiver: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }

      console.log(`Fetching draft gigs for caregiver: ${caregiverId}...`);
      const response = await api.get(`/Gigs/${caregiverId}/draft`);
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching draft gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch draft gigs'
      };
    }
  },

  /**
   * Filter gigs by status
   * @param {Array} gigs - Array of gigs
   * @param {string} status - Status to filter by (Active/Paused/Draft)
   * @returns {Array} Filtered gigs
   */
  filterGigsByStatus: (gigs, status) => {
    if (!Array.isArray(gigs)) return [];
    if (!status) return gigs;
    return gigs.filter(gig => gig.status === status);
  },

  /**
   * Group gigs by category
   * @param {Array} gigs - Array of gigs
   * @returns {Object} Gigs grouped by category
   */
  groupGigsByCategory: (gigs) => {
    if (!Array.isArray(gigs)) return {};
    
    return gigs.reduce((acc, gig) => {
      const category = gig.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(gig);
      return acc;
    }, {});
  },

  /**
   * Get gig statistics
   * @param {Array} gigs - Array of gigs
   * @returns {Object} Gig statistics
   */
  getGigStatistics: (gigs) => {
    if (!Array.isArray(gigs)) {
      return {
        total: 0,
        active: 0,
        paused: 0,
        draft: 0
      };
    }

    return {
      total: gigs.length,
      active: gigs.filter(g => g.status === 'Active').length,
      paused: gigs.filter(g => g.status === 'Paused').length,
      draft: gigs.filter(g => g.status === 'Draft').length,
      byCategory: adminService.groupGigsByCategory(gigs)
    };
  },

  /**
   * Bulk soft-delete gigs (SuperAdmin only)
   * @param {Object} params - { gigIds?: string[], deleteAll?: boolean, adminUserId: string }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  bulkSoftDeleteGigs: async ({ gigIds, deleteAll = false, adminUserId }) => {
    try {
      if (!adminUserId) {
        return { success: false, error: 'Admin user ID is required for audit purposes.' };
      }
      if (!deleteAll && (!gigIds || gigIds.length === 0)) {
        return { success: false, error: 'Either provide a list of gig IDs or set deleteAll to true.' };
      }

      const response = await api.delete('/Gigs/admin/BulkSoftDelete', {
        data: { gigIds: gigIds || [], deleteAll, adminUserId }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error bulk deleting gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to bulk delete gigs'
      };
    }
  },

  /**
   * Get all soft-deleted gigs (Admin/SuperAdmin)
   * @param {Object} params - { page, pageSize, caregiverId }
   * @returns {Promise<{success: boolean, data?: Array, totalCount?: number, hasMore?: boolean, error?: string}>}
   */
  getDeletedGigs: async (params = {}) => {
    try {
      const queryParams = {};
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.pageSize = params.pageSize;
      if (params.caregiverId) queryParams.caregiverId = params.caregiverId;

      const response = await api.get('/Gigs/admin/deleted', { params: queryParams });

      if (response.data && response.data.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          totalCount: response.data.totalCount || 0,
          page: response.data.page,
          pageSize: response.data.pageSize,
          hasMore: response.data.hasMore || false
        };
      }

      // Fallback for array response
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          totalCount: response.data.length,
          hasMore: false
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('Error fetching deleted gigs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch deleted gigs'
      };
    }
  },

  // ============================================
  // ORDERS MANAGEMENT
  // ============================================

  /**
   * Get all orders in the system (Admin endpoint)
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  getAllOrders: async (params = {}) => {
    try {
      console.log('Fetching all orders...');
      const queryParams = {};
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.pageSize = params.pageSize;
      if (params.status) queryParams.status = params.status;
      if (params.search) queryParams.search = params.search;

      const response = await api.get('/Admins/AllOrders', { params: queryParams });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          count: response.data.count || response.data.totalCount || 0,
          totalCount: response.data.totalCount,
          page: response.data.page,
          pageSize: response.data.pageSize,
          hasMore: response.data.hasMore
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch orders'
      };
    }
  },

  /**
   * Get a single order by ID
   * @param {string} orderId - The order ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getOrderById: async (orderId) => {
    try {
      if (!orderId) {
        return { success: false, error: 'Order ID is required' };
      }

      console.log(`Fetching order: ${orderId}...`);
      const response = await api.get('/ClientOrders/orderId', { params: { orderId } });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch order'
      };
    }
  },

  /**
   * Get all orders for a specific client
   * @param {string} clientUserId - The client user ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getOrdersByClient: async (clientUserId) => {
    try {
      if (!clientUserId) {
        return { success: false, error: 'Client user ID is required' };
      }

      console.log(`Fetching orders for client: ${clientUserId}...`);
      const response = await api.get('/ClientOrders/clientUserId', { params: { clientUserId } });
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching client orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch client orders'
      };
    }
  },

  /**
   * Get all orders for a specific caregiver
   * @param {string} caregiverId - The caregiver ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getOrdersByCaregiver: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }

      console.log(`Fetching orders for caregiver: ${caregiverId}...`);
      const response = await api.get('/ClientOrders/caregiverId', { params: { caregiverId } });
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching caregiver orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch caregiver orders'
      };
    }
  },

  /**
   * Get caregiver orders with earnings summary
   * @param {string} caregiverId - The caregiver ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getCaregiverOrdersWithEarnings: async (caregiverId) => {
    try {
      if (!caregiverId) {
        return { success: false, error: 'Caregiver ID is required' };
      }

      console.log(`Fetching orders with earnings for caregiver: ${caregiverId}...`);
      const response = await api.get('/ClientOrders/CaregiverOrders/caregiverId', { params: { caregiverId } });
      
      return {
        success: true,
        data: {
          noOfOrders: response.data.noOfOrders || 0,
          totalEarning: response.data.totalEarning || 0,
          orders: response.data.clientOrders || []
        }
      };
    } catch (error) {
      console.error('Error fetching caregiver earnings:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch caregiver earnings'
      };
    }
  },

  /**
   * Get all orders for a specific gig
   * @param {string} gigId - The gig ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getOrdersByGig: async (gigId) => {
    try {
      if (!gigId) {
        return { success: false, error: 'Gig ID is required' };
      }

      console.log(`Fetching orders for gig: ${gigId}...`);
      const response = await api.get('/ClientOrders/gigId', { params: { gigId } });
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          count: response.data.length
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching gig orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch gig orders'
      };
    }
  },

  /**
   * Filter orders by status
   * @param {Array} orders - Array of orders
   * @param {string} status - Status to filter by
   * @returns {Array} Filtered orders
   */
  filterOrdersByStatus: (orders, status) => {
    if (!Array.isArray(orders)) return [];
    if (!status) return orders;
    return orders.filter(order => order.clientOrderStatus === status);
  },

  /**
   * Filter orders by date range
   * @param {Array} orders - Array of orders
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Array} Filtered orders
   */
  filterOrdersByDateRange: (orders, startDate, endDate) => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderCreatedOn);
      
      if (startDate && orderDate < new Date(startDate)) {
        return false;
      }
      
      if (endDate && orderDate > new Date(endDate)) {
        return false;
      }
      
      return true;
    });
  },

  /**
   * Search orders by client, caregiver, or gig title
   * @param {Array} orders - Array of orders
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered orders
   */
  searchOrders: (orders, searchTerm) => {
    if (!Array.isArray(orders)) return [];
    if (!searchTerm) return orders;
    
    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.clientName?.toLowerCase().includes(term) ||
      order.caregiverName?.toLowerCase().includes(term) ||
      order.gigTitle?.toLowerCase().includes(term)
    );
  },

  /**
   * Get order statistics
   * @param {Array} orders - Array of orders
   * @returns {Object} Order statistics
   */
  getOrderStatistics: (orders) => {
    if (!Array.isArray(orders)) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        disputed: 0,
        declined: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageOrderValue: 0
      };
    }

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.clientOrderStatus === 'Pending').length,
      inProgress: orders.filter(o => o.clientOrderStatus === 'In Progress').length,
      completed: orders.filter(o => o.clientOrderStatus === 'Completed').length,
      disputed: orders.filter(o => o.clientOrderStatus === 'Disputed').length,
      declined: orders.filter(o => o.isDeclined === true).length,
      cancelled: orders.filter(o => o.clientOrderStatus === 'Cancelled').length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.amount || 0), 0)
    };

    stats.averageOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;

    return stats;
  },

  /**
   * Get recent orders (last N days)
   * @param {Array} orders - Array of orders
   * @param {number} days - Number of days (default: 7)
   * @returns {Array} Recent orders
   */
  getRecentOrders: (orders, days = 7) => {
    if (!Array.isArray(orders)) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderCreatedOn);
      return orderDate >= cutoffDate;
    });
  },

  /**
   * Sort orders by date
   * @param {Array} orders - Array of orders
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted orders
   */
  sortOrdersByDate: (orders, direction = 'desc') => {
    if (!Array.isArray(orders)) return [];
    
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.orderCreatedOn);
      const dateB = new Date(b.orderCreatedOn);
      
      return direction === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },

  /**
   * Get order status options
   * @returns {Array<string>} Available order statuses
   */
  getOrderStatusOptions: () => {
    return ['Pending', 'In Progress', 'Completed', 'Declined', 'Disputed', 'Cancelled'];
  },

  /**
   * Get gig status options
   * @returns {Array<string>} Available gig statuses
   */
  getGigStatusOptions: () => {
    return ['Active', 'Paused', 'Draft'];
  },

  // ============================================
  // EMAIL MANAGEMENT
  // ============================================

  /**
   * Send email to individual user
   * @param {Object} emailData - Email data
   * @param {string} emailData.recipientEmail - Recipient email address
   * @param {string} emailData.recipientName - Recipient name
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Email message (HTML)
   * @param {File[]} emailData.attachments - Optional file attachments (max 10 files, 150MB total)
   * @returns {Promise<{success: boolean, message?: string, attachmentCount?: number, attachments?: Array, error?: string, validationErrors?: Array}>}
   */
  sendEmail: async (emailData) => {
    try {
      const validation = adminService.validateEmailData(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      console.log('Sending email to:', emailData.recipientEmail);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('RecipientEmail', emailData.recipientEmail);
      // Extract first name from full name (backend expects only first name for personalization)
      const firstName = emailData.recipientName.split(' ')[0];
      formData.append('RecipientName', firstName);
      formData.append('Subject', emailData.subject);
      const preparedMessage = await adminService.prepareEmailMessage(emailData.message, emailData.attachments);
      formData.append('Message', preparedMessage);

      // Add attachments if provided
      if (emailData.attachments && emailData.attachments.length > 0) {
        emailData.attachments.forEach(file => {
          formData.append('Attachments', file);
        });
        console.log(`Adding ${emailData.attachments.length} attachment(s)`);
      }

      const response = await api.post('/Admins/SendEmail', formData, {
        headers: {
          'Content-Type': undefined  // Remove default JSON Content-Type for FormData
        }
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || `Email sent successfully to ${emailData.recipientEmail}`,
          attachmentCount: response.data.attachmentCount || 0,
          attachments: response.data.attachments || []
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to send email',
        validationErrors: response.data?.errors || []
      };
    } catch (error) {
      console.error('Error sending email:', error);
      // Handle structured validation errors from backend
      const responseData = error.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        return {
          success: false,
          error: responseData.message || 'Some attachments were rejected',
          validationErrors: responseData.errors
        };
      }
      return {
        success: false,
        error: responseData?.message || error.message || 'Failed to send email'
      };
    }
  },

  /**
   * Send bulk email to multiple users
   * @param {Object} bulkEmailData - Bulk email data
   * @param {string} bulkEmailData.recipientType - Recipient type (All/Caregivers/Clients/Specific)
   * @param {Array<string>} bulkEmailData.specificUserIds - User IDs (required for Specific type)
   * @param {string} bulkEmailData.subject - Email subject
   * @param {string} bulkEmailData.message - Email message (HTML)
   * @param {File[]} bulkEmailData.attachments - Optional file attachments (max 10 files, 150MB total)
   * @returns {Promise<{success: boolean, message?: string, stats?: Object, attachments?: Array, error?: string, validationErrors?: Array}>}
   */
  sendBulkEmail: async (bulkEmailData) => {
    try {
      const validation = adminService.validateBulkEmailData(bulkEmailData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      console.log('Sending bulk email to:', bulkEmailData.recipientType);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('RecipientType', bulkEmailData.recipientType);
      formData.append('Subject', bulkEmailData.subject);
      const preparedMessage = await adminService.prepareEmailMessage(bulkEmailData.message, bulkEmailData.attachments);
      formData.append('Message', preparedMessage);

      if (bulkEmailData.recipientType === 'Specific' && bulkEmailData.specificUserIds) {
        bulkEmailData.specificUserIds.forEach(id => {
          formData.append('SpecificUserIds', id);
        });
      }

      // Add attachments if provided
      if (bulkEmailData.attachments && bulkEmailData.attachments.length > 0) {
        bulkEmailData.attachments.forEach(file => {
          formData.append('Attachments', file);
        });
        console.log(`Adding ${bulkEmailData.attachments.length} attachment(s) to bulk email`);
      }

      const response = await api.post('/Admins/SendBulkEmail', formData, {
        headers: {
          'Content-Type': undefined  // Remove default JSON Content-Type for FormData
        }
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Bulk email sent successfully',
          stats: {
            totalRecipients: response.data.totalRecipients || 0,
            successfulSends: response.data.successfulSends || 0,
            failedSends: response.data.failedSends || 0,
            errors: response.data.errors || []
          },
          attachments: response.data.attachments || [],
          attachmentCount: response.data.attachments?.length || 0
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to send bulk email',
        validationErrors: response.data?.errors || []
      };
    } catch (error) {
      console.error('Error sending bulk email:', error);
      // Handle structured validation errors from backend
      const responseData = error.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        return {
          success: false,
          error: responseData.message || 'Some attachments were rejected',
          validationErrors: responseData.errors
        };
      }
      return {
        success: false,
        error: responseData?.message || error.message || 'Failed to send bulk email'
      };
    }
  },

  /**
   * Upload a single image asset for inline use in email body
   * @param {File} file - Image file (jpg, jpeg, png, gif, webp only, max 10MB)
   * @returns {Promise<{success: boolean, url?: string, fileName?: string, mimeType?: string, fileSize?: number, error?: string}>}
   */
  uploadEmailAsset: async (file) => {
    try {
      const formData = new FormData();
      formData.append('File', file);

      const response = await api.post('/Admins/UploadEmailAsset', formData, {
        headers: {
          'Content-Type': undefined
        }
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          url: response.data.url,
          fileName: response.data.fileName,
          mimeType: response.data.mimeType,
          fileSize: response.data.fileSize
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to upload image'
      };
    } catch (error) {
      console.error('Error uploading email asset:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload image'
      };
    }
  },

  /**
   * Build final HTML email body with CarePro branding and inline JPEG flyer previews
   * @param {string} messageHtml - Admin-authored HTML body
   * @param {File[]} attachments - Optional attachments
   * @returns {Promise<string>} Branded HTML email body
   */
  prepareEmailMessage: async (messageHtml, attachments = []) => {
    const contentHtml = (messageHtml || '').trim();

    // Keep existing branded messages intact to avoid duplicate wrappers.
    if (contentHtml.includes('data-carepro-email="true"')) {
      return contentHtml;
    }

    const inlineFlyersHtml = await adminService.buildInlineJpegFlyersHtml(attachments);

    return adminService.wrapEmailWithBranding(contentHtml, inlineFlyersHtml);
  },

  /**
   * Wrap email body in a consistent CarePro branded shell.
   * @param {string} contentHtml
   * @param {string} extraBodyHtml
   * @returns {string}
   */
  wrapEmailWithBranding: (contentHtml, extraBodyHtml = '') => {
    return `
      <div data-carepro-email="true" style="background-color: #f5f7fb; padding: 24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px 24px; text-align: center;">
              <img src="https://oncarepro.com/careproLogoWhite.svg" alt="CarePro" style="max-width: 170px; width: 100%; height: auto; display: inline-block;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; color: #1f2937; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.65;">
              ${contentHtml}
              ${extraBodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 24px 24px; border-top: 1px solid #eef2f7; color: #64748b; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5;">
              <div style="margin-bottom: 6px; font-weight: 600; color: #334155;">CarePro Team</div>
              <div>Trusted home care professionals, on-demand.</div>
              <div style="margin-top: 6px;"><a href="https://oncarepro.com" style="color: #0f766e; text-decoration: none;">oncarepro.com</a></div>
            </td>
          </tr>
        </table>
      </div>
    `;
  },

  /**
   * Build inline image HTML for JPEG flyers so recipients can see flyers in-body.
   * @param {File[]} attachments
   * @returns {Promise<string>}
   */
  buildInlineJpegFlyersHtml: async (attachments = []) => {
    if (!attachments || attachments.length === 0) {
      return '';
    }

    const jpegFiles = attachments.filter(file => adminService.isJpegFile(file)).slice(0, 3);
    if (jpegFiles.length === 0) {
      return '';
    }

    const previews = [];

    for (const file of jpegFiles) {
      // Keep message payload practical for deliverability and provider limits.
      if (!file || file.size > 5 * 1024 * 1024) {
        continue;
      }

      try {
        const dataUrl = await adminService.fileToDataUrl(file);
        const safeName = adminService.escapeHtml(file.name);
        previews.push(`
          <div style="margin: 14px 0 18px;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${safeName}</div>
            <img src="${dataUrl}" alt="${safeName}" style="display: block; max-width: 100%; width: auto; height: auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
          </div>
        `);
      } catch (error) {
        console.warn('Failed to build inline JPEG preview for attachment:', file?.name, error);
      }
    }

    if (previews.length === 0) {
      return '';
    }

    return `
      <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 12px; font-size: 16px; line-height: 1.3; color: #0f172a;">Flyer Preview</h3>
        ${previews.join('')}
      </div>
    `;
  },

  /**
   * Convert a browser File object into data URL for inline HTML image previews.
   * @param {File} file
   * @returns {Promise<string>}
   */
  fileToDataUrl: (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Escape HTML special characters to prevent XSS when inserting user-controlled
   * strings (e.g. file names) into inline HTML.
   * @param {string} str
   * @returns {string}
   */
  escapeHtml: (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Check if file is a JPEG flyer candidate
   * @param {File} file
   * @returns {boolean}
   */
  isJpegFile: (file) => {
    if (!file?.name) return false;
    const lowerName = file.name.toLowerCase();
    const mimeType = (file.type || '').toLowerCase();
    return mimeType === 'image/jpeg' || mimeType === 'image/jpg' || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
  },

  /**
   * Validate email data for individual email
   * @param {Object} emailData
   * @returns {{isValid: boolean, errors?: Array<string>}}
   */
  validateEmailData: (emailData) => {
    const errors = [];
    const { recipientEmail, recipientName, subject, message } = emailData;

    // Email validation
    if (!recipientEmail) {
      errors.push('Recipient email is required');
    } else if (!adminService.isValidEmail(recipientEmail)) {
      errors.push('Invalid email address format');
    }

    // Name validation
    if (!recipientName) {
      errors.push('Recipient name is required');
    } else if (recipientName.trim().length < 2) {
      errors.push('Recipient name must be at least 2 characters');
    }

    // Subject validation
    if (!subject) {
      errors.push('Email subject is required');
    } else if (subject.length < 3) {
      errors.push('Subject must be at least 3 characters');
    } else if (subject.length > 200) {
      errors.push('Subject must not exceed 200 characters');
    }

    // Message validation
    if (!message) {
      errors.push('Email message is required');
    } else if (message.trim().length < 10) {
      errors.push('Message must be at least 10 characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Validate bulk email data
   * @param {Object} bulkEmailData
   * @returns {{isValid: boolean, errors?: Array<string>}}
   */
  validateBulkEmailData: (bulkEmailData) => {
    const errors = [];
    const { recipientType, specificUserIds, subject, message } = bulkEmailData;

    // Recipient type validation
    const validTypes = adminService.getRecipientTypes();
    if (!recipientType) {
      errors.push('Recipient type is required');
    } else if (!validTypes.includes(recipientType)) {
      errors.push(`Invalid recipient type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Specific user IDs validation
    if (recipientType === 'Specific') {
      if (!specificUserIds || !Array.isArray(specificUserIds) || specificUserIds.length === 0) {
        errors.push('Specific user IDs are required when recipient type is "Specific"');
      }
    }

    // Subject validation
    if (!subject) {
      errors.push('Email subject is required');
    } else if (subject.length < 3) {
      errors.push('Subject must be at least 3 characters');
    } else if (subject.length > 200) {
      errors.push('Subject must not exceed 200 characters');
    }

    // Message validation
    if (!message) {
      errors.push('Email message is required');
    } else if (message.trim().length < 10) {
      errors.push('Message must be at least 10 characters');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  /**
   * Validate email address format
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Get recipient types for bulk email
   * @returns {Array<string>} Available recipient types
   */
  getRecipientTypes: () => {
    return ['All', 'Caregivers', 'Clients', 'Specific'];
  },

  /**
   * Get email template for common use cases
   * @param {string} templateType - Type of template
   * @param {Object} variables - Variables to inject into template
   * @returns {string} HTML email template
   */
  getEmailTemplate: (templateType, variables = {}) => {
    const templates = {
      announcement: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">${variables.title || 'Announcement'}</h2>
          <p>${variables.content || ''}</p>
          ${variables.callToAction ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.actionUrl || '#'}" 
                 style="background-color: #667eea; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                ${variables.callToAction}
              </a>
            </div>
          ` : ''}
        </div>
      `,
      reminder: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">⏰ Reminder</h3>
            <p style="color: #856404;">${variables.content || ''}</p>
          </div>
          ${variables.dueDate ? `
            <p style="margin-top: 20px;"><strong>Due Date:</strong> ${variables.dueDate}</p>
          ` : ''}
        </div>
      `,
      alert: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">⚠️ Important Alert</h3>
            <p style="color: #721c24;">${variables.content || ''}</p>
          </div>
          ${variables.action ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f7fafc; border-radius: 5px;">
              <strong>Required Action:</strong>
              <p>${variables.action}</p>
            </div>
          ` : ''}
        </div>
      `,
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">Welcome to CarePro! 🎉</h1>
          <p>Hi ${variables.name || 'there'},</p>
          <p>${variables.content || 'We\'re excited to have you join our platform!'}</p>
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Getting Started:</h4>
            <ul style="padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Explore available features</li>
              <li>Contact support if you need help</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.dashboardUrl || '#'}" 
               style="background-color: #667eea; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `,
      update: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8;">
            <h3 style="margin-top: 0; color: #0c5460;">ℹ️ Update</h3>
            <p style="color: #0c5460;">${variables.title || 'System Update'}</p>
          </div>
          <div style="margin-top: 20px;">
            ${variables.content || ''}
          </div>
          ${variables.features ? `
            <div style="background-color: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0;">What's New:</h4>
              <ul style="padding-left: 20px;">
                ${variables.features.map(f => `<li>${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `
    };

    return templates[templateType] || templates.announcement;
  },

  /**
   * Preview email recipients count
   * @param {string} recipientType - Type of recipients
   * @param {Array} specificUserIds - Specific user IDs
   * @param {Object} allUsers - Object containing all users data
   * @returns {number} Estimated recipient count
   */
  getRecipientCount: (recipientType, specificUserIds = [], allUsers = {}) => {
    switch (recipientType) {
      case 'All':
        return (allUsers.caregivers?.length || 0) + (allUsers.clients?.length || 0);
      case 'Caregivers':
        return allUsers.caregivers?.length || 0;
      case 'Clients':
        return allUsers.clients?.length || 0;
      case 'Specific':
        return specificUserIds?.length || 0;
      default:
        return 0;
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Get notification types
   * @returns {Array<string>} Available notification types
   */
  getNotificationTypes: () => {
    return ['system_alert', 'system_notice', 'broadcast', 'order_received', 'order_confirmation', 'order_completed', 'order_cancelled', 'order_disputed', 'chat_message', 'withdrawal_request', 'withdrawal_verified', 'withdrawal_completed', 'withdrawal_rejected', 'certificate_uploaded', 'certificate_verification', 'subscription_created'];
  },

  /**
   * Validate notification data
   * @param {Object} notificationData
   * @returns {{isValid: boolean, errors?: Array<string>}}
   */
  validateNotificationData: (notificationData) => {
    const errors = [];
    const { recipientId, senderId, type, content } = notificationData;

    if (!recipientId) errors.push('Recipient ID is required');
    if (!senderId) errors.push('Sender ID is required');
    if (!type) errors.push('Notification type is required');
    if (!content) errors.push('Notification content is required');

    const validTypes = adminService.getNotificationTypes();
    if (type && !validTypes.includes(type)) {
      errors.push(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },

  // ============================================
  // CERTIFICATE MANAGEMENT
  // ============================================

  /**
   * Get all certificates in the system with caregiver details
   * Endpoint: GET /api/Admins/Certificates/All
   * @returns {Promise<{success: boolean, count?: number, data?: Array, error?: string}>}
   */
  getAllCertificates: async (params = {}) => {
    try {
      console.log('Fetching all certificates...');
      const queryParams = {};
      if (params.page) queryParams.page = params.page;
      if (params.pageSize) queryParams.pageSize = params.pageSize;
      if (params.status) queryParams.status = params.status;

      const response = await api.get('/Admins/Certificates/All', { params: queryParams });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          count: response.data.count || response.data.totalCount || response.data.data?.length || 0,
          data: response.data.data || [],
          totalCount: response.data.totalCount,
          page: response.data.page,
          pageSize: response.data.pageSize,
          hasMore: response.data.hasMore
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching all certificates:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch certificates'
      };
    }
  },

  /**
   * Get certificates pending manual review (ManualReviewRequired status)
   * Endpoint: GET /api/Admins/Certificates/PendingReview
   * @returns {Promise<{success: boolean, count?: number, data?: Array, error?: string}>}
   */
  getPendingCertificates: async () => {
    try {
      console.log('Fetching certificates pending review...');
      const response = await api.get('/Admins/Certificates/PendingReview');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          count: response.data.count || response.data.data?.length || 0,
          data: response.data.data || []
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching pending certificates:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch pending certificates'
      };
    }
  },

  /**
   * Get certificates by verification status
   * Endpoint: GET /api/Admins/Certificates/ByStatus/{status}
   * @param {number} status - DocumentVerificationStatus enum value (0-5)
   *   0: PendingVerification
   *   1: Verified
   *   2: Invalid
   *   3: VerificationFailed
   *   4: ManualReviewRequired
   *   5: NotVerified
   * @returns {Promise<{success: boolean, count?: number, status?: string, data?: Array, error?: string}>}
   */
  getCertificatesByStatus: async (status) => {
    try {
      if (status === null || status === undefined) {
        return {
          success: false,
          error: 'Status parameter is required'
        };
      }

      if (status < 0 || status > 5) {
        return {
          success: false,
          error: 'Invalid status value. Must be between 0 and 5'
        };
      }

      console.log(`Fetching certificates with status: ${status}`);
      const response = await api.get(`/Admins/Certificates/ByStatus/${status}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          count: response.data.count || response.data.data?.length || 0,
          status: response.data.status,
          data: response.data.data || []
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Invalid response format'
      };
    } catch (error) {
      console.error('Error fetching certificates by status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch certificates by status'
      };
    }
  },

  /**
   * Get comprehensive details for a single certificate
   * Endpoint: GET /api/Admins/Certificates/{certificateId}/Details
   * @param {string} certificateId - Certificate ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  getCertificateDetails: async (certificateId) => {
    try {
      if (!certificateId || certificateId.trim() === '') {
        return {
          success: false,
          error: 'Certificate ID is required'
        };
      }

      console.log(`Fetching certificate details: ${certificateId}`);
      const response = await api.get(`/Admins/Certificates/${certificateId}/Details`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Certificate not found'
      };
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch certificate details'
      };
    }
  },

  /**
   * Review a certificate (approve or reject) - NEW UNIFIED ENDPOINT
   * Endpoint: POST /api/Admins/Certificates/Review
   * @param {string} certificateId - Certificate ID
   * @param {string} adminId - Admin user ID performing the action
   * @param {boolean} approved - true to verify, false to reject
   * @param {string} [adminNotes] - Optional admin notes (required for rejection)
   * @returns {Promise<{success: boolean, message?: string, newStatus?: string, certificateId?: string, error?: string}>}
   */
  reviewCertificate: async (certificateId, adminId, approved, adminNotes = '') => {
    try {
      // Validation
      if (!certificateId || certificateId.trim() === '') {
        return {
          success: false,
          error: 'Certificate ID is required'
        };
      }

      if (!adminId || adminId.trim() === '') {
        return {
          success: false,
          error: 'Admin ID is required'
        };
      }

      if (typeof approved !== 'boolean') {
        return {
          success: false,
          error: 'Approved must be true or false'
        };
      }

      // Admin notes recommended for rejections
      if (!approved && !adminNotes.trim()) {
        console.warn('Rejecting certificate without admin notes - caregivers won\'t know why');
      }

      console.log(`Reviewing certificate: ${certificateId}, Approved: ${approved}`);
      const requestBody = {
        CertificateId: certificateId,
        AdminId: adminId,
        Approved: approved,
        AdminNotes: adminNotes
      };
      
      console.log('Review request body:', JSON.stringify(requestBody, null, 2));

      const response = await api.post('/Admins/Certificates/Review', requestBody);
      
      console.log('Review response:', response.data);
      
      if (response.data && response.data.Success) {
        return {
          success: true,
          message: response.data.Message || (approved ? 'Certificate approved successfully' : 'Certificate rejected'),
          newStatus: response.data.NewStatus,
          certificateId: response.data.CertificateId
        };
      }
      
      return {
        success: false,
        error: response.data?.Message || 'Failed to review certificate'
      };
    } catch (error) {
      console.error('Error reviewing certificate:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      return {
        success: false,
        error: error.response?.data?.Message || error.response?.data?.message || error.message || 'Failed to review certificate'
      };
    }
  },

  /**
   * @deprecated Use reviewCertificate() instead
   * Approve certificate - kept for backward compatibility
   */
  approveCertificate: async (certificateId, adminId, approvalNotes = '') => {
    console.warn('approveCertificate() is deprecated. Use reviewCertificate() instead.');
    return adminService.reviewCertificate(certificateId, adminId, true, approvalNotes);
  },

  /**
   * @deprecated Use reviewCertificate() instead
   * Reject certificate - kept for backward compatibility
   */
  rejectCertificate: async (certificateId, adminId, rejectionReason) => {
    console.warn('rejectCertificate() is deprecated. Use reviewCertificate() instead.');
    return adminService.reviewCertificate(certificateId, adminId, false, rejectionReason);
  },

  /**
   * Get verification status enum values
   * @returns {Object} DocumentVerificationStatus enum with names and values
   */
  getVerificationStatuses: () => {
    return {
      PendingVerification: 0,
      Verified: 1,
      Invalid: 2,
      VerificationFailed: 3,
      ManualReviewRequired: 4,
      NotVerified: 5
    };
  },

  /**
   * Get status name from enum value
   * @param {number} statusValue - Status enum value (0-5)
   * @returns {string} Status name
   */
  getStatusName: (statusValue) => {
    const statuses = {
      0: 'Pending Verification',
      1: 'Verified',
      2: 'Invalid',
      3: 'Verification Failed',
      4: 'Manual Review Required',
      5: 'Not Verified'
    };
    return statuses[statusValue] || 'Unknown';
  },

  /**
   * Get status color/badge class based on status value
   * @param {number} statusValue - Status enum value (0-5)
   * @returns {string} CSS class for status badge
   */
  getStatusClass: (statusValue) => {
    const statusClasses = {
      0: 'status-pending',      // Pending Verification - yellow
      1: 'status-verified',     // Verified - green
      2: 'status-invalid',      // Invalid - red
      3: 'status-failed',       // Verification Failed - orange
      4: 'status-review',       // Manual Review Required - blue
      5: 'status-not-verified'  // Not Verified - gray
    };
    return statusClasses[statusValue] || 'status-unknown';
  },

  /**
   * Get confidence level indicator
   * @param {number} confidence - Confidence score (0-1)
   * @returns {Object} Confidence info with level, color, and percentage
   */
  getConfidenceInfo: (confidence) => {
    const percentage = Math.round(confidence * 100);
    
    if (confidence >= 0.7) {
      return { level: 'High', color: 'green', percentage };
    } else if (confidence >= 0.5) {
      return { level: 'Medium', color: 'yellow', percentage };
    } else {
      return { level: 'Low', color: 'red', percentage };
    }
  },

  /**
   * Check if names match (profile name vs certificate name)
   * @param {string} profileFirstName - First name from profile
   * @param {string} profileLastName - Last name from profile
   * @param {string} certificateName - Name extracted from certificate
   * @returns {boolean} True if names match
   */
  checkNameMatch: (profileFirstName, profileLastName, certificateName) => {
    if (!profileFirstName || !profileLastName || !certificateName) {
      return false;
    }

    const profileName = `${profileFirstName} ${profileLastName}`.toLowerCase().trim();
    const certName = certificateName.toLowerCase().trim();
    
    return profileName === certName;
  },

  /**
   * Get common rejection reasons (for quick selection)
   * @returns {Array<string>} List of common rejection reasons
   */
  getCommonRejectionReasons: () => {
    return [
      'Certificate image is blurry or unreadable',
      'Name on certificate does not match profile name',
      'Certificate appears to be altered or forged',
      'Wrong certificate type uploaded',
      'Certificate issuer information is incorrect',
      'Certificate has expired',
      'Duplicate certificate already verified',
      'Document quality is too poor for verification',
      'Missing required information on certificate',
      'Certificate is not from a recognized institution'
    ];
  },

  /**
   * Format certificate data for display
   * @param {Object} certificate - Certificate object from API
   * @returns {Object} Formatted certificate data
   */
  formatCertificateData: (certificate) => {
    if (!certificate) return null;

    return {
      id: certificate.id,
      name: certificate.certificateName,
      issuer: certificate.certificateIssuer,
      imageUrl: certificate.certificateUrl,
      previewUrl: certificate.certificatePreviewUrl,
      status: adminService.getStatusName(certificate.verificationStatus),
      statusValue: certificate.verificationStatus,
      statusClass: adminService.getStatusClass(certificate.verificationStatus),
      isVerified: certificate.isVerified,
      confidence: adminService.getConfidenceInfo(certificate.verificationConfidence || 0),
      submittedDate: certificate.submittedOn ? new Date(certificate.submittedOn).toLocaleDateString() : 'N/A',
      verifiedDate: certificate.verificationDate ? new Date(certificate.verificationDate).toLocaleDateString() : 'N/A',
      yearObtained: certificate.yearObtained ? new Date(certificate.yearObtained).getFullYear() : 'N/A',
      attempts: certificate.verificationAttempts || 0,
      caregiver: certificate.caregiverDetails ? {
        name: `${certificate.caregiverDetails.firstName} ${certificate.caregiverDetails.lastName}`,
        email: certificate.caregiverDetails.email,
        phone: certificate.caregiverDetails.phoneNumber
      } : null,
      extractedInfo: certificate.extractedInfo || null,
      nameMatch: certificate.caregiverDetails && certificate.extractedInfo ? 
        adminService.checkNameMatch(
          certificate.caregiverDetails.firstName,
          certificate.caregiverDetails.lastName,
          certificate.extractedInfo.holderName
        ) : null,
      // New fields for admin review tracking
      validationIssues: (() => {
        const issues = certificate.ValidationIssues || certificate.validationIssues;
        if (!issues) return null;
        // If it's a string (comma-separated), split it into an array
        if (typeof issues === 'string') {
          return issues.split(',').map(i => i.trim()).filter(i => i.length > 0);
        }
        // If it's already an array, return it
        return Array.isArray(issues) ? issues : null;
      })(),
      reviewedByAdminId: certificate.ReviewedByAdminId || certificate.reviewedByAdminId || null,
      reviewedAt: certificate.ReviewedAt || certificate.reviewedAt ? 
        new Date(certificate.ReviewedAt || certificate.reviewedAt).toLocaleDateString() : null,
      adminReviewNotes: certificate.AdminReviewNotes || certificate.adminReviewNotes || null
    };
  },

  /**
   * Get certificate statistics from list
   * @param {Array} certificates - Array of certificates
   * @returns {Object} Statistics object
   */
  getCertificateStatistics: (certificates) => {
    if (!certificates || !Array.isArray(certificates)) {
      return {
        total: 0,
        pending: 0,
        verified: 0,
        invalid: 0,
        manualReview: 0,
        verificationFailed: 0,
        notVerified: 0
      };
    }

    return {
      total: certificates.length,
      pending: certificates.filter(c => c.verificationStatus === 0).length,
      verified: certificates.filter(c => c.verificationStatus === 1).length,
      invalid: certificates.filter(c => c.verificationStatus === 2).length,
      verificationFailed: certificates.filter(c => c.verificationStatus === 3).length,
      manualReview: certificates.filter(c => c.verificationStatus === 4).length,
      notVerified: certificates.filter(c => c.verificationStatus === 5).length
    };
  },

  /**
   * Filter certificates by search query (client-side)
   * @param {Array} certificates - Array of certificates
   * @param {string} searchQuery - Search term
   * @returns {Array} Filtered certificates
   */
  filterCertificates: (certificates, searchQuery) => {
    if (!certificates || !Array.isArray(certificates)) {
      return [];
    }

    if (!searchQuery || searchQuery.trim() === '') {
      return certificates;
    }

    const query = searchQuery.toLowerCase().trim();

    return certificates.filter(cert => {
      const name = cert.certificateName?.toLowerCase() || '';
      const issuer = cert.certificateIssuer?.toLowerCase() || '';
      const caregiverName = cert.caregiverDetails ? 
        `${cert.caregiverDetails.firstName} ${cert.caregiverDetails.lastName}`.toLowerCase() : '';
      const email = cert.caregiverDetails?.email?.toLowerCase() || '';

      return name.includes(query) || 
             issuer.includes(query) || 
             caregiverName.includes(query) || 
             email.includes(query);
    });
  },

  // ============================================
  // EXCEL EXPORT
  // ============================================

  /**
   * Trigger a file download from a binary response.
   * @private
   */
  _triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export caregiver records to Excel (.xlsx).
   * @param {Object} [params]
   * @param {string} [params.startDate] - ISO 8601 date string e.g. '2024-01-01'
   * @param {string} [params.endDate]   - ISO 8601 date string e.g. '2025-01-01'
   */
  async exportCaregivers({ startDate, endDate } = {}) {
    try {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      const response = await api.get(
        `/admin/export/caregivers${query.toString() ? `?${query}` : ''}`,
        { responseType: 'blob' }
      );
      adminService._triggerBlobDownload(response.data, 'caregivers.xlsx');
      return { success: true };
    } catch (error) {
      console.error('Error exporting caregivers:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Export failed' };
    }
  },

  /**
   * Export client records to Excel (.xlsx).
   * @param {Object} [params]
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   */
  async exportClients({ startDate, endDate } = {}) {
    try {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      const response = await api.get(
        `/admin/export/clients${query.toString() ? `?${query}` : ''}`,
        { responseType: 'blob' }
      );
      adminService._triggerBlobDownload(response.data, 'clients.xlsx');
      return { success: true };
    } catch (error) {
      console.error('Error exporting clients:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Export failed' };
    }
  },

  /**
   * Export caregiver journey snapshot records to Excel (.xlsx).
   * @param {Object} [filters] - Same filters as getCaregiverSnapshots
   */
  async exportCaregiverSnapshots(filters = {}) {
    try {
      const query = new URLSearchParams();
      const allowed = [
        'journeyStage', 'isIdentityVerified', 'hasProfilePicture',
        'hasPassedAssessment', 'hasPublishedGig', 'hasCertificate',
        'registeredFrom', 'registeredTo',
      ];
      allowed.forEach(k => { if (filters[k] !== undefined && filters[k] !== '') query.set(k, filters[k]); });
      const response = await api.get(
        `/admin/export/caregiver-snapshots${query.toString() ? `?${query}` : ''}`,
        { responseType: 'blob' }
      );
      adminService._triggerBlobDownload(response.data, 'caregiver_journey.xlsx');
      return { success: true };
    } catch (error) {
      console.error('Error exporting caregiver snapshots:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Export failed' };
    }
  },

  // ============================================
  // CAREGIVER JOURNEY SNAPSHOTS (JSON)
  // ============================================

  /**
   * Get paginated caregiver journey snapshots.
   * @param {Object} [params]
   * @param {string}  [params.journeyStage]
   * @param {boolean} [params.isIdentityVerified]
   * @param {boolean} [params.hasProfilePicture]
   * @param {boolean} [params.hasPassedAssessment]
   * @param {boolean} [params.hasPublishedGig]
   * @param {boolean} [params.hasCertificate]
   * @param {string}  [params.registeredFrom]
   * @param {string}  [params.registeredTo]
   * @param {number}  [params.pageNumber=1]
   * @param {number}  [params.pageSize=50]
   */
  async getCaregiverSnapshots(params = {}) {
    try {
      const query = new URLSearchParams();
      const allowed = [
        'journeyStage', 'isIdentityVerified', 'hasProfilePicture',
        'hasPassedAssessment', 'hasPublishedGig', 'hasCertificate',
        'registeredFrom', 'registeredTo', 'pageNumber', 'pageSize',
      ];
      allowed.forEach(k => { if (params[k] !== undefined && params[k] !== '') query.set(k, params[k]); });
      const response = await api.get(
        `/admin/caregiver-snapshots${query.toString() ? `?${query}` : ''}`
      );
      if (response.data?.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.error('Error fetching caregiver snapshots:', error);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch snapshots' };
    }
  },

  // ── Account Deletion (Admin) ─────────────────────────────────────────────

  /**
   * Admin: schedule a caregiver account for permanent deletion (30-day grace).
   * DELETE /api/Admin/Caregivers/{caregiverId}/account
   * @param {string} caregiverId
   * @param {string} reason — mandatory, must not be empty
   * @returns {Promise<{success, message?, permanentDeletionDate?, error?}>}
   */
  deleteCaregiverAccount: async (caregiverId, reason) => {
    try {
      if (!caregiverId) return { success: false, error: 'Caregiver ID is required' };
      if (!reason || !reason.trim()) return { success: false, error: 'Reason is required' };
      const response = await api.delete(`/Admin/Caregivers/${caregiverId}/account`, {
        data: { reason },
      });
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error deleting caregiver account (admin):', error);
      const data = error.response?.data;
      return {
        success: false,
        message: data?.message || error.message || 'Failed to delete caregiver account',
        blockers: data?.blockers || [],
        error: data?.message || error.message,
      };
    }
  },

  /**
   * Admin: schedule a client account for permanent deletion (30-day grace).
   * DELETE /api/Admin/Clients/{clientId}/account
   * @param {string} clientId
   * @param {string} reason — mandatory, must not be empty
   * @returns {Promise<{success, message?, permanentDeletionDate?, error?}>}
   */
  deleteClientAccount: async (clientId, reason) => {
    try {
      if (!clientId) return { success: false, error: 'Client ID is required' };
      if (!reason || !reason.trim()) return { success: false, error: 'Reason is required' };
      const response = await api.delete(`/Admin/Clients/${clientId}/account`, {
        data: { reason },
      });
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error deleting client account (admin):', error);
      const data = error.response?.data;
      return {
        success: false,
        message: data?.message || error.message || 'Failed to delete client account',
        blockers: data?.blockers || [],
        error: data?.message || error.message,
      };
    }
  },
};

export default adminService;

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
      const response = await api.get('/CareGivers/AllCaregivers');
      
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
      const response = await api.get(`/CareGivers/${caregiverId}`);
      
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
      const validTypes = ['SystemAlert', 'OrderNotification', 'MessageNotification', 'WithdrawalRequest'];
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
      const { senderId, type, content, title } = notificationData;

      // Validate required fields
      if (!senderId || !type || !content) {
        return {
          success: false,
          error: 'Missing required fields: senderId, type, and content are required'
        };
      }

      console.log('Broadcasting notification to all caregivers...');
      
      // Get all caregivers
      const caregiversResult = await adminService.getAllCaregivers();
      
      if (!caregiversResult.success) {
        return {
          success: false,
          error: 'Failed to fetch caregivers: ' + caregiversResult.error
        };
      }

      const caregivers = caregiversResult.data;
      
      if (!caregivers || caregivers.length === 0) {
        return {
          success: false,
          error: 'No caregivers found in the system'
        };
      }

      console.log(`Sending notification to ${caregivers.length} caregivers...`);

      // Send notification to each caregiver
      const results = await Promise.allSettled(
        caregivers.map(caregiver => 
          adminService.sendNotification({
            recipientId: caregiver.id,
            senderId,
            type,
            content,
            title
          })
        )
      );

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = results.length - successCount;
      const errors = results
        .filter(r => r.status === 'rejected' || !r.value.success)
        .map((r, idx) => ({
          caregiverId: caregivers[idx]?.id,
          error: r.status === 'rejected' ? r.reason : r.value.error
        }));

      return {
        success: successCount > 0,
        successCount,
        failureCount,
        total: caregivers.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error broadcasting notification to caregivers:', error);
      return {
        success: false,
        error: error.message || 'Failed to broadcast notification'
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
      const { senderId, type, content, title } = notificationData;

      // Validate required fields
      if (!senderId || !type || !content) {
        return {
          success: false,
          error: 'Missing required fields: senderId, type, and content are required'
        };
      }

      console.log('Broadcasting notification to all clients...');
      
      // Get all clients
      const clientsResult = await adminService.getAllClients();
      
      if (!clientsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch clients: ' + clientsResult.error
        };
      }

      const clients = clientsResult.data;
      
      if (!clients || clients.length === 0) {
        return {
          success: false,
          error: 'No clients found in the system'
        };
      }

      console.log(`Sending notification to ${clients.length} clients...`);

      // Send notification to each client
      const results = await Promise.allSettled(
        clients.map(client => 
          adminService.sendNotification({
            recipientId: client.id,
            senderId,
            type,
            content,
            title
          })
        )
      );

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = results.length - successCount;
      const errors = results
        .filter(r => r.status === 'rejected' || !r.value.success)
        .map((r, idx) => ({
          clientId: clients[idx]?.id,
          error: r.status === 'rejected' ? r.reason : r.value.error
        }));

      return {
        success: successCount > 0,
        successCount,
        failureCount,
        total: clients.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error broadcasting notification to clients:', error);
      return {
        success: false,
        error: error.message || 'Failed to broadcast notification'
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
      console.log('Broadcasting notification to all users (caregivers and clients)...');
      
      // Send to both caregivers and clients in parallel
      const [caregiversResult, clientsResult] = await Promise.all([
        adminService.broadcastNotificationToCaregivers(notificationData),
        adminService.broadcastNotificationToClients(notificationData)
      ]);

      const totalSuccess = (caregiversResult.successCount || 0) + (clientsResult.successCount || 0);
      const totalFailures = (caregiversResult.failureCount || 0) + (clientsResult.failureCount || 0);

      return {
        success: totalSuccess > 0,
        totalSuccessCount: totalSuccess,
        totalFailureCount: totalFailures,
        caregiversResult,
        clientsResult
      };
    } catch (error) {
      console.error('Error broadcasting notification to all users:', error);
      return {
        success: false,
        error: error.message || 'Failed to broadcast notification'
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
      
      // Fetch caregivers and clients in parallel
      const [caregiversResult, clientsResult] = await Promise.all([
        adminService.getAllCaregivers(),
        adminService.getAllClients()
      ]);

      if (!caregiversResult.success || !clientsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch user data'
        };
      }

      const caregivers = caregiversResult.data || [];
      const clients = clientsResult.data || [];

      // Calculate statistics
      const stats = {
        users: {
          total: caregivers.length + clients.length,
          caregivers: caregivers.length,
          clients: clients.length,
          activeCaregivers: caregivers.filter(cg => cg.status === true).length,
          availableCaregivers: caregivers.filter(cg => cg.isAvailable === true).length,
          activeClients: clients.filter(client => client.status === true).length
        },
        caregivers: {
          total: caregivers.length,
          active: caregivers.filter(cg => cg.status === true).length,
          inactive: caregivers.filter(cg => cg.status === false).length,
          available: caregivers.filter(cg => cg.isAvailable === true).length,
          totalEarnings: caregivers.reduce((sum, cg) => sum + (cg.totalEarning || 0), 0),
          totalOrders: caregivers.reduce((sum, cg) => sum + (cg.noOfOrders || 0), 0),
          totalHours: caregivers.reduce((sum, cg) => sum + (cg.noOfHoursSpent || 0), 0)
        },
        clients: {
          total: clients.length,
          active: clients.filter(client => client.status === true).length,
          inactive: clients.filter(client => client.status === false).length
        }
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard statistics'
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

  // ============================================
  // GIGS MANAGEMENT
  // ============================================

  /**
   * Get all gigs in the system
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  getAllGigs: async () => {
    try {
      console.log('Fetching all gigs...');
      const response = await api.get('/Gigs');
      
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

  // ============================================
  // ORDERS MANAGEMENT
  // ============================================

  /**
   * Get all orders in the system (Admin endpoint)
   * @returns {Promise<{success: boolean, data?: Array, count?: number, error?: string}>}
   */
  getAllOrders: async () => {
    try {
      console.log('Fetching all orders...');
      const response = await api.get('/Admins/AllOrders');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          count: response.data.count || 0
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
      const response = await api.get(`/ClientOrders/${orderId}`);
      
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
      const response = await api.get(`/ClientOrders/${clientUserId}`);
      
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
      const response = await api.get(`/ClientOrders/${caregiverId}`);
      
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
      const response = await api.get(`/ClientOrders/CaregiverOrders/${caregiverId}`);
      
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
      const response = await api.get(`/ClientOrders/gigId`);
      
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
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
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
      const response = await api.post('/Admins/SendEmail', {
        recipientEmail: emailData.recipientEmail,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        message: emailData.message
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || `Email sent successfully to ${emailData.recipientEmail}`
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to send email'
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send email'
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
   * @returns {Promise<{success: boolean, message?: string, stats?: Object, error?: string}>}
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
      const requestBody = {
        recipientType: bulkEmailData.recipientType,
        subject: bulkEmailData.subject,
        message: bulkEmailData.message
      };

      if (bulkEmailData.recipientType === 'Specific' && bulkEmailData.specificUserIds) {
        requestBody.specificUserIds = bulkEmailData.specificUserIds;
      }

      const response = await api.post('/Admins/SendBulkEmail', requestBody);

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Bulk email sent successfully',
          stats: {
            totalRecipients: response.data.totalRecipients || 0,
            successfulSends: response.data.successfulSends || 0,
            failedSends: response.data.failedSends || 0,
            errors: response.data.errors || []
          }
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to send bulk email'
      };
    } catch (error) {
      console.error('Error sending bulk email:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send bulk email'
      };
    }
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
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The CarePro Team
          </p>
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
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The CarePro Team
          </p>
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
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The CarePro Team
          </p>
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
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The CarePro Team
          </p>
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
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The CarePro Team
          </p>
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
    return ['WithdrawalRequest', 'SystemAlert', 'OrderNotification', 'MessageNotification'];
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
  getAllCertificates: async () => {
    try {
      console.log('Fetching all certificates...');
      const response = await api.get('/Admins/Certificates/All');
      
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
   * Manually approve a certificate after review
   * Endpoint: POST /api/Admins/Certificates/{certificateId}/Approve
   * @param {string} certificateId - Certificate ID
   * @param {string} adminId - Admin user ID performing the action
   * @param {string} [approvalNotes] - Optional admin notes/comments about the approval
   * @returns {Promise<{success: boolean, message?: string, certificate?: Object, error?: string}>}
   */
  approveCertificate: async (certificateId, adminId, approvalNotes = '') => {
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

      console.log(`Approving certificate: ${certificateId}`);
      const requestBody = {
        certificateId: certificateId,
        adminId: adminId,
        approvalNotes: approvalNotes || undefined
      };

      const response = await api.post(`/Admins/Certificates/${certificateId}/Approve`, requestBody);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Certificate approved successfully',
          certificate: response.data.certificate
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Failed to approve certificate'
      };
    } catch (error) {
      console.error('Error approving certificate:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to approve certificate'
      };
    }
  },

  /**
   * Manually reject a certificate with specific reason
   * Endpoint: POST /api/Admins/Certificates/{certificateId}/Reject
   * @param {string} certificateId - Certificate ID
   * @param {string} adminId - Admin user ID performing the action
   * @param {string} rejectionReason - Specific reason for rejection (REQUIRED - shown to caregiver)
   * @returns {Promise<{success: boolean, message?: string, certificate?: Object, error?: string}>}
   */
  rejectCertificate: async (certificateId, adminId, rejectionReason) => {
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

      if (!rejectionReason || rejectionReason.trim() === '') {
        return {
          success: false,
          error: 'Rejection reason is required'
        };
      }

      console.log(`Rejecting certificate: ${certificateId}`);
      const requestBody = {
        certificateId: certificateId,
        adminId: adminId,
        rejectionReason: rejectionReason
      };

      const response = await api.post(`/Admins/Certificates/${certificateId}/Reject`, requestBody);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Certificate rejected successfully',
          certificate: response.data.certificate
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Failed to reject certificate'
      };
    } catch (error) {
      console.error('Error rejecting certificate:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to reject certificate'
      };
    }
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
        ) : null
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
  }
};

export default adminService;

/**
 * Care Request Service
 * Handles submitting and managing client care requests.
 */
import api from './api';

class CareRequestService {
  /**
   * Submit a new care request
   * @param {Object} requestData - The care request form data
   * @returns {Promise<Object>} The created care request
   */
  static async submitCareRequest(requestData) {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const clientId = userDetails.id;

    if (!clientId) {
      throw new Error('User not logged in');
    }

    const payload = {
      clientId,
      serviceCategory: requestData.serviceCategory,
      title: requestData.title,
      description: requestData.description,
      urgency: requestData.urgency,
      schedule: requestData.schedule,
      frequency: requestData.frequency,
      duration: requestData.duration || null,
      location: requestData.location || null,
      budget: requestData.budget || null,
      specialRequirements: requestData.specialRequirements || null,
    };

    const response = await api.post('/CareRequests', payload);
    return response.data;
  }

  /**
   * Get all care requests for the current client
   * @returns {Promise<Array>} List of care requests
   */
  static async getCareRequests() {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const clientId = userDetails.id;

    if (!clientId) {
      throw new Error('User not logged in');
    }

    const response = await api.get(`/CareRequests/client/${clientId}`);
    return response.data;
  }

  /**
   * Get a single care request by ID
   * @param {string} requestId
   * @returns {Promise<Object>} The care request
   */
  static async getCareRequest(requestId) {
    const response = await api.get(`/CareRequests/${requestId}`);
    return response.data;
  }

  /**
   * Cancel a care request
   * @param {string} requestId
   * @returns {Promise<void>}
   */
  static async cancelCareRequest(requestId) {
    await api.put(`/CareRequests/${requestId}/cancel`);
  }

  /**
   * Get ranked caregiver matches for a care request
   * @param {string} requestId - The care request ID
   * @returns {Promise<Object>} Match results with ranked caregivers
   */
  static async getMatches(requestId) {
    try {
      const response = await api.get(`/CareRequests/${requestId}/matches`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to view these matches.');
      }
      throw error;
    }
  }

  /**
   * Admin: manually trigger matching for a care request
   * @param {string} requestId - The care request ID
   * @returns {Promise<Object>} Match results
   */
  static async triggerMatch(requestId) {
    const response = await api.post(`/CareRequests/${requestId}/match`);
    return response.data;
  }
}

export default CareRequestService;

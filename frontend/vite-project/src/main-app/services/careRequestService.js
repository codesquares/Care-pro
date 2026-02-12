/**
 * Care Request Service
 * Handles submitting and managing client care requests.
 */
import config from '../config';

class CareRequestService {
  /**
   * Submit a new care request
   * @param {Object} requestData - The care request form data
   * @returns {Promise<Object>} The created care request
   */
  static async submitCareRequest(requestData) {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const clientId = userDetails.id;
    const token = localStorage.getItem('authToken');

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

    const response = await fetch(`${config.BASE_URL}/CareRequests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to submit care request: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get all care requests for the current client
   * @returns {Promise<Array>} List of care requests
   */
  static async getCareRequests() {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const clientId = userDetails.id;
    const token = localStorage.getItem('authToken');

    if (!clientId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${config.BASE_URL}/CareRequests/client/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch care requests: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get a single care request by ID
   * @param {string} requestId
   * @returns {Promise<Object>} The care request
   */
  static async getCareRequest(requestId) {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${config.BASE_URL}/CareRequests/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch care request: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Cancel a care request
   * @param {string} requestId
   * @returns {Promise<void>}
   */
  static async cancelCareRequest(requestId) {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${config.BASE_URL}/CareRequests/${requestId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel care request: ${response.status}`);
    }
  }
}

export default CareRequestService;

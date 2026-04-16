/**
 * Care Request Service
 * Handles submitting and managing client care requests,
 * caregiver browsing/responding, and request lifecycle.
 */
import api from './api';

class CareRequestService {
  // ─── Helpers ───

  static _getClientId() {
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    if (!userDetails.id) throw new Error('User not logged in');
    return userDetails.id;
  }

  // ─── Client: Create & List ───

  static async submitCareRequest(requestData) {
    const clientId = this._getClientId();
    const payload = {
      clientId,
      serviceGroup: requestData.serviceGroup,
      serviceCategory: requestData.serviceCategory,
      title: requestData.title,
      tasks: requestData.tasks || [],
      notes: requestData.notes || null,
      experiencePreference: requestData.experiencePreference || null,
      certificationPreference: requestData.certificationPreference || null,
      languagePreference: requestData.languagePreference || null,
      urgency: requestData.urgency,
      schedule: requestData.schedule,
      frequency: requestData.frequency,
      duration: requestData.duration || null,
      location: requestData.location || null,
      budget: requestData.budget || null,
      budgetMin: requestData.budgetMin || null,
      budgetMax: requestData.budgetMax || null,
      budgetType: requestData.budgetType || null,
      servicePackageType: requestData.servicePackageType || null,
      serviceMode: requestData.serviceMode || null,
      specialRequirements: requestData.specialRequirements || null,
    };
    const response = await api.post('/CareRequests', payload);
    return response.data;
  }

  static async getCareRequests() {
    const clientId = this._getClientId();
    const response = await api.get(`/CareRequests/client/${clientId}`);
    return response.data?.data || [];
  }

  static async getCareRequest(requestId) {
    const response = await api.get(`/CareRequests/${requestId}`);
    return response.data;
  }

  // ─── Client: Request Detail with Responders ───

  static async getRequestDetail(requestId) {
    const response = await api.get(`/CareRequests/${requestId}/detail`);
    return response.data?.data || response.data;
  }

  // ─── Client: Shortlist / Remove Shortlist ───

  static async shortlistResponse(requestId, responseId) {
    const response = await api.put(`/CareRequests/${requestId}/responses/${responseId}/shortlist`);
    return response.data?.data || response.data;
  }

  static async removeShortlist(requestId, responseId) {
    const response = await api.put(`/CareRequests/${requestId}/responses/${responseId}/remove-shortlist`);
    return response.data?.data || response.data;
  }

  // ─── Client: Hire a Caregiver ───

  static async hireCaregiver(requestId, responseId) {
    const response = await api.post(`/CareRequests/${requestId}/responses/${responseId}/hire`);
    return response.data?.data || response.data;
  }

  // ─── Client: Lifecycle Management ───

  static async cancelCareRequest(requestId) {
    await api.put(`/CareRequests/${requestId}/cancel`);
  }

  static async pauseRequest(requestId) {
    const response = await api.put(`/CareRequests/${requestId}/pause`);
    return response.data;
  }

  static async reopenRequest(requestId) {
    const response = await api.put(`/CareRequests/${requestId}/reopen`);
    return response.data;
  }

  static async closeRequest(requestId) {
    const response = await api.put(`/CareRequests/${requestId}/close`);
    return response.data;
  }

  static async deleteRequest(requestId) {
    const response = await api.delete(`/CareRequests/${requestId}`);
    return response.data;
  }

  // ─── Client: Matches (existing) ───

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

  static async triggerMatch(requestId) {
    const response = await api.post(`/CareRequests/${requestId}/match`);
    return response.data;
  }

  // ─── Caregiver: Browse Matched Requests ───

  static async getMatchedRequestsForCaregiver(filters = {}) {
    const params = new URLSearchParams();
    if (filters.serviceType) params.append('serviceType', filters.serviceType);
    if (filters.budgetMin) params.append('budgetMin', filters.budgetMin);
    if (filters.budgetMax) params.append('budgetMax', filters.budgetMax);
    if (filters.location) params.append('location', filters.location);
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);

    const query = params.toString();
    const response = await api.get(`/CareRequests/caregiver/matched${query ? `?${query}` : ''}`);
    return response.data?.data || response.data;
  }

  // ─── Caregiver: View Single Request Detail ───

  static async getCaregiverViewRequest(requestId) {
    const response = await api.get(`/CareRequests/${requestId}/caregiver-view`);
    return response.data?.data || response.data;
  }

  // ─── Caregiver: Respond to a Request ───

  static async respondToRequest(requestId, payload = {}) {
    const response = await api.post(`/CareRequests/${requestId}/respond`, {
      message: payload.message || null,
      proposedRate: payload.proposedRate || null,
    });
    return response.data?.data || response.data;
  }
}

export default CareRequestService;

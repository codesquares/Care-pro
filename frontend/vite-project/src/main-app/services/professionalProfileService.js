/**
 * Professional Profile Service
 * Handles caregiver education, certifications, and work experience CRUD.
 * All endpoints require a valid Bearer JWT with Caregiver role.
 */
import api from './api';

const professionalProfileService = {
  // ─── EDUCATION ────────────────────────────────────────────────────────────

  async getEducation() {
    try {
      const response = await api.get('/caregiver/education');
      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching education:', error);
      return { success: false, data: [], error: error.response?.data?.message || 'Failed to load education.' };
    }
  },

  async addEducation(payload) {
    try {
      const response = await api.post('/caregiver/education', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding education:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to add education.' };
    }
  },

  async updateEducation(id, payload) {
    try {
      const response = await api.put(`/caregiver/education/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating education:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update education.' };
    }
  },

  async deleteEducation(id) {
    try {
      await api.delete(`/caregiver/education/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting education:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete education.' };
    }
  },

  // ─── CERTIFICATIONS & QUALIFICATIONS ─────────────────────────────────────

  async getCertifications() {
    try {
      const response = await api.get('/caregiver/certifications');
      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching certifications:', error);
      return { success: false, data: [], error: error.response?.data?.message || 'Failed to load certifications.' };
    }
  },

  async addCertification(payload) {
    try {
      const response = await api.post('/caregiver/certifications', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding certification:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to add certification.' };
    }
  },

  async updateCertification(id, payload) {
    try {
      const response = await api.put(`/caregiver/certifications/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating certification:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update certification.' };
    }
  },

  async deleteCertification(id) {
    try {
      await api.delete(`/caregiver/certifications/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting certification:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete certification.' };
    }
  },

  // ─── WORK EXPERIENCE ──────────────────────────────────────────────────────

  async getWorkExperience() {
    try {
      const response = await api.get('/caregiver/work-experience');
      return { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching work experience:', error);
      return { success: false, data: [], error: error.response?.data?.message || 'Failed to load work experience.' };
    }
  },

  async addWorkExperience(payload) {
    try {
      const response = await api.post('/caregiver/work-experience', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding work experience:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to add work experience.' };
    }
  },

  async updateWorkExperience(id, payload) {
    try {
      const response = await api.put(`/caregiver/work-experience/${id}`, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating work experience:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update work experience.' };
    }
  },

  async deleteWorkExperience(id) {
    try {
      await api.delete(`/caregiver/work-experience/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting work experience:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete work experience.' };
    }
  },
};

export default professionalProfileService;

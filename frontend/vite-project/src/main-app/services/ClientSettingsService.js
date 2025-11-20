/**
 * Client Settings Service
 * Handles all API calls related to client settings (password, profile updates, etc.)
 */
import axios from "axios";
import config from "../config";

const BASE_API_URL = config.BASE_URL;

const ClientSettingsService = {
  /**
   * Change client password
   * @param {Object} payload - Object containing currentPassword, newPassword, confirmPassword
   * @returns {Promise<Object>} Response data from API
   */
  async changePassword(payload) {
    try {
      const response = await axios.post(`${BASE_API_URL}/Clients/reset-password`, payload);
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);

      // Normalize error response
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || "Failed to change password");
      }
      throw new Error("Network error while changing password");
    }
  },

  /**
   * Update client profile (example: name, email, avatar)
   * @param {Object} payload - Profile fields to update
   * @returns {Promise<Object>} Response data
   */
  async updateProfile(payload) {
    try {
      const response = await axios.put(`${BASE_API_URL}/Clients/update-profile`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  /**
   * Get client notification preferences
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} Response data with notification preferences
   */
  async getNotificationPreferences(clientId) {
    try {
      const response = await axios.get(`${BASE_API_URL}/ClientPreferences/notification-preferences/${clientId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      
      // Normalize error response
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || "Failed to get notification preferences");
      }
      throw new Error("Network error while getting notification preferences");
    }
  },

  /**
   * Update client notification preferences
   * @param {string} clientId - Client ID
   * @param {Object} preferences - Notification preferences object
   * @returns {Promise<Object>} Response data
   */
  async updateNotificationPreferences(clientId, preferences) {
    try {
      const response = await axios.put(`${BASE_API_URL}/ClientPreferences/notification-preferences/${clientId}`, preferences);
      return response.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      
      // Normalize error response
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || "Failed to update notification preferences");
      }
      throw new Error("Network error while updating notification preferences");
    }
  },

  /**
   * Update client address/location
   * @param {string} clientId - Client ID
   * @param {string} homeAddress - Full home address string
   * @returns {Promise<Object>} Response data
   */
  async updateClientAddress(clientId, homeAddress) {
    try {
      const response = await axios.put(`${BASE_API_URL}/Clients/UpdateClientUser/${clientId}`, {
        homeAddress: homeAddress
      });
      
      return {
        success: true,
        data: response.data,
        message: "Address updated successfully"
      };
    } catch (error) {
      console.error("Error updating address:", error);
      
      // Normalize error response
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || "Failed to update address"
        };
      }
      throw new Error("Network error while updating address");
    }
  },
};

export default ClientSettingsService;

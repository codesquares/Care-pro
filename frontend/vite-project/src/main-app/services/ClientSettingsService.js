/**
 * Client Settings Service
 * Handles all API calls related to client settings (password, profile updates, etc.)
 */
import axios from "axios";

const BASE_API_URL = "https://carepro-api20241118153443.azurewebsites.net/api";

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
};

export default ClientSettingsService;

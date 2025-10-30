/**
 * Client Profile Service
 * Handles API operations related to client profiles
 */
/**
 * Client Profile Service
 * Handles client profile operations including CRUD and service management
 */
import config from "../config"; // Centralized API configuration

class ClientProfileService {
  /**
   * Get client profile information
   * @param {string} clientId - The ID of the client
   * @returns {Promise<Object>} The client profile data
   */
  static async getProfile(clientId) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      // API endpoint
      const API_URL = `${config.BASE_URL}/Clients/${clientId}`; // Using centralized API config
      
      // Make API request
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching client profile:", error);
      throw error;
    }
  }
  
  /**
   * Update client profile information
   * @param {string} clientId - The ID of the client
   * @param {Object} profileData - The updated profile data
   * @returns {Promise<Object>} The updated client profile
   */
  static async updateProfile(clientId, profileData) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      // API endpoint
      const API_URL = `${config.BASE_URL}/Clients/${clientId}`; // Using centralized API config
      
      // Get the authentication token
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Make API request
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating client profile:", error);
      throw error;
    }
  }
  
  /**
   * Update client profile picture
   * @param {string} clientId - The ID of the client
   * @param {File} imageFile - The profile image file to upload
   * @returns {Promise<Object>} The updated profile picture URL
   */
  static async updateProfilePicture(clientId, imageFile) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      if (!imageFile) {
        throw new Error("Image file is required");
      }
      
      // API endpoint 
      const API_URL = `${config.BASE_URL}/Clients/${clientId}/profile-picture`; // Using centralized API config
      
      // Get the authentication token
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('profilePicture', imageFile);
      
      // Make API request
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile picture: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  }
  
  /**
   * Get client service history
   * @param {string} clientId - The ID of the client
   * @returns {Promise<Array>} The client's service history
   */
  static async getServiceHistory(clientId) {
    try {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      // API endpoint
      const API_URL = `${config.BASE_URL}/Clients/${clientId}/services`; // Using centralized API config
      
      // Get the authentication token
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Make API request
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service history: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching service history:", error);
      throw error;
    }
  }
}

export default ClientProfileService;

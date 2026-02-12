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
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const profileData = await response.json();
      
      // Construct full profile picture URL if it's a relative path
      let profilePictureUrl = profileData.profileImage;
      if (profilePictureUrl && !profilePictureUrl.startsWith('http') && !profilePictureUrl.startsWith('data:')) {
        // Remove leading slash if present
        const cleanPath = profilePictureUrl.startsWith('/') ? profilePictureUrl.substring(1) : profilePictureUrl;
        // Construct full URL using base URL without /api suffix
        const baseUrl = config.BASE_URL.replace(/\/api$/, '');
        profilePictureUrl = `${baseUrl}/${cleanPath}`;
        console.log('Constructed profile picture URL:', profilePictureUrl);
      }
      
      // Map backend field names to frontend field names
      return {
        ...profileData,
        location: profileData.homeAddress,        // Map homeAddress → location
        phoneNumber: profileData.phoneNo,         // Map phoneNo → phoneNumber  
        profilePicture: profilePictureUrl         // Map profileImage → profilePicture with full URL
      };
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
      
      // API endpoint - corrected to use the right endpoint
      const API_URL = `${config.BASE_URL}/Clients/UpdateClientUser/${clientId}`; // Using centralized API config
      
      // Get the authentication token
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Prepare payload with only supported fields
      const payload = {
        firstName: profileData.firstName || '',
        middleName: profileData.middleName || '', // Added middleName support
        lastName: profileData.lastName || '',
        homeAddress: profileData.location || '', // Map location to homeAddress
        phoneNo: profileData.phoneNumber || '' // Map phoneNumber to phoneNo
      };
      
      console.log('Updating client profile with payload:', payload); // Debug log
      
      // Make API request
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      // Handle response - it might be JSON or plain text
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Handle plain text response
        const textResult = await response.text();
        console.log('API returned text response:', textResult);
        result = { message: textResult, success: true };
      }
      
      console.log('API response:', result); // Debug log
      
      // Return the updated profile data in the expected format
      return {
        ...profileData, // Keep all original data
        firstName: payload.firstName,
        middleName: payload.middleName,
        lastName: payload.lastName,
        location: payload.homeAddress, // Map back to location
        phoneNumber: payload.phoneNo // Map back to phoneNumber
      };
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
      const API_URL = `${config.BASE_URL}/Clients/UpdateProfilePicture/${clientId}`; // Using centralized API config
      
      // Get the authentication token
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('ProfileImage', imageFile);
      
      // Make API request
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile picture: ${response.status}`);
      }
      
      return await response.text();
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

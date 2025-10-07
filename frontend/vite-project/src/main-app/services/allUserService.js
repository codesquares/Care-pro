import api from './api';

/**
 * Service for fetching all users from the database
 * Returns unique emails with their roles for account creation validation
 */
export const allUserService = {
  /**
   * Fetch all users from CareGivers, Clients, and Admins endpoints
   * @returns {Promise<{success: boolean, data?: Array<{email: string, role: string}>, error?: string}>}
   */
  getAllUsers: async () => {
    try {
      console.log('Fetching all users from database...');
      
      // Define the endpoints and their corresponding roles
      const endpoints = [
        { url: '/CareGivers/AllCaregivers', role: 'caregiver' },
        { url: '/Clients/AllClientUsers', role: 'client' },
        { url: '/Admins/AllAdminUsers', role: 'admin' }
      ];

      // Fetch data from all endpoints in parallel
      const promises = endpoints.map(async (endpoint) => {
        try {
          console.log(`Fetching ${endpoint.role}s from ${endpoint.url}...`);
          const response = await api.get(endpoint.url);
          
          // Extract emails and add role information
          if (response.data && Array.isArray(response.data)) {
            return response.data
              .filter(user => user.email) // Only include users with valid emails
              .map(user => ({
                email: user.email.toLowerCase().trim(), // Normalize email for uniqueness
                role: endpoint.role
              }));
          }
          
          console.warn(`No data or invalid data format from ${endpoint.url}`);
          return [];
        } catch (error) {
          console.error(`Error fetching ${endpoint.role}s:`, error);
          // Don't fail the entire operation if one endpoint fails
          return [];
        }
      });

      // Wait for all requests to complete
      const results = await Promise.all(promises);
      
      // Flatten the results into a single array
      const allUsers = results.flat();
      
      // Remove duplicates based on email (keep the first occurrence)
      const uniqueUsers = [];
      const seenEmails = new Set();
      
      allUsers.forEach(user => {
        if (!seenEmails.has(user.email)) {
          seenEmails.add(user.email);
          uniqueUsers.push(user);
        }
      });

      console.log(`Successfully fetched ${uniqueUsers.length} unique users from database`);
      
      return {
        success: true,
        data: uniqueUsers
      };

    } catch (error) {
      console.error('Error fetching all users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      };
    }
  },

  /**
   * Check if an email already exists in the system
   * @param {string} email - Email to check
   * @returns {Promise<{exists: boolean, role?: string, error?: string}>}
   */
  checkEmailExists: async (email) => {
    try {
      if (!email || typeof email !== 'string') {
        return {
          exists: false,
          error: 'Invalid email provided'
        };
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Checking if email exists: ${normalizedEmail}`);
      
      const result = await allUserService.getAllUsers();
      
      if (!result.success) {
        return {
          exists: false,
          error: result.error
        };
      }

      const existingUser = result.data.find(user => user.email === normalizedEmail);
      
      if (existingUser) {
        console.log(`Email ${normalizedEmail} already exists with role: ${existingUser.role}`);
        return {
          exists: true,
          role: existingUser.role
        };
      }

      console.log(`Email ${normalizedEmail} is available`);
      return {
        exists: false
      };

    } catch (error) {
      console.error('Error checking email existence:', error);
      return {
        exists: false,
        error: error.message || 'Failed to check email'
      };
    }
  },

  /**
   * Get all emails grouped by role
   * @returns {Promise<{success: boolean, data?: {caregivers: string[], clients: string[], admins: string[]}, error?: string}>}
   */
  getUsersByRole: async () => {
    try {
      const result = await allUserService.getAllUsers();
      
      if (!result.success) {
        return result;
      }

      const groupedUsers = {
        caregivers: [],
        clients: [],
        admins: []
      };

      result.data.forEach(user => {
        switch (user.role) {
          case 'caregiver':
            groupedUsers.caregivers.push(user.email);
            break;
          case 'client':
            groupedUsers.clients.push(user.email);
            break;
          case 'admin':
            groupedUsers.admins.push(user.email);
            break;
        }
      });

      return {
        success: true,
        data: groupedUsers
      };

    } catch (error) {
      console.error('Error grouping users by role:', error);
      return {
        success: false,
        error: error.message || 'Failed to group users by role'
      };
    }
  }
};

export default allUserService;

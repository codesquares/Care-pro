import verificationService from './verificationService';

// User Service for managing user-related API calls
export const userService = {
  // Get user profile data
  getProfile: async () => {
    try {
      const userDetailsStr = localStorage.getItem("userDetails");
      if (!userDetailsStr) {
        console.warn("No userDetails found in localStorage");
        return {
          success: false,
          error: "User not logged in"
        };
      }

      let userDetails;
      try {
        userDetails = JSON.parse(userDetailsStr);
      } catch (parseErr) {
        console.error("Error parsing userDetails:", parseErr);
        return {
          success: false,
          error: "Invalid user session"
        };
      }

      if (!userDetails?.id) {
        console.warn("No user ID found in userDetails");
        return {
          success: false,
          error: "Invalid user session"
        };
      }

      console.log("Fetching profile for user ID:", userDetails.id);
      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/${userDetails.id}`);
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched caregiver data:", data);

      // Get verification status
      let verificationStatus = null;
      try {
        const verStatus = await verificationService.getVerificationStatus(userDetails.id);
        verificationStatus = verStatus;
      } catch (verErr) {
        console.warn("Failed to fetch verification status:", verErr);
      }

      // Return processed data in consistent format
      return {
        success: true,
        data: {
          // Basic info
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          username: data.email || "user@example.com",
          profilePicture: data.profileImage || data.profilePicture || null,
          
          // Profile details
          bio: data.aboutMe || data.aboutMeIntro || "",
          aboutMe: data.aboutMe || data.aboutMeIntro || "",
          location: data.location || "",
          
          // Rating and reviews (fallback to default values if not provided by API)
          rating: data.rating || 0,
          averageRating: data.averageRating || data.rating || 0,
          reviewsCount: data.reviewsCount || data.reviewCount || 0,
          reviewCount: data.reviewCount || data.reviewsCount || 0,
          
          // Dates
          createdAt: data.createdAt || null,
          lastDelivery: data.lastDelivery || null,
          
          // Media
          introVideo: data.introVideo || data.introVideoUrl || "",
          
          // Services and status
          services: data.services || [],
          status: data.status || false,
          isAvailable: data.isAvailable || false,
          
          // Additional fields from API
          id: data.id || "",
          middleName: data.middleName || "",
          phoneNo: data.phoneNo || "",
          role: data.role || "",
          homeAddress: data.homeAddress || "",
          totalEarning: data.totalEarning || 0,
          noOfOrders: data.noOfOrders || 0,
          noOfHoursSpent: data.noOfHoursSpent || 0,
          reasonForDeactivation: data.reasonForDeactivation || "",
          isDeleted: data.isDeleted || false,
          
          // Verification
          verificationStatus: verificationStatus,
          
          // Keep original data for debugging/fallback
          _originalData: data
        }
      };
      
    } catch (err) {
      console.error("Failed to load profile:", err);
      return {
        success: false,
        error: err.message || "An error occurred while fetching the profile.",
        data: null
      };
    }
  },

  // Update user location
  updateLocation: async (location) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userDetails"));
      
      if (!userDetails?.id) {
        throw new Error("User ID not found");
      }

      const response = await fetch(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverLocation/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Location updated successfully'
      };
      
    } catch (err) {
      console.error("Failed to update location:", err);
      return {
        success: false,
        error: err.message || "Failed to update location"
      };
    }
  }
};

// Legacy export for compatibility (if needed)
export const fetchProfile = async () => {
  return await userService.getProfile();
};
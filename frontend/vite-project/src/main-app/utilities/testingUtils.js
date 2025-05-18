/**
 * Utility functions for testing purposes
 */

/**
 * Sets the verification status in the user profile
 * @param {string} status - The verification status to set (e.g., "verified", "unverified", "pending")
 */
export const setVerificationStatus = (status = "verified") => {
  try {
    // Get existing user details
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    
    // Update with verification status
    const updatedDetails = {
      ...userDetails,
      verificationStatus: status
    };
    
    // Save back to localStorage
    localStorage.setItem("userDetails", JSON.stringify(updatedDetails));
    
    console.log(`Verification status set to "${status}" for testing`);
    return true;
  } catch (error) {
    console.error("Error setting verification status:", error);
    return false;
  }
};

/**
 * Gets the current verification status from user profile
 * @returns {string|null} The current verification status
 */
export const getVerificationStatus = () => {
  try {
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    return userDetails.verificationStatus || null;
  } catch (error) {
    console.error("Error getting verification status:", error);
    return null;
  }
};

// Instructions for using these utilities in the browser console:
/*
 * To set verification status to "verified":
 *   1. Open browser console 
 *   2. Run: import('/src/main-app/utilities/testingUtils.js').then(utils => utils.setVerificationStatus("verified"))
 * 
 * To check current verification status:
 *   import('/src/main-app/utilities/testingUtils.js').then(utils => console.log(utils.getVerificationStatus()))
 */

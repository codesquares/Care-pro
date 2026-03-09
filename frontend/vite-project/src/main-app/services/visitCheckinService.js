/**
 * Visit Check-In Service
 * Handles GPS check-in for caregiver visits.
 */
import config from "../config";

const VisitCheckinService = {
  /**
   * Get the caregiver's current GPS position from the browser.
   * @param {Object} [options] - Geolocation options
   * @returns {Promise<Object>} { success, coords: { latitude, longitude, accuracy }, error }
   */
  getCurrentPosition(options = {}) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: "Geolocation is not supported by your browser. Please use a modern browser.",
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          });
        },
        (err) => {
          let message;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message =
                "Location access denied. Please enable location permissions in your browser settings to check in.";
              break;
            case err.POSITION_UNAVAILABLE:
              message =
                "Unable to determine your location. Please ensure GPS is enabled on your device.";
              break;
            case err.TIMEOUT:
              message =
                "Location request timed out. Please try again in an open area with better signal.";
              break;
            default:
              message = "An unknown error occurred while getting your location.";
          }
          resolve({ success: false, error: message });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          ...options,
        }
      );
    });
  },

  /**
   * Submit a visit check-in to the backend.
   * @param {Object} data - { taskSheetId, orderId, latitude, longitude, accuracy }
   * @returns {Promise<Object>} { success, data, error }
   */
  async checkin({ taskSheetId, orderId, latitude, longitude, accuracy }) {
    try {
      if (!taskSheetId || !orderId) {
        return { success: false, error: "Task sheet and order ID are required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/visit-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskSheetId,
          orderId,
          latitude,
          longitude,
          accuracy,
          checkinTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Check-in failed (${response.status})`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in visit checkin:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Format distance for display.
   * @param {number|null} meters
   * @returns {string}
   */
  formatDistance(meters) {
    if (meters == null) return "Unknown";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  },
};

export default VisitCheckinService;

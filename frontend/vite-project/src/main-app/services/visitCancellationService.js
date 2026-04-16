/**
 * Visit Cancellation Service
 * Handles cancelling upcoming visits (task sheets) by the client,
 * and requesting cancellation by the caregiver.
 */
import config from "../config";

const VisitCancellationService = {
  /**
   * Cancel a visit (task sheet) for an order. (Client action)
   * POST /api/orders/{orderId}/cancel-visit
   * @param {string} orderId
   * @param {string} taskSheetId
   * @param {string} [reason] - Optional cancellation reason
   * @returns {Promise<Object>} { success, data, error, statusCode }
   */
  async cancelVisit(orderId, taskSheetId, reason) {
    try {
      if (!orderId || !taskSheetId) {
        return { success: false, error: "Order ID and task sheet ID are required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const body = { taskSheetId };
      if (reason) body.reason = reason;

      const response = await fetch(
        `${config.BASE_URL}/orders/${orderId}/cancel-visit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Failed to cancel visit (${response.status})`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: {
          message: data.message,
          creditAmount: data.creditAmount ?? null,
          newCreditBalance: data.newCreditBalance ?? null,
          taskSheetId: data.taskSheetId,
        },
      };
    } catch (error) {
      console.error("Error in cancelVisit:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Request a visit cancellation as a caregiver.
   * POST /api/orders/{orderId}/caregiver-cancel-visit
   * @param {string} orderId
   * @param {string} taskSheetId
   * @param {string} reason - Required cancellation reason
   * @returns {Promise<Object>} { success, data, error, statusCode }
   */
  async requestCaregiverCancellation(orderId, taskSheetId, reason) {
    try {
      if (!orderId || !taskSheetId) {
        return { success: false, error: "Order ID and task sheet ID are required" };
      }
      if (!reason || !reason.trim()) {
        return { success: false, error: "A reason is required for cancellation requests" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${config.BASE_URL}/orders/${orderId}/caregiver-cancel-visit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ taskSheetId, reason: reason.trim() }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Failed to request cancellation (${response.status})`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: {
          message: data.message,
          taskSheetId: data.taskSheetId,
        },
      };
    } catch (error) {
      console.error("Error in requestCaregiverCancellation:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },
};

export default VisitCancellationService;

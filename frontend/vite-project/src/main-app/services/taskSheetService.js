/**
 * Task Sheet Service
 * Handles task sheet CRUD operations for caregiver visit sessions.
 * Each task sheet represents one visit and contains checkable tasks.
 */
import config from "../config";

/** Check if a backend error indicates a completed order */
const isCompletedOrderError = (errorMsg) =>
  typeof errorMsg === "string" && errorMsg.toLowerCase().includes("completed");

const TaskSheetService = {
  /**
   * Get all task sheets for an order.
   * @param {string} orderId
   * @param {number} [billingCycleNumber] - optional filter
   * @returns {Promise<Object>} { success, sheets, maxSheets, currentSheetCount, error }
   */
  async getSheetsByOrderId(orderId, billingCycleNumber) {
    try {
      if (!orderId) {
        return { success: false, error: "Order ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      let url = `${config.BASE_URL}/TaskSheets/by-order/${orderId}`;
      if (billingCycleNumber != null) {
        url += `?billingCycleNumber=${billingCycleNumber}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 404) {
        return { success: true, sheets: [], maxSheets: 1, currentSheetCount: 0 };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to fetch task sheets: ${response.status}`;
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          orderCompleted: response.status === 400 && isCompletedOrderError(errorMsg),
        };
      }

      const data = await response.json();
      return {
        success: true,
        sheets: data.sheets || [],
        maxSheets: data.maxSheets ?? 1,
        currentSheetCount: data.currentSheetCount ?? (data.sheets || []).length,
      };
    } catch (error) {
      console.error("Error in getSheetsByOrderId:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Create a new task sheet for an order (pre-populated from gigPackageDetails).
   * @param {string} orderId
   * @returns {Promise<Object>} { success, data, error }
   */
  async createSheet(orderId) {
    try {
      if (!orderId) {
        return { success: false, error: "Order ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/TaskSheets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to create task sheet: ${response.status}`;
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          orderCompleted: response.status === 400 && isCompletedOrderError(errorMsg),
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in createSheet:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Update a task sheet's tasks (toggle completion, add tasks).
   * @param {string} taskSheetId
   * @param {Array} tasks - full tasks array
   * @returns {Promise<Object>} { success, data, error }
   */
  async updateSheet(taskSheetId, tasks) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/TaskSheets/${taskSheetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to update task sheet: ${response.status}`;
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          orderCompleted: response.status === 400 && isCompletedOrderError(errorMsg),
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in updateSheet:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Submit (finalize) a task sheet.
   * @param {string} taskSheetId
   * @returns {Promise<Object>} { success, data, error }
   */
  async submitSheet(taskSheetId, { clientSignature, signedAt } = {}) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const body = {};
      if (clientSignature) {
        body.clientSignature = clientSignature;
        body.signedAt = signedAt || new Date().toISOString();
      }

      const response = await fetch(`${config.BASE_URL}/TaskSheets/${taskSheetId}/submit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to submit task sheet: ${response.status}`;
        return {
          success: false,
          error: errorMsg,
          statusCode: response.status,
          orderCompleted: response.status === 400 && isCompletedOrderError(errorMsg),
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in submitSheet:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Compute maxSheets locally from order data (fallback if backend doesn't return it).
   * @param {Object} order
   * @returns {number}
   */
  computeMaxSheets(order) {
    if (!order) return 1;
    if (order.paymentOption === "monthly") {
      const freq = order.frequencyPerWeek || 1;
      return freq * 4;
    }
    return 1;
  },
};

export default TaskSheetService;

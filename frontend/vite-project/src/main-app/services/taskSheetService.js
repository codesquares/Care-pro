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
   * Activate a scheduled task sheet (changes status from "scheduled" to "in-progress").
   * @param {string} taskSheetId
   * @returns {Promise<Object>} { success, data, error }
   */
  async activateSheet(taskSheetId) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/TaskSheets/${taskSheetId}/activate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to activate task sheet: ${response.status}`;
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
      console.error("Error in activateSheet:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Reschedule a scheduled visit to a new date.
   * Allowed for: Client (order owner), Admin, SuperAdmin.
   * @param {string} taskSheetId
   * @param {string} newDate - ISO date string e.g. "2025-07-10T00:00:00Z"
   * @param {string} [reason]
   * @returns {Promise<Object>} { success, data, error }
   */
  async rescheduleSheet(taskSheetId, newDate, reason) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }
      if (!newDate) {
        return { success: false, error: "New date is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const body = { newDate, reason: reason || undefined };

      const response = await fetch(`${config.BASE_URL}/TaskSheets/${taskSheetId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || `Failed to reschedule: ${response.status}`;
        return { success: false, error: errorMsg, statusCode: response.status };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error in rescheduleSheet:", error);
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

  // ==========================================
  // TASK PROPOSAL ENDPOINTS (NEW)
  // ==========================================

  /**
   * Client proposes tasks on an in-progress task sheet.
   * @param {string} taskSheetId
   * @param {Array<{text: string}>} tasks - Array of task objects with text field
   * @returns {Promise<Object>} { success, data, error }
   */
  async clientProposeTasks(taskSheetId, tasks) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return { success: false, error: "At least one task is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${config.BASE_URL}/tasksheets/${taskSheetId}/client-propose-tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ tasks }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.error || `Failed to propose tasks: ${response.status}`;
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
      console.error("Error in clientProposeTasks:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Caregiver responds to client-proposed tasks (accept/reject).
   * @param {string} taskSheetId
   * @param {Array<{taskId: string, accepted: boolean}>} responses
   * @returns {Promise<Object>} { success, data, error }
   */
  async respondToProposedTasks(taskSheetId, responses) {
    try {
      if (!taskSheetId) {
        return { success: false, error: "Task sheet ID is required" };
      }
      if (!responses || !Array.isArray(responses) || responses.length === 0) {
        return { success: false, error: "At least one response is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${config.BASE_URL}/tasksheets/${taskSheetId}/respond-to-proposed-tasks`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ responses }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.error || `Failed to respond to proposed tasks: ${response.status}`;
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
      console.error("Error in respondToProposedTasks:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Check if a task sheet has pending proposed tasks that block submission.
   * @param {Object} sheet - Task sheet object
   * @returns {{ hasPending: boolean, pendingCount: number, pendingTasks: Array }}
   */
  getPendingProposedTasks(sheet) {
    const tasks = sheet?.tasks || [];
    const pendingTasks = tasks.filter(
      (t) => t.addedByClient && t.proposalStatus === "Pending"
    );
    return {
      hasPending: pendingTasks.length > 0,
      pendingCount: pendingTasks.length,
      pendingTasks,
    };
  },
};

export default TaskSheetService;

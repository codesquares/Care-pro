/**
 * Observation Report Service
 * Handles CRUD for caregiver observation reports.
 */
import config from "../config";

const VALID_CATEGORIES = [
  "client_behavior",
  "environment_concern",
  "health_observation",
  "care_plan_concern",
  "other",
];

const VALID_SEVERITIES = ["low", "medium", "high"];

const CATEGORY_LABELS = {
  client_behavior: "Client Behavior",
  environment_concern: "Environment Concern",
  health_observation: "Health Observation",
  care_plan_concern: "Care Plan Concern",
  other: "Other",
};

const SEVERITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const ObservationReportService = {
  VALID_CATEGORIES,
  VALID_SEVERITIES,
  CATEGORY_LABELS,
  SEVERITY_LABELS,

  /**
   * Create an observation report.
   * @param {Object} data
   * @returns {Promise<Object>} { success, data, error }
   */
  async create({ orderId, taskSheetId, category, description, severity, photos = [] }) {
    try {
      if (!orderId || !taskSheetId) {
        return { success: false, error: "Order and task sheet IDs are required" };
      }
      if (!description || description.trim().length === 0) {
        return { success: false, error: "Description is required" };
      }
      if (description.length > 2000) {
        return { success: false, error: "Description must be 2000 characters or less" };
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return { success: false, error: "Invalid category" };
      }
      if (!VALID_SEVERITIES.includes(severity)) {
        return { success: false, error: "Invalid severity" };
      }
      if (photos.length > 3) {
        return { success: false, error: "Maximum 3 photos allowed" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/observation-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          orderId,
          taskSheetId,
          category,
          description: description.trim(),
          severity,
          photos,
          reportedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Failed to submit report (${response.status})`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error creating observation report:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Get observation reports for an order, optionally filtered by task sheet.
   * @param {string} orderId
   * @param {string} [taskSheetId]
   * @returns {Promise<Object>} { success, data, error }
   */
  async getByOrder(orderId, taskSheetId) {
    try {
      if (!orderId) {
        return { success: false, error: "Order ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      let url = `${config.BASE_URL}/observation-reports?orderId=${encodeURIComponent(orderId)}`;
      if (taskSheetId) {
        url += `&taskSheetId=${encodeURIComponent(taskSheetId)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Failed to fetch reports (${response.status})`,
        };
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Error fetching observation reports:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },
};

export default ObservationReportService;

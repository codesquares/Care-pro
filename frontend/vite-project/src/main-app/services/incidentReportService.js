/**
 * Incident Report Service
 * Handles CRUD for caregiver incident reports.
 */
import config from "../config";

const VALID_INCIDENT_TYPES = [
  "fall",
  "injury",
  "medication_error",
  "property_damage",
  "behavioral",
  "health_emergency",
  "other",
];

const VALID_SEVERITIES = ["minor", "moderate", "serious", "critical"];

const INCIDENT_TYPE_LABELS = {
  fall: "Fall",
  injury: "Injury",
  medication_error: "Medication Error",
  property_damage: "Property Damage",
  behavioral: "Behavioral",
  health_emergency: "Health Emergency",
  other: "Other",
};

const SEVERITY_LABELS = {
  minor: "Minor",
  moderate: "Moderate",
  serious: "Serious",
  critical: "Critical",
};

const IncidentReportService = {
  VALID_INCIDENT_TYPES,
  VALID_SEVERITIES,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,

  /**
   * Create an incident report.
   * @param {Object} data
   * @returns {Promise<Object>} { success, data, error }
   */
  async create({
    orderId,
    taskSheetId = null,
    incidentType,
    dateTime,
    description,
    actionsTaken = "",
    witnesses = "",
    severity,
    photos = [],
  }) {
    try {
      if (!orderId) {
        return { success: false, error: "Order ID is required" };
      }
      if (!description || description.trim().length === 0) {
        return { success: false, error: "Description is required" };
      }
      if (description.length > 3000) {
        return { success: false, error: "Description must be 3000 characters or less" };
      }
      if (actionsTaken && actionsTaken.length > 2000) {
        return { success: false, error: "Actions taken must be 2000 characters or less" };
      }
      if (!VALID_INCIDENT_TYPES.includes(incidentType)) {
        return { success: false, error: "Invalid incident type" };
      }
      if (!VALID_SEVERITIES.includes(severity)) {
        return { success: false, error: "Invalid severity" };
      }
      if (photos.length > 5) {
        return { success: false, error: "Maximum 5 photos allowed" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(`${config.BASE_URL}/incident-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          orderId,
          taskSheetId,
          incidentType,
          dateTime: dateTime || new Date().toISOString(),
          description: description.trim(),
          actionsTaken: actionsTaken.trim(),
          witnesses: witnesses.trim(),
          severity,
          photos,
          reportedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Failed to submit incident report (${response.status})`,
          statusCode: response.status,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error creating incident report:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  /**
   * Get incident reports for an order.
   * @param {string} orderId
   * @returns {Promise<Object>} { success, data, error }
   */
  async getByOrder(orderId) {
    try {
      if (!orderId) {
        return { success: false, error: "Order ID is required" };
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return { success: false, error: "Authentication required" };
      }

      const url = `${config.BASE_URL}/incident-reports?orderId=${encodeURIComponent(orderId)}`;

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
          error: errorData.error || `Failed to fetch incident reports (${response.status})`,
        };
      }

      const data = await response.json();
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Error fetching incident reports:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },
};

export default IncidentReportService;

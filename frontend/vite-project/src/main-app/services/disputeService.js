/**
 * Dispute Service
 * Handles dispute lifecycle operations: raise, review, resolve, dismiss.
 */
import config from "../config";

const DisputeService = {
  // ==========================================
  // CONSTANTS
  // ==========================================

  VISIT_CATEGORIES: {
    CaregiverNoShow: "Caregiver No-Show",
    TasksNotCompleted: "Tasks Not Completed",
    QualityOfCare: "Quality of Care",
    Punctuality: "Punctuality",
    UnauthorizedAction: "Unauthorized Action",
  },

  ORDER_CATEGORIES: {
    DoubleCharged: "Double Charged",
    WrongBillingType: "Wrong Billing Type",
    SuspendedWithoutReason: "Suspended Without Reason",
    IncorrectAmount: "Incorrect Amount",
    UnauthorizedCharge: "Unauthorized Charge",
    Other: "Other",
  },

  STATUSES: {
    Open: "Open",
    UnderReview: "Under Review",
    Resolved: "Resolved",
    Dismissed: "Dismissed",
  },

  STATUS_COLORS: {
    Open: "#e74c3c",
    UnderReview: "#f39c12",
    Resolved: "#27ae60",
    Dismissed: "#95a5a6",
  },

  RESOLUTION_ACTIONS: {
    FullRefund: "Full Refund",
    PartialRefund: "Partial Refund",
    FundsReleased: "Funds Released to Caregiver",
    OrderCancelled: "Order Cancelled",
    NoAction: "No Action Needed",
    Escalated: "Escalated",
  },

  // ==========================================
  // HELPERS
  // ==========================================

  _getAuthHeaders() {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
  },

  async _request(url, options = {}) {
    const headers = this._getAuthHeaders();
    if (!headers) return { success: false, error: "Authentication required" };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 409) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.message || "An active dispute already exists for this target.",
          conflict: true,
        };
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.message || `Request failed: ${response.status}`,
          statusCode: response.status,
        };
      }

      const data = await response.json().catch(() => null);
      return { success: true, data };
    } catch (error) {
      console.error("DisputeService request error:", error);
      return { success: false, error: error.message || "Network error" };
    }
  },

  // ==========================================
  // CLIENT ACTIONS
  // ==========================================

  /**
   * Raise a dispute (order or visit level).
   */
  async raiseDispute({ orderId, taskSheetId, disputeType, category, reason }) {
    if (!orderId) return { success: false, error: "Order ID is required" };
    if (!reason?.trim()) return { success: false, error: "Reason is required" };
    if (!category) return { success: false, error: "Category is required" };

    return this._request(`${config.BASE_URL}/disputes/raise`, {
      method: "POST",
      body: JSON.stringify({
        orderId,
        taskSheetId: taskSheetId || null,
        disputeType: disputeType || "Order",
        category,
        reason,
      }),
    });
  },

  /**
   * Client reviews a visit (approve or dispute).
   */
  async reviewVisit(taskSheetId, { reviewStatus, disputeReason, disputeCategory }) {
    if (!taskSheetId) return { success: false, error: "Task sheet ID is required" };
    if (!reviewStatus) return { success: false, error: "Review status is required" };
    if (reviewStatus === "Disputed" && !disputeReason?.trim()) {
      return { success: false, error: "Dispute reason is required" };
    }

    return this._request(`${config.BASE_URL}/disputes/visit/${taskSheetId}/review`, {
      method: "POST",
      body: JSON.stringify({
        reviewStatus,
        disputeReason: disputeReason || null,
        disputeCategory: disputeCategory || null,
      }),
    });
  },

  // ==========================================
  // READ OPERATIONS
  // ==========================================

  async getById(disputeId) {
    if (!disputeId) return { success: false, error: "Dispute ID is required" };
    return this._request(`${config.BASE_URL}/disputes/${disputeId}`, { method: "GET" });
  },

  async getByOrder(orderId) {
    if (!orderId) return { success: false, error: "Order ID is required" };
    return this._request(`${config.BASE_URL}/disputes/order/${orderId}`, { method: "GET" });
  },

  async getByVisit(taskSheetId) {
    if (!taskSheetId) return { success: false, error: "Task sheet ID is required" };
    return this._request(`${config.BASE_URL}/disputes/visit/${taskSheetId}`, { method: "GET" });
  },

  /**
   * Admin: get all disputes with pagination and filters.
   */
  async getAll({ page = 1, pageSize = 20, status, disputeType } = {}) {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("pageSize", pageSize);
    if (status) params.set("status", status);
    if (disputeType) params.set("disputeType", disputeType);

    return this._request(`${config.BASE_URL}/disputes/all?${params.toString()}`, {
      method: "GET",
    });
  },

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================

  async markUnderReview(disputeId) {
    if (!disputeId) return { success: false, error: "Dispute ID is required" };
    return this._request(`${config.BASE_URL}/disputes/${disputeId}/review`, {
      method: "PUT",
    });
  },

  async resolveDispute(disputeId, { resolutionAction, adminNotes, resolutionSummary }) {
    if (!disputeId) return { success: false, error: "Dispute ID is required" };
    if (!resolutionAction) return { success: false, error: "Resolution action is required" };
    if (!adminNotes?.trim()) return { success: false, error: "Admin notes are required" };
    if (!resolutionSummary?.trim()) return { success: false, error: "Resolution summary is required" };

    return this._request(`${config.BASE_URL}/disputes/${disputeId}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ resolutionAction, adminNotes, resolutionSummary }),
    });
  },

  async dismissDispute(disputeId, { adminNotes, resolutionSummary }) {
    if (!disputeId) return { success: false, error: "Dispute ID is required" };
    if (!adminNotes?.trim()) return { success: false, error: "Admin notes are required" };

    return this._request(`${config.BASE_URL}/disputes/${disputeId}/dismiss`, {
      method: "PUT",
      body: JSON.stringify({
        resolutionAction: "NoAction",
        adminNotes,
        resolutionSummary: resolutionSummary || "",
      }),
    });
  },
};

export default DisputeService;

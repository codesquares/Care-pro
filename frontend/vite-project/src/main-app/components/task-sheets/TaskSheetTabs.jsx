import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import CaregiverAssignmentService from "../../services/caregiverAssignmentService";
import TaskSheetPage from "./TaskSheetPage";
import "./TaskSheets.css";

/**
 * TaskSheetTabs — orchestrates the visit-session tab bar and renders
 * the active TaskSheetPage.
 *
 * With pre-generated sheets (negotiation flow), all sheets arrive with
 * status "scheduled". The caregiver activates them sequentially.
 *
 * Legacy orders (no pre-generated sheets) still use the create-on-demand flow.
 *
 * A package assignment (Phase 9.5) has no ClientOrder and no pre-generated
 * sheets or maxSheets cap — pass assignmentId instead of order to use that path.
 * Each visit is started explicitly by the caregiver (no auto-created first visit),
 * since a package assignment is an ongoing engagement rather than a fixed gig.
 *
 * Props:
 *  - order: the full order object (needs id, gigPackageDetails, paymentOption, frequencyPerWeek)
 *  - assignmentId: a package Assignment's id — mutually exclusive with order
 *  - contract: optional contract object with service-location metadata
 */
const TaskSheetTabs = ({ order, assignmentId = null, contract = null }) => {
  const isAssignmentMode = !!assignmentId;
  const [sheets, setSheets] = useState([]);
  const [maxSheets, setMaxSheets] = useState(isAssignmentMode ? Infinity : 1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(
    !isAssignmentMode && order?.clientOrderStatus === "Completed"
  );
  const initialised = useRef(false);

  const orderId = order?.id;

  // Detect if this order has pre-generated (scheduled) sheets
  const hasPreGenerated = sheets.some((s) => s.status === "scheduled");
  const allPreGenerated = sheets.length > 0 && sheets.length >= maxSheets;

  // ------ Fetch existing sheets ------
  const fetchSheets = useCallback(async () => {
    if (isAssignmentMode) {
      setLoading(true);
      setError(null);
      const result = await CaregiverAssignmentService.getVisits(assignmentId);
      if (result.success) {
        const sorted = (result.data || []).sort(
          (a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0)
        );
        setSheets(sorted);
        setMaxSheets(Infinity);
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    if (!orderId) return;
    setLoading(true);
    setError(null);

    const result = await TaskSheetService.getSheetsByOrderId(orderId);

    if (result.success) {
      const sorted = (result.sheets || []).sort(
        (a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0)
      );
      setSheets(sorted);
      setMaxSheets(result.maxSheets ?? TaskSheetService.computeMaxSheets(order));
    } else {
      if (result.orderCompleted) {
        setOrderCompleted(true);
      }
      setError(result.error);
    }
    setLoading(false);
  }, [isAssignmentMode, assignmentId, orderId, order]);

  // ------ Init: fetch sheets once ------
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    fetchSheets();
  }, [fetchSheets]);

  // ------ Legacy: auto-create first sheet if none exist and no pre-generated flow ------
  // Assignment mode skips this — the caregiver starts each visit explicitly.
  useEffect(() => {
    if (isAssignmentMode || loading || creating || orderCompleted) return;
    if (sheets.length === 0 && orderId && !error) {
      handleCreateSheet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssignmentMode, loading, sheets.length, orderId, error, orderCompleted]);

  // ------ Real-time: re-fetch sheets on visit-related SignalR notifications ------
  const latestNotification = useSelector((state) => state.notifications.notifications[0]);
  useEffect(() => {
    if (!latestNotification) return;
    const t = (latestNotification.type || latestNotification.notificationType || "")
      .toLowerCase().replace(/[\s-]+/g, "_");
    if (!t.startsWith("visit_")) return;
    if (isAssignmentMode) {
      // Visit notifications carry a TaskSheetId, not the AssignmentId, so there's
      // no reliable id match here — refetch on any visit notification while this
      // assignment's tab is open (harmless extra fetch, not a bug).
      fetchSheets();
      return;
    }
    if (
      latestNotification.relatedEntityId === orderId ||
      latestNotification.orderId === orderId
    ) {
      fetchSheets();
    }
  }, [latestNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------ Auto-advance: if the active sheet is cancelled, jump to the next non-cancelled sheet ------
  useEffect(() => {
    if (loading || sheets.length === 0) return;
    const current = sheets[activeIndex];
    if (current && current.status === 'cancelled') {
      const nextIdx = sheets.findIndex(
        (s, i) => i > activeIndex && s.status !== 'cancelled'
      );
      if (nextIdx !== -1) {
        setActiveIndex(nextIdx);
      }
    }
  }, [sheets, activeIndex, loading]);

  // ------ Check if previous sheet is reviewed (for legacy create gate) ------
  // Cancelled sheets are transparent — skip them and check the last active sheet.
  const isPreviousSheetReviewed = () => {
    if (sheets.length === 0) return true;
    // Find the last non-cancelled sheet
    const activeSheets = sheets.filter((s) => s.status !== 'cancelled');
    if (activeSheets.length === 0) return true; // all cancelled
    const lastActive = activeSheets[activeSheets.length - 1];
    if (lastActive.status !== 'submitted') return false;
    if (lastActive.clientReviewStatus !== 'Approved' && lastActive.clientReviewStatus !== 'Disputed') return false;
    return true;
  };

  // Helper: get the last non-cancelled sheet (for toast messages)
  const getLastActiveSheet = () => {
    const activeSheets = sheets.filter((s) => s.status !== 'cancelled');
    return activeSheets.length > 0 ? activeSheets[activeSheets.length - 1] : sheets[sheets.length - 1];
  };

  // ------ Create a new sheet — order path is pre-generated-cap-aware; ------
  // ------ assignment path has no cap, just the sequential review gate. ------
  const handleCreateSheet = async (isAutoFirst = false) => {
    if (creating || orderCompleted) return;
    if (!isAssignmentMode && !isAutoFirst && sheets.length >= maxSheets) {
      toast.info("All visit sheets have been created for this order.");
      return;
    }

    if (!isAutoFirst && !isPreviousSheetReviewed()) {
      const blockingSheet = getLastActiveSheet();
      if (blockingSheet.status !== 'submitted') {
        toast.warn(`Visit ${blockingSheet.sheetNumber} must be submitted before creating the next visit.`);
      } else {
        toast.warn(`Visit ${blockingSheet.sheetNumber} must be reviewed by the client before creating the next visit.`);
      }
      return;
    }

    setCreating(true);
    const result = isAssignmentMode
      ? await TaskSheetService.createSheetForAssignment(assignmentId)
      : await TaskSheetService.createSheet(orderId);

    if (result.success) {
      setSheets((prev) => {
        const updated = [...prev, result.data].sort(
          (a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0)
        );
        setTimeout(() => setActiveIndex(updated.length - 1), 0);
        return updated;
      });
      if (!isAutoFirst) {
        toast.success(`Visit ${sheets.length + 1} started.`);
      }
    } else {
      const isDailyDuplicate =
        result.statusCode === 400 &&
        typeof result.error === "string" &&
        result.error.toLowerCase().includes("already been created for today");

      if (isDailyDuplicate) {
        toast.info("A visit has already been started today. Only one visit per day is allowed.");
      } else if (!isAutoFirst) {
        toast.error(result.error || "Failed to start visit.");
      }
      if (result.orderCompleted) setOrderCompleted(true);
      setError(result.error);
    }
    setCreating(false);
  };

  // ------ Activate a scheduled sheet ------
  const handleActivateSheet = async (sheetId) => {
    if (activating || orderCompleted) return;

    setActivating(true);
    const result = await TaskSheetService.activateSheet(sheetId);

    if (result.success) {
      setSheets((prev) =>
        prev.map((s) => (s.id === sheetId ? result.data : s))
      );
      toast.success(`Visit activated — you can now check in and complete tasks.`);
    } else {
      toast.error(result.error || "Failed to activate visit.");
    }
    setActivating(false);
  };

  // ------ Update a sheet in local state after save ------
  const handleSheetUpdated = (updatedSheet) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === updatedSheet.id ? updatedSheet : s))
    );
  };

  // ------ Render ------
  if (loading) {
    return (
      <div className="task-sheets-loading">
        <p>Loading task sheets...</p>
      </div>
    );
  }

  if (orderCompleted && sheets.length === 0) {
    return (
      <div className="task-sheets-error">
        <p>This order has been completed. Task sheets are no longer available.</p>
      </div>
    );
  }

  if (error && sheets.length === 0 && !orderCompleted) {
    return (
      <div className="task-sheets-error">
        <p>Failed to load task sheets: {error}</p>
        <button className="ts-retry-btn" onClick={fetchSheets}>
          Retry
        </button>
      </div>
    );
  }

  // Legacy: show "+" if not pre-generated and can add more. Assignment mode has
  // no cap, so it can always add more (the sequential-review gate still applies).
  const canAddMore = isAssignmentMode
    ? !orderCompleted
    : !allPreGenerated && sheets.length < maxSheets && !orderCompleted;
  const prevApproved = isPreviousSheetReviewed();
  const activeSheet = sheets[activeIndex] || null;
  const cancelledCount = sheets.filter((s) => s.status === "cancelled").length;
  const activeVisits = maxSheets - cancelledCount;

  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", month: "short", day: "numeric" });
  };

  const formatTimeStr = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="task-sheets-container">
      {/* Visit tab bar */}
      <div className="ts-tab-bar">
        {sheets.map((sheet, idx) => (
          <button
            key={sheet.id}
            className={`ts-tab ${idx === activeIndex ? "ts-tab--active" : ""} ${
              sheet.status === "submitted" ? "ts-tab--submitted" : ""
            } ${sheet.status === "cancelled" ? "ts-tab--cancelled" : ""} ${
              sheet.status === "scheduled" ? "ts-tab--scheduled" : ""
            }`}
            onClick={() => setActiveIndex(idx)}
          >
            <span className="ts-tab-label">Visit {sheet.sheetNumber}</span>
            {sheet.scheduledDate && (
              <span className="ts-tab-date">
                {formatScheduledDate(sheet.scheduledDate)}
                {sheet.scheduledStartTime && sheet.scheduledEndTime && (
                  <span className="ts-tab-time">
                    {formatTimeStr(sheet.scheduledStartTime)}{" – "}{formatTimeStr(sheet.scheduledEndTime)}{" (WAT)"}
                  </span>
                )}
              </span>
            )}
            {sheet.status === "submitted" && <span className="ts-tab-badge">✓</span>}
            {sheet.status === "cancelled" && <span className="ts-tab-badge">✕</span>}
            {sheet.status === "scheduled" && <span className="ts-tab-badge ts-tab-badge--scheduled">○</span>}
            {(sheet.observationReportCount > 0 || sheet.incidentReportCount > 0) && (
              <span className="ts-tab-report-dot" title={`${sheet.observationReportCount || 0} observations, ${sheet.incidentReportCount || 0} incidents`} />
            )}
          </button>
        ))}

        {canAddMore && (
          <button
            className={`ts-tab ts-tab--add ${!prevApproved ? 'ts-tab--locked' : ''}`}
            onClick={() => handleCreateSheet(false)}
            disabled={creating}
            title={!prevApproved ? 'Previous visit must be submitted and reviewed by client first' : (isAssignmentMode ? 'Start next visit' : 'Add another visit sheet')}
          >
            {creating ? "..." : (isAssignmentMode && sheets.length === 0 ? "+ Start Visit" : "+")}
          </button>
        )}
      </div>

      {/* Sheet count info */}
      <div className="ts-sheet-info">
        {isAssignmentMode ? (
          <span>
            {sheets.length} visit{sheets.length !== 1 ? "s" : ""} so far
          </span>
        ) : (
          <span>
            {activeVisits} of {maxSheets} visit{maxSheets !== 1 ? "s" : ""} active
          </span>
        )}
        {cancelledCount > 0 && (
          <span className="ts-sheet-info-detail">
            ({cancelledCount} cancelled)
          </span>
        )}
        {!isAssignmentMode && order?.paymentOption === "monthly" && cancelledCount === 0 && (
          <span className="ts-sheet-info-detail">
            ({order.frequencyPerWeek || 1}x/week &times; 4 weeks)
          </span>
        )}
      </div>

      {/* Active sheet content */}
      {activeSheet ? (
        <TaskSheetPage
          key={activeSheet.id}
          sheet={activeSheet}
          orderId={isAssignmentMode ? null : orderId}
          mode={isAssignmentMode ? "assignment" : "order"}
          serviceLocationSetByClient={contract?.serviceLocationSetByClient}
          serviceLocationSetAt={contract?.serviceLocationSetAt}
          serviceAddress={contract?.serviceAddress}
          onSheetUpdated={handleSheetUpdated}
          onActivateSheet={handleActivateSheet}
          activating={activating}
          orderCompleted={orderCompleted}
        />
      ) : (
        <div className="ts-empty">
          {creating ? (
            <p>Starting visit...</p>
          ) : isAssignmentMode ? (
            <p>No visits yet. Use "Start Visit" above when you arrive for your first visit.</p>
          ) : (
            <p>No visit sheets yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSheetTabs;

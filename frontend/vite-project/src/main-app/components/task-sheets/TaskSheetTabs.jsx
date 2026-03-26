import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
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
 * Props:
 *  - order: the full order object (needs id, gigPackageDetails, paymentOption, frequencyPerWeek)
 */
const TaskSheetTabs = ({ order }) => {
  const [sheets, setSheets] = useState([]);
  const [maxSheets, setMaxSheets] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(
    order?.clientOrderStatus === "Completed"
  );
  const initialised = useRef(false);

  const orderId = order?.id;

  // Detect if this order has pre-generated (scheduled) sheets
  const hasPreGenerated = sheets.some((s) => s.status === "scheduled");
  const allPreGenerated = sheets.length > 0 && sheets.length >= maxSheets;

  // ------ Fetch existing sheets ------
  const fetchSheets = useCallback(async () => {
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
  }, [orderId, order]);

  // ------ Init: fetch sheets once ------
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    fetchSheets();
  }, [fetchSheets]);

  // ------ Legacy: auto-create first sheet if none exist and no pre-generated flow ------
  useEffect(() => {
    if (loading || creating || orderCompleted) return;
    if (sheets.length === 0 && orderId && !error) {
      handleCreateSheet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sheets.length, orderId, error, orderCompleted]);

  // ------ Check if previous sheet is reviewed (for legacy create gate) ------
  const isPreviousSheetReviewed = () => {
    if (sheets.length === 0) return true;
    const lastSheet = sheets[sheets.length - 1];
    if (lastSheet.status !== 'submitted') return false;
    if (lastSheet.clientReviewStatus !== 'Approved' && lastSheet.clientReviewStatus !== 'Disputed') return false;
    return true;
  };

  // ------ Legacy: create a new sheet (only for orders without pre-generated sheets) ------
  const handleCreateSheet = async (isAutoFirst = false) => {
    if (creating || orderCompleted) return;
    if (!isAutoFirst && sheets.length >= maxSheets) {
      toast.info("All visit sheets have been created for this order.");
      return;
    }

    if (!isAutoFirst && !isPreviousSheetReviewed()) {
      const lastSheet = sheets[sheets.length - 1];
      if (lastSheet.status !== 'submitted') {
        toast.warn(`Visit ${lastSheet.sheetNumber} must be submitted before creating the next visit.`);
      } else {
        toast.warn(`Visit ${lastSheet.sheetNumber} must be reviewed by the client before creating the next visit.`);
      }
      return;
    }

    setCreating(true);
    const result = await TaskSheetService.createSheet(orderId);

    if (result.success) {
      setSheets((prev) => {
        const updated = [...prev, result.data].sort(
          (a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0)
        );
        setTimeout(() => setActiveIndex(updated.length - 1), 0);
        return updated;
      });
      if (!isAutoFirst) {
        toast.success(`Visit ${sheets.length + 1} sheet created.`);
      }
    } else {
      const isDailyDuplicate =
        result.statusCode === 400 &&
        typeof result.error === "string" &&
        result.error.toLowerCase().includes("already been created for today");

      if (isDailyDuplicate) {
        toast.info("A visit sheet has already been created for today. Only one visit per day is allowed.");
      } else if (!isAutoFirst) {
        toast.error(result.error || "Failed to create task sheet.");
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

  // Legacy: show "+" if not pre-generated and can add more
  const canAddMore = !allPreGenerated && sheets.length < maxSheets && !orderCompleted;
  const prevApproved = isPreviousSheetReviewed();
  const activeSheet = sheets[activeIndex] || null;
  const cancelledCount = sheets.filter((s) => s.status === "cancelled").length;
  const activeVisits = maxSheets - cancelledCount;

  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
              <span className="ts-tab-date">{formatScheduledDate(sheet.scheduledDate)}</span>
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
            title={!prevApproved ? 'Previous visit must be submitted and reviewed by client first' : 'Add another visit sheet'}
          >
            {creating ? "..." : "+"}
          </button>
        )}
      </div>

      {/* Sheet count info */}
      <div className="ts-sheet-info">
        <span>
          {activeVisits} of {maxSheets} visit{maxSheets !== 1 ? "s" : ""} active
        </span>
        {cancelledCount > 0 && (
          <span className="ts-sheet-info-detail">
            ({cancelledCount} cancelled)
          </span>
        )}
        {order?.paymentOption === "monthly" && cancelledCount === 0 && (
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
          orderId={orderId}
          onSheetUpdated={handleSheetUpdated}
          onActivateSheet={handleActivateSheet}
          activating={activating}
          orderCompleted={orderCompleted}
        />
      ) : (
        <div className="ts-empty">
          {creating ? <p>Creating first visit sheet...</p> : <p>No visit sheets yet.</p>}
        </div>
      )}
    </div>
  );
};

export default TaskSheetTabs;

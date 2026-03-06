import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import TaskSheetPage from "./TaskSheetPage";
import "./TaskSheets.css";

/**
 * TaskSheetTabs — orchestrates the visit-session tab bar, the + button,
 * and renders the active TaskSheetPage.
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
  const [error, setError] = useState(null);
  const [orderCompleted, setOrderCompleted] = useState(
    order?.clientOrderStatus === "Completed"
  );
  const initialised = useRef(false);

  const orderId = order?.id;

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

  // ------ Auto-create first sheet if none exist ------
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const init = async () => {
      await fetchSheets();
    };
    init();
  }, [fetchSheets]);

  // After sheets are loaded, auto-create the first one if empty
  useEffect(() => {
    if (loading || creating || orderCompleted) return;
    if (sheets.length === 0 && orderId && !error) {
      handleCreateSheet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sheets.length, orderId, error, orderCompleted]);

  // ------ Create a new sheet ------
  const handleCreateSheet = async (isAutoFirst = false) => {
    if (creating || orderCompleted) return;
    if (!isAutoFirst && sheets.length >= maxSheets) {
      toast.info("All visit sheets have been created for this order.");
      return;
    }

    setCreating(true);
    const result = await TaskSheetService.createSheet(orderId);

    if (result.success) {
      setSheets((prev) => {
        const updated = [...prev, result.data].sort(
          (a, b) => (a.sheetNumber || 0) - (b.sheetNumber || 0)
        );
        // Switch to the newly created tab
        setTimeout(() => setActiveIndex(updated.length - 1), 0);
        return updated;
      });
      if (!isAutoFirst) {
        toast.success(`Visit ${sheets.length + 1} sheet created.`);
      }
    } else {
      if (!isAutoFirst) {
        toast.error(result.error || "Failed to create task sheet.");
      }
      setError(result.error);
    }
    setCreating(false);
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

  const canAddMore = sheets.length < maxSheets && !orderCompleted;
  const activeSheet = sheets[activeIndex] || null;

  return (
    <div className="task-sheets-container">
      {/* Visit tab bar */}
      <div className="ts-tab-bar">
        {sheets.map((sheet, idx) => (
          <button
            key={sheet.id}
            className={`ts-tab ${idx === activeIndex ? "ts-tab--active" : ""} ${
              sheet.status === "submitted" ? "ts-tab--submitted" : ""
            }`}
            onClick={() => setActiveIndex(idx)}
          >
            Visit {sheet.sheetNumber}
            {sheet.status === "submitted" && <span className="ts-tab-badge">✓</span>}
          </button>
        ))}

        {canAddMore && (
          <button
            className="ts-tab ts-tab--add"
            onClick={() => handleCreateSheet(false)}
            disabled={creating}
            title="Add another visit sheet"
          >
            {creating ? "..." : "+"}
          </button>
        )}
      </div>

      {/* Sheet count info */}
      <div className="ts-sheet-info">
        <span>
          {sheets.length} of {maxSheets} visit{maxSheets !== 1 ? "s" : ""} created
        </span>
        {order?.paymentOption === "monthly" && (
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
          onSheetUpdated={handleSheetUpdated}
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

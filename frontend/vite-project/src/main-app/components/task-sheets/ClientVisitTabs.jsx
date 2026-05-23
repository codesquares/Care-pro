import { useState, useEffect, useCallback, useRef } from "react";
import TaskSheetService from "../../services/taskSheetService";
import ClientVisitView from "./ClientVisitView";
import "./ClientVisitView.css";

/**
 * ClientVisitTabs — displays ALL visits for a client order in a scrollable list.
 * Scheduled visits show as compact cards with cancel/reschedule actions.
 * Active/submitted visits expand to show the full ClientVisitView.
 *
 * Props:
 *  - order: the full order object (needs id, paymentOption, frequencyPerWeek)
 */
const ClientVisitTabs = ({ order, onVisitReviewed }) => {
  const [sheets, setSheets] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  const orderId = order?.id;

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
    } else if (result.orderCompleted) {
      setSheets([]);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchSheets();
  }, [fetchSheets]);

  const handleSheetUpdated = (updatedSheet) => {
    if (updatedSheet) {
      setSheets((prev) =>
        prev.map((s) => (s.id === updatedSheet.id ? { ...s, ...updatedSheet } : s))
      );
    }
  };

  const handleVisitReviewed = (updatedSheet) => {
    handleSheetUpdated(updatedSheet);
    if (onVisitReviewed) onVisitReviewed();
  };

  const toggleExpand = (sheetId) => {
    setExpandedId((prev) => (prev === sheetId ? null : sheetId));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-NG", {
      timeZone: "Africa/Lagos",
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeStr = (t) => {
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="cv-loading">
        <p>Loading visit history...</p>
      </div>
    );
  }

  if (error && sheets.length === 0) {
    return (
      <div className="cv-error">
        <p>Failed to load visit history: {error}</p>
        <button className="cv-retry-btn" onClick={() => { fetched.current = false; fetchSheets(); }}>
          Retry
        </button>
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="cv-empty">
        <p>No visits recorded yet for this order.</p>
      </div>
    );
  }

  const scheduledCount = sheets.filter((s) => s.status === "scheduled").length;
  const completedCount = sheets.filter((s) => s.status === "submitted").length;
  const cancelledCount = sheets.filter((s) => s.status === "cancelled").length;
  const inProgressCount = sheets.filter((s) => s.status === "in-progress").length;

  const statusIcon = (status) => {
    switch (status) {
      case "scheduled": return "○";
      case "in-progress": return "◌";
      case "submitted": return "✓";
      case "cancelled": return "✕";
      default: return "·";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "scheduled": return "Scheduled";
      case "in-progress": return "In Progress";
      case "submitted": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  return (
    <div className="cv-container">
      {/* Summary bar */}
      <div className="cv-summary-bar">
        <span className="cv-summary-total">{sheets.length} visit{sheets.length !== 1 ? "s" : ""}</span>
        {scheduledCount > 0 && <span className="cv-summary-tag cv-summary-tag--scheduled">{scheduledCount} upcoming</span>}
        {inProgressCount > 0 && <span className="cv-summary-tag cv-summary-tag--active">{inProgressCount} active</span>}
        {completedCount > 0 && <span className="cv-summary-tag cv-summary-tag--completed">{completedCount} completed</span>}
        {cancelledCount > 0 && <span className="cv-summary-tag cv-summary-tag--cancelled">{cancelledCount} cancelled</span>}
      </div>

      {/* All visits list */}
      <div className="cv-visit-list">
        {sheets.map((sheet) => {
          const isExpanded = expandedId === sheet.id;
          const isScheduled = sheet.status === "scheduled";
          const isCancelled = sheet.status === "cancelled";
          const needsDetail = !isScheduled; // in-progress, submitted, cancelled have detail views

          return (
            <div
              key={sheet.id}
              className={`cv-visit-card cv-visit-card--${sheet.status}`}
            >
              {/* Card header — always visible */}
              <div
                className={`cv-visit-card-header ${needsDetail ? "cv-visit-card-header--clickable" : ""}`}
                onClick={needsDetail ? () => toggleExpand(sheet.id) : undefined}
              >
                <div className="cv-visit-card-left">
                  <span className={`cv-visit-icon cv-visit-icon--${sheet.status}`}>
                    {statusIcon(sheet.status)}
                  </span>
                  <div className="cv-visit-card-info">
                    <span className="cv-visit-card-title">Visit {sheet.sheetNumber}</span>
                    <span className="cv-visit-card-date">
                      {formatDate(sheet.scheduledDate)}
                      {sheet.scheduledStartTime && sheet.scheduledEndTime && (
                        <span className="cv-visit-card-time">
                          {" · "}{formatTimeStr(sheet.scheduledStartTime)}{" – "}{formatTimeStr(sheet.scheduledEndTime)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="cv-visit-card-right">
                  <span className={`cv-visit-card-status cv-visit-card-status--${sheet.status}`}>
                    {statusLabel(sheet.status)}
                  </span>
                  {needsDetail && (
                    <span className={`cv-visit-chevron ${isExpanded ? "cv-visit-chevron--open" : ""}`}>
                      ›
                    </span>
                  )}
                </div>
              </div>

              {/* Scheduled visits: inline actions (always visible, no expand needed) */}
              {isScheduled && !isCancelled && (
                <div className="cv-visit-card-body">
                  <ClientVisitView
                    key={sheet.id}
                    sheet={sheet}
                    orderId={orderId}
                    onVisitReviewed={handleVisitReviewed}
                    onSheetUpdated={handleSheetUpdated}
                    onRescheduleSuccess={fetchSheets}
                  />
                </div>
              )}

              {/* Non-scheduled visits: expandable detail */}
              {needsDetail && isExpanded && (
                <div className="cv-visit-card-body">
                  <ClientVisitView
                    key={sheet.id}
                    sheet={sheet}
                    orderId={orderId}
                    onVisitReviewed={handleVisitReviewed}
                    onSheetUpdated={handleSheetUpdated}
                    onRescheduleSuccess={fetchSheets}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientVisitTabs;

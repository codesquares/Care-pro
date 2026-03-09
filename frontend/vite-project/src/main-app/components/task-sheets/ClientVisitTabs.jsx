import { useState, useEffect, useCallback, useRef } from "react";
import TaskSheetService from "../../services/taskSheetService";
import ClientVisitView from "./ClientVisitView";
import "./ClientVisitView.css";

/**
 * ClientVisitTabs — read-only visit tab navigation for the client side.
 * Fetches all task sheets for the order and presents them in tabs.
 *
 * Props:
 *  - order: the full order object (needs id, paymentOption, frequencyPerWeek)
 */
const ClientVisitTabs = ({ order }) => {
  const [sheets, setSheets] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
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
      // Backend blocks writes for completed orders but we just need to read —
      // treat as empty until backend allows GET for completed orders
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

  const activeSheet = sheets[activeIndex] || null;

  return (
    <div className="cv-container">
      {/* Visit tab bar */}
      {sheets.length > 1 && (
        <div className="cv-tab-bar">
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.id}
              className={`cv-tab ${idx === activeIndex ? "cv-tab--active" : ""} ${
                sheet.status === "submitted" ? "cv-tab--submitted" : ""
              }`}
              onClick={() => setActiveIndex(idx)}
            >
              Visit {sheet.sheetNumber}
              {sheet.status === "submitted" && (
                <span className="cv-tab-badge">✓</span>
              )}
              {(sheet.observationReportCount > 0 ||
                sheet.incidentReportCount > 0) && (
                <span
                  className="cv-tab-report-dot"
                  title={`${sheet.observationReportCount || 0} observations, ${
                    sheet.incidentReportCount || 0
                  } incidents`}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Visit count info */}
      <div className="cv-info">
        <span>
          {sheets.length} visit{sheets.length !== 1 ? "s" : ""} recorded
          {sheets.filter((s) => s.status === "submitted").length > 0 &&
            ` · ${sheets.filter((s) => s.status === "submitted").length} completed`}
        </span>
      </div>

      {/* Active visit content */}
      {activeSheet && (
        <ClientVisitView
          key={activeSheet.id}
          sheet={activeSheet}
          orderId={orderId}
        />
      )}
    </div>
  );
};

export default ClientVisitTabs;

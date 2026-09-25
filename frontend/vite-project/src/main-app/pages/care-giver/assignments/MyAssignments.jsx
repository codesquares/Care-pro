import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CaregiverAssignmentService from "../../../services/caregiverAssignmentService";
import "../../client/client-dashboard/clientDashboard.css";
import "../../client/client-dashboard/marketplaceHero.css";
import "./assignments.css";

const STATUS_LABEL = {
  PendingAcceptance: "Awaiting your response",
  Accepted: "Active",
  Declined: "Declined",
  Cancelled: "Cancelled",
};

const StatusBadge = ({ status }) => (
  <span className={`asn-status-badge asn-status-badge--${status}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const MyAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await CaregiverAssignmentService.getMyAssignments();
    if (result.success) {
      setAssignments(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="asn-page">
      <div className="marketplace-banner asn-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">My Assignments</h1>
          <p className="asn-banner-subtitle">
            Care package assignments matched to you, and where each one stands.
          </p>
        </div>
        <button type="button" className="asn-refresh-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="asn-content">
        {loading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {!loading && error && (
          <div className="no-results">
            <h3>Something went wrong</h3>
            <p className="error-message">{error}</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={load}>Try Again</button>
            </div>
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <div className="no-results">
            <h3>No assignments yet</h3>
            <p>
              A package assignment appears here once CarePro matches you to a
              confirmed client request.
            </p>
          </div>
        )}

        {!loading && !error && assignments.length > 0 && (
          <ul className="asn-list">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="asn-list-item"
                onClick={() => navigate(`/app/caregiver/assignments/${a.id}`)}
              >
                <div className="asn-list-item-main">
                  <strong>{a.clientName}</strong>
                  <span className="asn-list-item-tier">
                    {a.packageCategory} · {a.packageTierLabel}
                  </span>
                  {a.payCalculationType && (
                    <span className="asn-list-item-pay">
                      Pay basis: {a.payCalculationType}
                    </span>
                  )}
                </div>
                <div className="asn-list-item-meta">
                  <StatusBadge status={a.status} />
                  <span className="asn-list-item-date">
                    {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyAssignments;

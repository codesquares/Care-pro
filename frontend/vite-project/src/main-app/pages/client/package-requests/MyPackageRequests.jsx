import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ClientPackageRequestService from "../../../services/clientPackageRequestService";
import "../client-dashboard/clientDashboard.css";
import "./packageRequests.css";

const STATUS_LABEL = {
  pending: "Finding your caregiver",
  assigned: "Finding your caregiver",
  confirmed: "Caregiver confirmed",
  cancelled: "Cancelled",
};

const StatusBadge = ({ status }) => (
  <span className={`pr-status-badge pr-status-badge--${status}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const MyPackageRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await ClientPackageRequestService.getMyRequests();
    if (result.success) {
      setRequests(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <div className="category-page-header">
          <div className="pr-header-row">
            <div className="category-header-content">
              <h1 className="category-title">My Requests</h1>
              <p className="category-subtitle">
                Every care package request you've made, and where it stands.
              </p>
            </div>
            <button
              type="button"
              className="pr-refresh-btn"
              onClick={load}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

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

        {!loading && !error && requests.length === 0 && (
          <div className="no-results">
            <h3>No requests yet</h3>
            <p>
              A request appears here once payment for a care package is
              confirmed. Browse packages to get started.
            </p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={() => navigate("/marketplace")}>
                Browse Care Packages
              </button>
            </div>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <ul className="pr-list">
            {requests.map((req) => (
              <li
                key={req.id}
                className="pr-list-item"
                onClick={() => navigate(`/app/client/requests/${req.id}`)}
              >
                <div className="pr-list-item-main">
                  <strong>{req.packageCategory}</strong>
                  <span className="pr-list-item-tier">{req.packageTierLabel}</span>
                </div>
                <div className="pr-list-item-meta">
                  <StatusBadge status={req.status} />
                  <span className="pr-list-item-date">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
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

export default MyPackageRequests;

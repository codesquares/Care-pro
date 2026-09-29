import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CaregiverAssignmentService from "../../../services/caregiverAssignmentService";
import AssignmentDeclineDialog from "./AssignmentDeclineDialog";
import Modal from "../../../components/modal/Modal";
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

  // Which assignment's dialog is open / which is mid-request — keyed by id,
  // since this is a list and more than one card could have offers.
  const [acceptConfirmId, setAcceptConfirmId] = useState(null);
  const [declineDialogId, setDeclineDialogId] = useState(null);
  const [actionSubmittingId, setActionSubmittingId] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  // Pending offers first, most recently assigned first within each group —
  // matches the list's existing implicit ordering (backend already sorts by
  // AssignedAt desc), just partitioned so offers surface above settled ones.
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aPending = a.status === "PendingAcceptance" ? 0 : 1;
    const bPending = b.status === "PendingAcceptance" ? 0 : 1;
    return aPending - bPending;
  });

  const acceptTarget = assignments.find((a) => a.id === acceptConfirmId);

  const handleAccept = async (assignmentId) => {
    if (actionSubmittingId) return;
    setActionSubmittingId(assignmentId);
    setActionError(null);
    const result = await CaregiverAssignmentService.acceptAssignment(assignmentId);
    setActionSubmittingId(null);
    setAcceptConfirmId(null);
    if (!result.success) setActionError(result.error);
    await load();
  };

  const handleDecline = async (assignmentId, reason) => {
    if (actionSubmittingId) return;
    setActionSubmittingId(assignmentId);
    setActionError(null);
    const result = await CaregiverAssignmentService.declineAssignment(assignmentId, reason);
    setActionSubmittingId(null);
    setDeclineDialogId(null);
    if (!result.success) setActionError(result.error);
    await load();
  };

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

        {actionError && <p className="asn-inline-error">{actionError}</p>}

        {!loading && !error && assignments.length > 0 && (
          <ul className="asn-list">
            {sortedAssignments.map((a) => {
              const isOffer = a.status === "PendingAcceptance";
              const submitting = actionSubmittingId === a.id;
              return (
                <li
                  key={a.id}
                  className={`asn-list-item${isOffer ? " asn-list-item--offer" : ""}`}
                  onClick={() => navigate(`/app/caregiver/assignments/${a.id}`)}
                >
                  <div className="asn-list-item-main">
                    {isOffer && <span className="asn-offer-label">Offer awaiting your response</span>}
                    <strong>{a.clientName}</strong>
                    <span className="asn-list-item-tier">
                      {a.packageCategory} · {a.packageTierLabel}
                    </span>
                    {a.payCalculationType && (
                      <span className="asn-list-item-pay">
                        Pay basis: {a.payCalculationType}
                      </span>
                    )}
                    {isOffer && (
                      <div className="asn-offer-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="asn-offer-btn asn-offer-btn--accept"
                          onClick={() => setAcceptConfirmId(a.id)}
                          disabled={submitting}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="asn-offer-btn asn-offer-btn--decline"
                          onClick={() => setDeclineDialogId(a.id)}
                          disabled={submitting}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="asn-list-item-meta">
                    <StatusBadge status={a.status} />
                    <span className="asn-list-item-date">
                      {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        isOpen={!!acceptConfirmId}
        onClose={() => setAcceptConfirmId(null)}
        onProceed={() => handleAccept(acceptConfirmId)}
        title="Accept this assignment?"
        description={`Accepting is a commitment to ${acceptTarget?.clientName || "this client"} and to the contract terms — you'll be confirmed as their caregiver right away.`}
        buttonText={actionSubmittingId === acceptConfirmId ? "Accepting…" : "Yes, accept"}
        buttonBgColor="#2e7d32"
        secondaryButtonText="Cancel"
        onSecondaryAction={() => setAcceptConfirmId(null)}
      />

      <AssignmentDeclineDialog
        isOpen={!!declineDialogId}
        onCancel={() => setDeclineDialogId(null)}
        onConfirm={(reason) => handleDecline(declineDialogId, reason)}
        submitting={actionSubmittingId === declineDialogId}
      />
    </div>
  );
};

export default MyAssignments;

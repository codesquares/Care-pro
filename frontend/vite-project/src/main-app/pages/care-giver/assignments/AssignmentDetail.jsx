import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CaregiverAssignmentService from "../../../services/caregiverAssignmentService";
import AssignmentDeclineDialog from "./AssignmentDeclineDialog";
import Modal from "../../../components/modal/Modal";
import TaskSheetTabs from "../../../components/task-sheets/TaskSheetTabs";
import "../../client/client-dashboard/clientDashboard.css";
import "./assignments.css";

const STATUS_COPY = {
  PendingAcceptance: {
    title: "Awaiting your response",
    body: "This assignment hasn't been accepted yet. Once accepted, the contract and visit history will appear here.",
  },
  Declined: {
    title: "You declined this assignment",
    body: "This request has gone back to our team — they'll find another caregiver for it. No further action needed from you.",
  },
  Cancelled: {
    title: "This assignment was cancelled",
    body: "This assignment is no longer active. If this wasn't expected, reach out to CarePro support.",
  },
};

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadAssignment = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await CaregiverAssignmentService.getAssignmentById(id);
    if (result.success) {
      setAssignment(result.data);
    } else {
      setError(result.status === 404 ? "Assignment not found." : result.error);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const loadContract = useCallback(async () => {
    setContractLoading(true);
    setContractError(null);
    const result = await CaregiverAssignmentService.getContract(id);
    if (result.success) {
      setContract(result.data);
    } else if (result.status !== 404) {
      // A 404 just means the contract hasn't been generated yet — not an error to surface.
      setContractError(result.error);
    }
    setContractLoading(false);
  }, [id]);

  useEffect(() => {
    if (assignment?.status === "Accepted") {
      loadContract();
    }
  }, [assignment?.status, loadContract]);

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    const result = await CaregiverAssignmentService.downloadContractPdf(id);
    if (!result.success) {
      setContractError(result.error);
    }
    setPdfDownloading(false);
  };

  const handleAcceptConfirmed = async () => {
    // Guard at the handler level, not just via a disabled button — Modal
    // doesn't expose a disabled/loading prop for its own buttons, so a fast
    // double-click could otherwise fire this twice before the re-render lands.
    if (actionSubmitting) return;
    setActionSubmitting(true);
    setActionError(null);
    const result = await CaregiverAssignmentService.acceptAssignment(id);
    setActionSubmitting(false);
    setShowAcceptConfirm(false);
    if (result.success) {
      await loadAssignment();
    } else {
      // 403 (not your assignment) or 409 (already responded / cancelled by
      // staff) both land here — show the message, then reload so the status
      // badge and buttons reflect whatever actually happened server-side.
      setActionError(result.error);
      await loadAssignment();
    }
  };

  const handleDeclineConfirmed = async (reason) => {
    if (actionSubmitting) return;
    setActionSubmitting(true);
    setActionError(null);
    const result = await CaregiverAssignmentService.declineAssignment(id, reason);
    setActionSubmitting(false);
    setShowDeclineDialog(false);
    if (result.success) {
      await loadAssignment();
    } else {
      setActionError(result.error);
      await loadAssignment();
    }
  };

  if (loading) {
    return (
      <div className="asn-page">
        <div className="spinner-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="asn-page">
        <div className="no-results">
          <h3>Something went wrong</h3>
          <p className="error-message">{error || "Assignment not found."}</p>
          <div className="reset-buttons">
            <button className="reset-button" onClick={() => navigate("/app/caregiver/assignments")}>
              Back to My Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_COPY[assignment.status];
  const isAccepted = assignment.status === "Accepted";
  // Accepted, then ended (e.g. cancelled after acceptance): the conversation stays viewable, read-only.
  const wasAccepted = !isAccepted && !!assignment.respondedAt &&
    assignment.status !== "Declined" && assignment.status !== "PendingAcceptance";

  return (
    <div className="asn-page">
      <div className="asn-content">
        <button type="button" className="back-to-marketplace" onClick={() => navigate("/app/caregiver/assignments")}>
          ← My Assignments
        </button>

        <div className="asn-header-row">
          <div className="category-header-content">
            <h1 className="category-title">{assignment.clientName}</h1>
            <p className="category-subtitle">
              {assignment.packageCategory} · {assignment.packageTierLabel}
            </p>
          </div>
          <button type="button" className="asn-refresh-btn" onClick={loadAssignment}>
            Refresh
          </button>
        </div>

        <span className={`asn-status-badge asn-status-badge--${assignment.status}`}>
          {isAccepted ? "Active" : statusInfo?.title || assignment.status}
        </span>

        {assignment.payCalculationType && (
          <p className="asn-pay-basis">Pay basis: {assignment.payCalculationType}</p>
        )}

        {actionError && <p className="asn-inline-error">{actionError}</p>}

        {assignment.status === "PendingAcceptance" && (
          <div className="asn-offer-actions">
            <button
              type="button"
              className="asn-offer-btn asn-offer-btn--accept"
              onClick={() => setShowAcceptConfirm(true)}
              disabled={actionSubmitting}
            >
              Accept
            </button>
            <button
              type="button"
              className="asn-offer-btn asn-offer-btn--decline"
              onClick={() => setShowDeclineDialog(true)}
              disabled={actionSubmitting}
            >
              Decline
            </button>
          </div>
        )}

        {(isAccepted || wasAccepted) && (
          <button
            type="button"
            className="asn-message-btn"
            onClick={() => navigate(`/app/caregiver/message/${assignment.clientId}`)}
          >
            {isAccepted ? "Message your client" : "View conversation"}
          </button>
        )}

        {assignment.status === "Declined" && statusInfo && (
          <div className="asn-status-panel">
            <h2>{statusInfo.title}</h2>
            <p>{statusInfo.body}</p>
            {assignment.declineReason && <p>Reason given: {assignment.declineReason}</p>}
          </div>
        )}

        {!isAccepted && statusInfo && assignment.status !== "Declined" && (
          <div className="asn-status-panel">
            <h2>{statusInfo.title}</h2>
            <p>{statusInfo.body}</p>
          </div>
        )}

        {isAccepted && (
          <>
            <div className="asn-contract-card">
              <h2>Contract</h2>
              {contractLoading && <p>Loading contract…</p>}
              {!contractLoading && contractError && (
                <p className="error-message">{contractError}</p>
              )}
              {!contractLoading && !contract && !contractError && (
                <p className="asn-contract-generating">
                  Your contract is being generated — this is usually instant, but can take
                  a moment. Try{" "}
                  <button type="button" className="asn-inline-link-btn" onClick={loadContract}>
                    refreshing
                  </button>.
                </p>
              )}
              {!contractLoading && contract && (
                <>
                  <div className="asn-contract-summary">
                    <div>
                      <span className="asn-contract-label">Status</span>
                      <span>{contract.status}</span>
                    </div>
                    {contract.totalAmount != null && (
                      <div>
                        <span className="asn-contract-label">Total Amount</span>
                        <span>₦{contract.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {contract.contractStartDate && contract.contractEndDate && (
                      <div>
                        <span className="asn-contract-label">Contract Period</span>
                        <span>
                          {new Date(contract.contractStartDate).toLocaleDateString()} –{" "}
                          {new Date(contract.contractEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {contract.generatedTermsHtml && (
                    <div className="asn-contract-terms-wrap">
                      <iframe
                        srcDoc={contract.generatedTermsHtml}
                        sandbox="allow-same-origin"
                        className="asn-contract-terms-frame"
                        title="Contract Terms"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="asn-refresh-btn asn-download-btn"
                    onClick={handleDownloadPdf}
                    disabled={pdfDownloading}
                  >
                    {pdfDownloading ? "Downloading…" : "Download Contract PDF"}
                  </button>
                </>
              )}
            </div>

            <div className="asn-visits-card">
              <h2>Visits</h2>
              <p className="asn-visits-note">
                There's no pre-generated future schedule for package
                assignments — start each visit yourself when you arrive.
              </p>
              <TaskSheetTabs assignmentId={id} contract={contract} />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showAcceptConfirm}
        onClose={() => setShowAcceptConfirm(false)}
        onProceed={handleAcceptConfirmed}
        title="Accept this assignment?"
        description={`Accepting is a commitment to ${assignment.clientName || "this client"} and to the contract terms — you'll be confirmed as their caregiver right away.`}
        buttonText={actionSubmitting ? "Accepting…" : "Yes, accept"}
        buttonBgColor="#2e7d32"
        secondaryButtonText="Cancel"
        onSecondaryAction={() => setShowAcceptConfirm(false)}
      />

      <AssignmentDeclineDialog
        isOpen={showDeclineDialog}
        onCancel={() => setShowDeclineDialog(false)}
        onConfirm={handleDeclineConfirmed}
        submitting={actionSubmitting}
      />
    </div>
  );
};

export default AssignmentDetail;

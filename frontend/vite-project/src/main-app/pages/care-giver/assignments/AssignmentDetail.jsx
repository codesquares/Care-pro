import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CaregiverAssignmentService from "../../../services/caregiverAssignmentService";
import "../../client/client-dashboard/clientDashboard.css";
import "./assignments.css";

const STATUS_COPY = {
  PendingAcceptance: {
    title: "Awaiting your response",
    body: "This assignment hasn't been accepted yet. Once accepted, the contract and visit history will appear here.",
  },
  Declined: {
    title: "You declined this assignment",
    body: "This assignment is no longer active.",
  },
  Cancelled: {
    title: "This assignment was cancelled",
    body: "This assignment is no longer active. If this wasn't expected, reach out to CarePro support.",
  },
};

const formatMinutes = (minutes) => {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
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

  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState(null);

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

  const loadVisits = useCallback(async () => {
    setVisitsLoading(true);
    setVisitsError(null);
    const result = await CaregiverAssignmentService.getVisits(id);
    if (result.success) {
      setVisits(result.data);
    } else {
      setVisitsError(result.error);
    }
    setVisitsLoading(false);
  }, [id]);

  useEffect(() => {
    if (assignment?.status === "Accepted") {
      loadContract();
      loadVisits();
    }
  }, [assignment?.status, loadContract, loadVisits]);

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    const result = await CaregiverAssignmentService.downloadContractPdf(id);
    if (!result.success) {
      setContractError(result.error);
    }
    setPdfDownloading(false);
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

        {(isAccepted || wasAccepted) && (
          <button
            type="button"
            className="asn-message-btn"
            onClick={() => navigate(`/app/caregiver/message/${assignment.clientId}`)}
          >
            {isAccepted ? "Message your client" : "View conversation"}
          </button>
        )}

        {assignment.status === "Declined" && assignment.declineReason && (
          <div className="asn-status-panel">
            <h2>{statusInfo.title}</h2>
            <p>Reason given: {assignment.declineReason}</p>
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
                <p>No contract has been generated for this assignment yet.</p>
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
              <h2>Visit History</h2>
              <p className="asn-visits-note">
                This shows visits you've already checked in for — there's no
                pre-generated future schedule for package assignments, since
                each visit is created the day you check in.
              </p>

              {visitsLoading && <p>Loading visit history…</p>}
              {!visitsLoading && visitsError && (
                <p className="error-message">{visitsError}</p>
              )}
              {!visitsLoading && !visitsError && visits.length === 0 && (
                <p>No visits recorded yet for this assignment.</p>
              )}
              {!visitsLoading && !visitsError && visits.length > 0 && (
                <ul className="asn-visit-list">
                  {visits.map((v) => (
                    <li key={v.id} className="asn-visit-item">
                      <div className="asn-visit-main">
                        <strong>
                          {v.scheduledDate
                            ? new Date(v.scheduledDate).toLocaleDateString()
                            : "Undated visit"}
                        </strong>
                        <span className={`asn-visit-status asn-visit-status--${(v.status || "").toLowerCase()}`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="asn-visit-meta">
                        {v.checkin?.checkinTimestamp && (
                          <span>
                            Checked in {new Date(v.checkin.checkinTimestamp).toLocaleTimeString()}
                          </span>
                        )}
                        {v.visitDurationMinutes != null && (
                          <span>Duration: {formatMinutes(v.visitDurationMinutes)}</span>
                        )}
                        {v.submittedAt && (
                          <span>Submitted {new Date(v.submittedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;

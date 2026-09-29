import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ClientPackageRequestService from "../../../services/clientPackageRequestService";
import DisputeService from "../../../services/disputeService";
import ContractService from "../../../services/contractService";
import VisitCheckinService from "../../../services/visitCheckinService";
import { getInitials } from "../../../utils/avatarHelpers";
import "../client-dashboard/clientDashboard.css";
import "./packageRequests.css";

const formatMinutes = (minutes) => {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const STATUS_COPY = {
  pending: {
    title: "We're finding your caregiver",
    body: "Your request is in. CarePro's team is matching you with a vetted caregiver for this package — you'll see them here as soon as they're confirmed.",
  },
  assigned: {
    title: "We're finding your caregiver",
    body: "A caregiver has been proposed internally and is confirming their availability. You'll see their details here once they accept.",
  },
  cancelled: {
    title: "This request was cancelled",
    body: "This care package request is no longer active. If this wasn't expected, reach out to CarePro support.",
  },
};

const PackageRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [disputingId, setDisputingId] = useState(null);
  const [disputeCategory, setDisputeCategory] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await ClientPackageRequestService.getRequestById(id);
    if (result.success) {
      setRequest(result.data);
    } else {
      setError(result.status === 404 ? "Request not found." : result.error);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const loadContract = useCallback(async () => {
    setContractLoading(true);
    setContractError(null);
    const result = await ClientPackageRequestService.getContract(id);
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
    const result = await ClientPackageRequestService.getVisits(id);
    if (result.success) {
      setVisits(result.data);
    } else {
      setVisitsError(result.error);
    }
    setVisitsLoading(false);
  }, [id]);

  useEffect(() => {
    if (request?.status === "confirmed") {
      loadContract();
      loadVisits();
    }
  }, [request?.status, loadContract, loadVisits]);

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    const result = await ClientPackageRequestService.downloadContractPdf(id);
    if (!result.success) {
      setContractError(result.error);
    }
    setPdfDownloading(false);
  };

  const handleSetServiceLocation = async () => {
    if (gpsLoading || !contract?.id) return;
    setGpsLoading(true);
    setGpsError(null);

    const gpsResult = await VisitCheckinService.getCurrentPosition();
    if (!gpsResult.success) {
      setGpsError(gpsResult.error);
      setGpsLoading(false);
      return;
    }

    const result = await ContractService.setServiceLocation(contract.id, {
      latitude: gpsResult.coords.latitude,
      longitude: gpsResult.coords.longitude,
      accuracy: gpsResult.coords.accuracy,
    });

    if (result.success) {
      toast.success("Location confirmed — your caregiver's check-ins will now be verified against it.");
      await loadContract();
    } else {
      setGpsError(result.error || "Failed to save your location.");
    }
    setGpsLoading(false);
  };

  const handleApproveVisit = async (taskSheetId) => {
    if (reviewingId) return;
    setReviewingId(taskSheetId);
    const result = await DisputeService.reviewVisit(taskSheetId, { reviewStatus: "Approved" });
    if (result.success) {
      toast.success("Visit approved.");
      await loadVisits();
    } else {
      toast.error(result.error || "Failed to approve visit.");
    }
    setReviewingId(null);
  };

  const handleOpenDispute = (taskSheetId) => {
    setDisputingId(taskSheetId);
    setDisputeCategory("");
    setDisputeReason("");
  };

  const handleSubmitDispute = async (taskSheetId) => {
    if (!disputeCategory) {
      toast.error("Please select a category for the dispute.");
      return;
    }
    if (!disputeReason.trim()) {
      toast.error("Please describe what happened.");
      return;
    }
    if (reviewingId) return;
    setReviewingId(taskSheetId);
    const result = await DisputeService.reviewVisit(taskSheetId, {
      reviewStatus: "Disputed",
      disputeCategory,
      disputeReason: disputeReason.trim(),
    });
    if (result.success) {
      toast.success("Dispute submitted — our team will review it.");
      setDisputingId(null);
      await loadVisits();
    } else {
      toast.error(result.error || "Failed to submit dispute.");
    }
    setReviewingId(null);
  };

  if (loading) {
    return (
      <div className="dashboard client-dashboard-flex">
        <div className="rightbar">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="dashboard client-dashboard-flex">
        <div className="rightbar">
          <div className="no-results">
            <h3>Something went wrong</h3>
            <p className="error-message">{error || "Request not found."}</p>
            <div className="reset-buttons">
              <button className="reset-button" onClick={() => navigate("/app/client/requests")}>
                Back to My Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_COPY[request.status];
  const caregiver = request.confirmedCaregiver;

  return (
    <div className="dashboard client-dashboard-flex">
      <div className="rightbar">
        <div className="category-page-header">
          <button type="button" className="back-to-marketplace" onClick={() => navigate("/app/client/requests")}>
            ← My Requests
          </button>
          <div className="pr-header-row">
            <div className="category-header-content">
              <h1 className="category-title">{request.packageCategory}</h1>
              <p className="category-subtitle">{request.packageTierLabel}</p>
            </div>
            <button type="button" className="pr-refresh-btn" onClick={loadRequest}>
              Refresh
            </button>
          </div>
        </div>

        <span className={`pr-status-badge pr-status-badge--${request.status}`}>
          {request.status === "confirmed" ? "Caregiver confirmed" : statusInfo?.title || request.status}
        </span>

        {request.status !== "confirmed" && statusInfo && (
          <div className="pr-status-panel">
            <h2>{statusInfo.title}</h2>
            <p>{statusInfo.body}</p>
          </div>
        )}

        {request.status === "confirmed" && (
          <>
            <div className="pr-caregiver-card">
              <h2>Your caregiver</h2>
              {caregiver ? (
                <div className="pr-caregiver-body">
                  {caregiver.profileImage ? (
                    <img
                      src={caregiver.profileImage}
                      alt={caregiver.name}
                      className="pr-caregiver-photo"
                    />
                  ) : (
                    <div className="pr-caregiver-photo pr-caregiver-photo--initials">
                      {getInitials(caregiver.name)}
                    </div>
                  )}
                  <div>
                    <div className="pr-caregiver-name">{caregiver.name}</div>
                    <div className="pr-caregiver-meta">
                      {caregiver.caregiverType}
                      {caregiver.specialty ? ` · ${caregiver.specialty}` : ""}
                    </div>
                    {caregiver.confirmedAt && (
                      <div className="pr-caregiver-confirmed">
                        Confirmed {new Date(caregiver.confirmedAt).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      type="button"
                      className="pr-message-btn"
                      onClick={() => navigate(`/app/client/message/${caregiver.caregiverId}`)}
                    >
                      Message your caregiver
                    </button>
                  </div>
                </div>
              ) : (
                <p>Caregiver details are being finalized — check back shortly.</p>
              )}
            </div>

            <div className="pr-contract-card">
              <h2>Contract</h2>
              {contractLoading && <p>Loading contract…</p>}
              {!contractLoading && contractError && (
                <p className="error-message">{contractError}</p>
              )}
              {!contractLoading && !contract && !contractError && (
                <p>Your contract is being generated — check back shortly.</p>
              )}
              {!contractLoading && contract && (
                <>
                  <div className="pr-contract-summary">
                    <div>
                      <span className="pr-contract-label">Status</span>
                      <span>{contract.status}</span>
                    </div>
                    {contract.totalAmount != null && (
                      <div>
                        <span className="pr-contract-label">Total Amount</span>
                        <span>₦{contract.totalAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {contract.contractStartDate && contract.contractEndDate && (
                      <div>
                        <span className="pr-contract-label">Contract Period</span>
                        <span>
                          {new Date(contract.contractStartDate).toLocaleDateString()} –{" "}
                          {new Date(contract.contractEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pr-location-panel">
                    {contract.serviceLocationSetByClient ? (
                      <p className="pr-location-confirmed">
                        ✓ Precise location confirmed
                        {contract.serviceLocationSetAt
                          ? ` on ${new Date(contract.serviceLocationSetAt).toLocaleDateString()}`
                          : ""}
                        .{" "}
                        <button
                          type="button"
                          className="pr-location-update-link"
                          onClick={handleSetServiceLocation}
                          disabled={gpsLoading}
                        >
                          {gpsLoading ? "Updating…" : "Update it"}
                        </button>
                      </p>
                    ) : (
                      <>
                        <p className="pr-location-hint">
                          Share your exact location so we can verify your caregiver actually visited when they check in.
                          Without it, check-ins can't be distance-verified.
                        </p>
                        <button
                          type="button"
                          className="pr-location-btn"
                          onClick={handleSetServiceLocation}
                          disabled={gpsLoading}
                        >
                          {gpsLoading ? "Getting your location…" : "📍 Share My Precise Location"}
                        </button>
                      </>
                    )}
                    {gpsError && <p className="error-message pr-location-error">{gpsError}</p>}
                  </div>

                  {contract.generatedTermsHtml && (
                    <div className="pr-contract-terms-wrap">
                      <iframe
                        srcDoc={contract.generatedTermsHtml}
                        sandbox="allow-same-origin"
                        className="pr-contract-terms-frame"
                        title="Contract Terms"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="pr-refresh-btn pr-download-btn"
                    onClick={handleDownloadPdf}
                    disabled={pdfDownloading}
                  >
                    {pdfDownloading ? "Downloading…" : "Download Contract PDF"}
                  </button>
                </>
              )}
            </div>

            <div className="pr-visits-card">
              <h2>Visits</h2>
              {visitsLoading && <p>Loading visits…</p>}
              {!visitsLoading && visitsError && (
                <p className="error-message">{visitsError}</p>
              )}
              {!visitsLoading && !visitsError && visits.length === 0 && (
                <p>No visits recorded yet for this request.</p>
              )}
              {!visitsLoading && !visitsError && visits.length > 0 && (
                <ul className="pr-visit-list">
                  {visits.map((v) => {
                    const needsReview = v.status === "submitted" && !v.clientReviewStatus;
                    const completedCount = (v.tasks || []).filter((t) => t.completed).length;
                    return (
                      <li key={v.id} className="pr-visit-item">
                        <div className="pr-visit-main">
                          <strong>
                            Visit {v.sheetNumber}
                            {v.scheduledDate ? ` — ${new Date(v.scheduledDate).toLocaleDateString()}` : ""}
                          </strong>
                          <span className={`pr-visit-status pr-visit-status--${(v.status || "").toLowerCase()}`}>
                            {v.status === "in-progress" ? "In progress" : v.status}
                          </span>
                        </div>

                        <div className="pr-visit-meta">
                          {v.checkin?.checkinTimestamp && (
                            <span>
                              Caregiver checked in {new Date(v.checkin.checkinTimestamp).toLocaleTimeString()}
                              {v.checkin.distanceFromServiceAddress != null &&
                                ` (${Math.round(v.checkin.distanceFromServiceAddress)}m from service address)`}
                            </span>
                          )}
                          {v.visitDurationMinutes != null && (
                            <span>Duration: {formatMinutes(v.visitDurationMinutes)}</span>
                          )}
                          {v.tasks?.length > 0 && (
                            <span>Tasks: {completedCount}/{v.tasks.length} completed</span>
                          )}
                          {v.submittedAt && (
                            <span>Submitted {new Date(v.submittedAt).toLocaleString()}</span>
                          )}
                        </div>

                        {v.clientReviewStatus === "Approved" && (
                          <div className="pr-visit-review pr-visit-review--approved">✓ You approved this visit</div>
                        )}
                        {v.clientReviewStatus === "Disputed" && (
                          <div className="pr-visit-review pr-visit-review--disputed">
                            ⚠ Disputed{v.clientDisputeReason ? `: ${v.clientDisputeReason}` : ""}
                          </div>
                        )}

                        {needsReview && disputingId !== v.id && (
                          <div className="pr-visit-actions">
                            <button
                              type="button"
                              className="pr-visit-approve-btn"
                              onClick={() => handleApproveVisit(v.id)}
                              disabled={reviewingId === v.id}
                            >
                              {reviewingId === v.id ? "Approving…" : "Approve Visit"}
                            </button>
                            <button
                              type="button"
                              className="pr-visit-dispute-btn"
                              onClick={() => handleOpenDispute(v.id)}
                              disabled={reviewingId === v.id}
                            >
                              Dispute
                            </button>
                          </div>
                        )}

                        {needsReview && disputingId === v.id && (
                          <div className="pr-visit-dispute-form">
                            <select
                              value={disputeCategory}
                              onChange={(e) => setDisputeCategory(e.target.value)}
                              className="pr-visit-dispute-select"
                            >
                              <option value="">Select a reason…</option>
                              {Object.entries(DisputeService.VISIT_CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                            <textarea
                              className="pr-visit-dispute-reason"
                              placeholder="Describe what happened (required)"
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                              rows="3"
                            />
                            <div className="pr-visit-dispute-actions">
                              <button
                                type="button"
                                className="pr-visit-dispute-cancel-btn"
                                onClick={() => setDisputingId(null)}
                                disabled={reviewingId === v.id}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="pr-visit-dispute-submit-btn"
                                onClick={() => handleSubmitDispute(v.id)}
                                disabled={reviewingId === v.id}
                              >
                                {reviewingId === v.id ? "Submitting…" : "Submit Dispute"}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PackageRequestDetail;

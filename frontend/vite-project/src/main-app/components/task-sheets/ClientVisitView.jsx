import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ObservationReportService from "../../services/observationReportService";
import IncidentReportService from "../../services/incidentReportService";
import DisputeService from "../../services/disputeService";
import VisitCancellationService from "../../services/visitCancellationService";
import TaskSheetService from "../../services/taskSheetService";
import ClientProposeTasksSection from "./ClientProposeTasksSection";
import "./ClientVisitView.css";

/**
 * ClientVisitView — read-only view of a single visit sheet for the client.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - orderId: the order ID
 *  - onVisitReviewed: callback after approve/dispute
 */
const ClientVisitView = ({ sheet, orderId, onVisitReviewed, onSheetUpdated }) => {
  const [observations, setObservations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showObservations, setShowObservations] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // Visit review state
  const [reviewAction, setReviewAction] = useState(null); // null | 'confirm-approve' | 'dispute'
  const [visitDisputeCategory, setVisitDisputeCategory] = useState("");
  const [visitDisputeReason, setVisitDisputeReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Visit cancellation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const tasks = sheet.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const isSubmitted = sheet.status === "submitted";
  const isScheduled = sheet.status === "scheduled";
  const checkin = sheet.checkin || null;
  const clientReviewStatus = sheet.clientReviewStatus || "Pending";
  const isCancelled = sheet.status === "cancelled";

  // Determine cancellation tier based on hours until visit
  // Early:  ≥ 24 h → full credit (100%)
  // Mid:   12–24 h → 50% credit
  // Late:   < 12 h → no credit (0%)
  const cancellationTier = (() => {
    if (!sheet.scheduledDate) return "early";
    const hoursUntilVisit = (new Date(sheet.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilVisit < 12) return "late";
    if (hoursUntilVisit < 24) return "mid";
    return "early";
  })();

  const handleCancelVisit = async () => {
    setCancelLoading(true);
    const result = await VisitCancellationService.cancelVisit(
      orderId,
      sheet.id,
      cancelReason.trim() || undefined
    );
    if (result.success) {
      let creditMsg = "";
      if (result.data.creditAmount != null && result.data.creditAmount > 0) {
        creditMsg = ` ₦${result.data.creditAmount.toLocaleString()} has been credited to your wallet.`;
        if (result.data.newCreditBalance != null) {
          creditMsg += ` New balance: ₦${result.data.newCreditBalance.toLocaleString()}.`;
        }
      } else if (result.data.creditAmount === 0) {
        creditMsg = " No credit was issued (late cancellation).";
      }
      toast.success(`Visit cancelled.${creditMsg}`);
      setShowCancelConfirm(false);
      setCancelReason("");
      // Update local state to reflect cancelled status
      if (onSheetUpdated) onSheetUpdated({ ...sheet, status: "cancelled" });
    } else {
      toast.error(result.error || "Failed to cancel visit.");
    }
    setCancelLoading(false);
  };

  const handleRescheduleVisit = async () => {
    if (!rescheduleDate) {
      toast.error("Please select a new date.");
      return;
    }
    setRescheduleLoading(true);
    const result = await TaskSheetService.rescheduleSheet(
      sheet.id,
      `${rescheduleDate}T00:00:00Z`,
      rescheduleReason.trim() || undefined
    );
    if (result.success) {
      const msg = result.data.message || "Visit rescheduled successfully.";
      toast.success(msg);
      setShowReschedule(false);
      setRescheduleDate("");
      setRescheduleReason("");
      // Update local state with new date
      if (onSheetUpdated) {
        onSheetUpdated({
          ...sheet,
          scheduledDate: result.data.newDate || `${rescheduleDate}T00:00:00`,
        });
      }
    } else {
      toast.error(result.error || "Failed to reschedule visit.");
    }
    setRescheduleLoading(false);
  };

  const handleApproveVisit = async () => {
    setReviewLoading(true);
    const result = await DisputeService.reviewVisit(sheet.id, { reviewStatus: "Approved" });
    if (result.success) {
      toast.success("Visit approved!");
      if (onVisitReviewed) onVisitReviewed({ ...sheet, clientReviewStatus: "Approved" });
    } else {
      toast.error(result.error || "Failed to approve visit.");
    }
    setReviewLoading(false);
  };

  const handleDisputeVisit = async () => {
    if (!visitDisputeReason.trim()) {
      toast.error("Please describe the issue.");
      return;
    }
    if (!visitDisputeCategory) {
      toast.error("Please select a category.");
      return;
    }
    setReviewLoading(true);
    const result = await DisputeService.reviewVisit(sheet.id, {
      reviewStatus: "Disputed",
      disputeReason: visitDisputeReason,
      disputeCategory: visitDisputeCategory,
    });
    if (result.success) {
      toast.success("Visit dispute submitted. Our team will review it.");
      setReviewAction(null);
      setVisitDisputeReason("");
      setVisitDisputeCategory("");
      if (onVisitReviewed) onVisitReviewed({ ...sheet, clientReviewStatus: "Disputed" });
    } else if (result.conflict) {
      toast.warn(result.error);
    } else {
      toast.error(result.error || "Failed to submit dispute.");
    }
    setReviewLoading(false);
  };

  // Fetch reports when expanded
  useEffect(() => {
    if (!showObservations && !showIncidents) return;
    if (observations.length > 0 || incidents.length > 0) return;

    const fetchReports = async () => {
      setLoadingReports(true);
      const [obsResult, incResult] = await Promise.all([
        ObservationReportService.getByOrder(orderId, sheet.id),
        IncidentReportService.getByOrder(orderId),
      ]);

      if (obsResult.success) {
        // Filter to this sheet's reports
        setObservations(
          obsResult.data.filter((r) => r.taskSheetId === sheet.id)
        );
      }
      if (incResult.success) {
        setIncidents(
          incResult.data.filter((r) => r.taskSheetId === sheet.id)
        );
      }
      setLoadingReports(false);
    };
    fetchReports();
  }, [showObservations, showIncidents, orderId, sheet.id, observations.length, incidents.length]);

  return (
    <div className="cv-page">
      {/* Status banner */}
      <div className="cv-status-row">
        {isScheduled ? (
          <span className="cv-status-badge cv-status-badge--scheduled">
            📅 Scheduled
            {sheet.scheduledDate &&
              ` — ${new Date(sheet.scheduledDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
          </span>
        ) : isSubmitted ? (
          <span className="cv-status-badge cv-status-badge--submitted">
            ✓ Completed
            {sheet.submittedAt &&
              ` — ${new Date(sheet.submittedAt).toLocaleDateString()}`}
          </span>
        ) : (
          <span className="cv-status-badge cv-status-badge--pending">
            ◌ In Progress
          </span>
        )}
      </div>

      {/* Check-in info — not shown for scheduled sheets */}
      {!isScheduled && checkin && (
        <div className="cv-checkin">
          <span className="cv-checkin-icon">📍</span>
          <div className="cv-checkin-details">
            <span className="cv-checkin-label">Caregiver Checked In</span>
            <span className="cv-checkin-time">
              {checkin.checkinTimestamp
                ? new Date(checkin.checkinTimestamp).toLocaleString()
                : "—"}
            </span>
            {checkin.distanceFromServiceAddress != null && (
              <span className="cv-checkin-distance">
                {checkin.distanceFromServiceAddress}m from service address
              </span>
            )}
          </div>
        </div>
      )}

      {/* Visit duration */}
      {isSubmitted && sheet.visitDurationMinutes != null && (
        <div className="cv-duration">
          <span className="cv-duration-icon">⏱️</span>
          <span className="cv-duration-text">
            Visit duration: {sheet.visitDurationMinutes >= 60
              ? `${Math.floor(sheet.visitDurationMinutes / 60)}h ${Math.round(sheet.visitDurationMinutes % 60)}m`
              : `${Math.round(sheet.visitDurationMinutes)} min`}
          </span>
        </div>
      )}

      {/* Progress bar — hidden for scheduled sheets */}
      {!isScheduled && (
        <div className="cv-progress">
          <div className="cv-progress-bar">
            <div
              className="cv-progress-fill"
              style={{
                width:
                  tasks.length > 0
                    ? `${(completedCount / tasks.length) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="cv-progress-text">
            {completedCount}/{tasks.length} tasks completed
          </span>
        </div>
      )}

      {/* Scheduled sheet info + reschedule */}
      {isScheduled && (
        <div className="cv-scheduled-info">
          <p>This visit has not started yet. The caregiver will check in when they arrive.</p>
          <p>You can cancel or reschedule this visit below.</p>

          {!showReschedule ? (
            <button
              className="cv-reschedule-btn"
              onClick={() => setShowReschedule(true)}
            >
              📅 Reschedule Visit
            </button>
          ) : (
            <div className="cv-reschedule-form">
              <label className="cv-reschedule-label">New date</label>
              <input
                type="date"
                className="cv-reschedule-date-input"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <textarea
                className="cv-reschedule-reason-input"
                placeholder="Reason for rescheduling (optional)"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows="2"
              />
              <div className="cv-review-buttons">
                <button
                  className="cv-reschedule-confirm-btn"
                  onClick={handleRescheduleVisit}
                  disabled={rescheduleLoading || !rescheduleDate}
                >
                  {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
                <button
                  className="cv-review-cancel-btn"
                  onClick={() => { setShowReschedule(false); setRescheduleDate(""); setRescheduleReason(""); }}
                  disabled={rescheduleLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task list (read-only) — hidden for scheduled sheets */}
      {!isScheduled && (
      <div className="cv-task-list">
        {tasks.map((task, index) => (
          <div
            key={task.id || `t-${index}`}
            className={`cv-task ${task.completed ? "cv-task--done" : ""} ${
              task.addedByClient && task.proposalStatus === "Pending" ? "cv-task--pending" : ""
            } ${task.addedByClient && task.proposalStatus === "Rejected" ? "cv-task--rejected" : ""}`}
          >
            <span className="cv-task-check">
              {task.addedByClient && task.proposalStatus === "Rejected"
                ? "✕"
                : task.completed
                ? "✓"
                : "○"}
            </span>
            <span className={`cv-task-text ${
              task.addedByClient && task.proposalStatus === "Rejected" ? "cv-task-text--rejected" : ""
            }`}>
              {task.text}
            </span>
            {task.addedByCaregiver && (
              <span className="cv-task-custom-badge">Added by caregiver</span>
            )}
            {task.addedByClient && (
              <span className="cv-task-client-badge">Your proposal</span>
            )}
            {task.addedByClient && task.proposalStatus === "Pending" && (
              <span className="cv-task-pending-badge">⏳ Pending</span>
            )}
            {task.addedByClient && task.proposalStatus === "Rejected" && (
              <span className="cv-task-rejected-badge">❌ Rejected</span>
            )}
            {task.addedByClient && task.proposalStatus === "Accepted" && (
              <span className="cv-task-accepted-badge">✅ Accepted</span>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="cv-no-tasks">No tasks recorded for this visit.</p>
        )}
      </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="cv-review-badge cv-review-badge--disputed">
          🚫 This visit has been cancelled
        </div>
      )}

      {/* Client can propose tasks on in-progress sheets (not scheduled or cancelled) */}
      {!isSubmitted && !isCancelled && !isScheduled && (
        <ClientProposeTasksSection
          sheet={sheet}
          onSheetUpdated={(updatedSheet) => {
            if (onSheetUpdated) onSheetUpdated(updatedSheet);
          }}
        />
      )}

      {/* Cancel Visit — allowed for scheduled and in-progress sheets */}
      {!isSubmitted && !isCancelled && (
        <div className="cv-cancel-section">
          {!showCancelConfirm ? (
            <button
              className="cv-cancel-visit-btn"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel This Visit
            </button>
          ) : (
            <div className="cv-cancel-confirm">
              <p className="cv-cancel-prompt">
                Are you sure you want to cancel this visit?
              </p>
              {cancellationTier === "late" && (
                <p className="cv-cancel-late-warning">
                  ⚠️ This visit is less than 12 hours away. Late cancellations receive <strong>no credit</strong> — the full visit amount is forfeited to the caregiver.
                </p>
              )}
              {cancellationTier === "mid" && (
                <p className="cv-cancel-mid-warning">
                  ⚠️ This visit is 12–24 hours away. You will receive a <strong>50% credit</strong> refund — the other 50% goes to the caregiver.
                </p>
              )}
              {cancellationTier === "early" && sheet.scheduledDate && (
                <p className="cv-cancel-full-credit">
                  ✓ This visit is more than 24 hours away. You will receive a <strong>full credit refund</strong>.
                </p>
              )}
              <textarea
                className="cv-cancel-reason-input"
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows="2"
              />
              <div className="cv-review-buttons">
                <button
                  className="cv-review-dispute-btn"
                  onClick={handleCancelVisit}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling..." : "Yes, Cancel Visit"}
                </button>
                <button
                  className="cv-review-cancel-btn"
                  onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                  disabled={cancelLoading}
                >
                  Keep Visit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client Signature */}
      {isSubmitted && sheet.clientSignature?.signatureUrl && (
        <div className="cv-signature">
          <span className="cv-signature-label">Your Signature</span>
          <img
            src={sheet.clientSignature.signatureUrl}
            alt="Client signature"
            className="cv-signature-image"
          />
          {sheet.clientSignature.signedAt && (
            <span className="cv-signature-date">
              Signed {new Date(sheet.clientSignature.signedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Reports section */}
      <div className="cv-reports">
        {/* Observation reports */}
        {(sheet.observationReportCount > 0 || observations.length > 0) && (
          <div className="cv-report-group">
            <button
              className="cv-report-toggle"
              onClick={() => setShowObservations(!showObservations)}
            >
              📋 Observation Reports
              <span className="cv-report-count">
                {sheet.observationReportCount || observations.length}
              </span>
              <span className={`cv-chevron ${showObservations ? "cv-chevron--open" : ""}`}>
                ›
              </span>
            </button>
            {showObservations && (
              <div className="cv-report-list">
                {loadingReports ? (
                  <p className="cv-report-loading">Loading...</p>
                ) : observations.length > 0 ? (
                  observations.map((obs, i) => (
                    <div key={obs.id || i} className="cv-report-card">
                      <div className="cv-report-card-header">
                        <span className="cv-report-category">
                          {ObservationReportService.CATEGORY_LABELS[obs.category] || obs.category}
                        </span>
                        <span className={`cv-severity cv-severity--${obs.severity}`}>
                          {ObservationReportService.SEVERITY_LABELS[obs.severity] || obs.severity}
                        </span>
                      </div>
                      <p className="cv-report-description">{obs.description}</p>
                      {obs.createdAt && (
                        <span className="cv-report-date">
                          {new Date(obs.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="cv-report-loading">No observation reports found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Incident reports */}
        {(sheet.incidentReportCount > 0 || incidents.length > 0) && (
          <div className="cv-report-group">
            <button
              className="cv-report-toggle cv-report-toggle--incident"
              onClick={() => setShowIncidents(!showIncidents)}
            >
              🚨 Incident Reports
              <span className="cv-report-count cv-report-count--incident">
                {sheet.incidentReportCount || incidents.length}
              </span>
              <span className={`cv-chevron ${showIncidents ? "cv-chevron--open" : ""}`}>
                ›
              </span>
            </button>
            {showIncidents && (
              <div className="cv-report-list">
                {loadingReports ? (
                  <p className="cv-report-loading">Loading...</p>
                ) : incidents.length > 0 ? (
                  incidents.map((inc, i) => (
                    <div key={inc.id || i} className="cv-report-card cv-report-card--incident">
                      <div className="cv-report-card-header">
                        <span className="cv-report-category">
                          {IncidentReportService.INCIDENT_TYPE_LABELS[inc.incidentType] || inc.incidentType}
                        </span>
                        <span className={`cv-severity cv-severity--${inc.severity}`}>
                          {IncidentReportService.SEVERITY_LABELS[inc.severity] || inc.severity}
                        </span>
                      </div>
                      <p className="cv-report-description">{inc.description}</p>
                      {inc.actionsTaken && (
                        <p className="cv-report-actions-taken">
                          <strong>Actions taken:</strong> {inc.actionsTaken}
                        </p>
                      )}
                      {inc.dateTime && (
                        <span className="cv-report-date">
                          Occurred: {new Date(inc.dateTime).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="cv-report-loading">No incident reports found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visit Review Actions — only for submitted visits */}
      {isSubmitted && (
        <div className="cv-review-section">
          {clientReviewStatus === "Approved" ? (
            <div className="cv-review-badge cv-review-badge--approved">
              ✅ You approved this visit
              {sheet.clientReviewedAt && (
                <span className="cv-review-date"> — {new Date(sheet.clientReviewedAt).toLocaleDateString()}</span>
              )}
            </div>
          ) : clientReviewStatus === "Disputed" ? (
            <div className="cv-review-badge cv-review-badge--disputed">
              ⚠️ You disputed this visit
              {sheet.clientReviewedAt && (
                <span className="cv-review-date"> — {new Date(sheet.clientReviewedAt).toLocaleDateString()}</span>
              )}
              {sheet.clientDisputeReason && (
                <p className="cv-review-reason">{sheet.clientDisputeReason}</p>
              )}
            </div>
          ) : (
            <>
              {reviewAction === null ? (
                <div className="cv-review-actions">
                  <p className="cv-review-prompt">How was this visit?</p>
                  <div className="cv-review-buttons">
                    <button
                      className="cv-review-approve-btn"
                      onClick={() => setReviewAction('confirm-approve')}
                      disabled={reviewLoading}
                    >
                      ✓ Approve Visit
                    </button>
                    <button
                      className="cv-review-dispute-btn"
                      onClick={() => setReviewAction('dispute')}
                      disabled={reviewLoading}
                    >
                      ⚠️ Report Issue
                    </button>
                  </div>
                </div>
              ) : reviewAction === 'confirm-approve' ? (
                <div className="cv-review-actions" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                  <p className="cv-review-prompt" style={{ fontWeight: 600, marginBottom: '8px' }}>Confirm Visit Approval</p>
                  <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '12px' }}>
                    By approving this visit, you are authorizing CarePro to release payment for this visit to the caregiver. This action cannot be undone.
                  </p>
                  <div className="cv-review-buttons">
                    <button
                      className="cv-review-approve-btn"
                      onClick={handleApproveVisit}
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? 'Processing...' : '✓ Yes, Approve & Pay'}
                    </button>
                    <button
                      className="cv-review-cancel-btn"
                      onClick={() => setReviewAction(null)}
                      disabled={reviewLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cv-review-dispute-form">
                  <p className="cv-review-prompt">What went wrong with this visit?</p>
                  <select
                    className="cv-dispute-category-select"
                    value={visitDisputeCategory}
                    onChange={(e) => setVisitDisputeCategory(e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    {Object.entries(DisputeService.VISIT_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <textarea
                    className="cv-dispute-reason-input"
                    placeholder="Describe what happened..."
                    value={visitDisputeReason}
                    onChange={(e) => setVisitDisputeReason(e.target.value)}
                    rows="3"
                  />
                  <div className="cv-review-buttons">
                    <button
                      className="cv-review-dispute-btn"
                      onClick={handleDisputeVisit}
                      disabled={reviewLoading || !visitDisputeReason.trim() || !visitDisputeCategory}
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                    <button
                      className="cv-review-cancel-btn"
                      onClick={() => { setReviewAction(null); setVisitDisputeReason(""); setVisitDisputeCategory(""); }}
                      disabled={reviewLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientVisitView;

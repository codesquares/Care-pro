import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import VisitCancellationService from "../../services/visitCancellationService";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import CheckInSection from "./CheckInSection";
import SignOffModal from "./SignOffModal";
import ObservationReportModal from "./ObservationReportModal";
import IncidentReportModal from "./IncidentReportModal";
import "./TaskSheets.css";

const formatTimeStr = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
};

/**
 * TaskSheetPage — renders the checklist for a single visit sheet.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - orderId: the order ID (needed for check-in and reports)
 *  - onSheetUpdated: callback(updatedSheet) after a save/submit
 */
const TaskSheetPage = ({
  sheet,
  orderId,
  serviceLocationSetByClient,
  serviceLocationSetAt,
  serviceAddress,
  onSheetUpdated,
  onActivateSheet,
  activating,
  orderCompleted: orderCompletedProp,
}) => {
  const [tasks, setTasks] = useState(sheet.tasks || []);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(orderCompletedProp || false);
  const [checkin, setCheckin] = useState(sheet.checkin || null);
  const [showSignOff, setShowSignOff] = useState(false);
  const [showObservation, setShowObservation] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [observationCount, setObservationCount] = useState(sheet.observationReportCount || 0);
  const [incidentCount, setIncidentCount] = useState(sheet.incidentReportCount || 0);
  const [respondingToProposals, setRespondingToProposals] = useState(false);

  // Caregiver cancel-request state
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [cancelRequestReason, setCancelRequestReason] = useState("");
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);

  const isSubmitted = sheet.status === "submitted";
  const isCancelled = sheet.status === "cancelled";
  const isScheduled = sheet.status === "scheduled";
  const isReadOnly = isSubmitted || isCancelled || isScheduled || orderCompleted;
  const isCheckedIn = !!checkin;
  const debounceTimer = useRef(null);

  // Check for pending proposed tasks
  const { hasPending, pendingCount } = TaskSheetService.getPendingProposedTasks({ tasks });

  // ------ Debounced save after checkbox toggles ------
  const debouncedSave = useCallback(
    (updatedTasks) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        setSaving(true);
        const result = await TaskSheetService.updateSheet(sheet.id, updatedTasks);
        if (result.success) {
          onSheetUpdated(result.data);
        } else {
          if (result.orderCompleted) setOrderCompleted(true);
          toast.error(result.error || "Failed to save changes.");
        }
        setSaving(false);
      }, 600);
    },
    [sheet.id, onSheetUpdated]
  );

  // ------ Toggle a task ------
  const handleToggle = (taskId) => {
    if (isReadOnly) return;
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      debouncedSave(updated);
      return updated;
    });
  };

  // ------ Add a custom task ------
  const handleAddTask = async (text) => {
    if (isReadOnly) return;
    const newTask = {
      id: null, // backend generates
      text: text.trim(),
      completed: false,
      addedByCaregiver: true,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    // Save immediately (not debounced) so the task gets a real id from backend
    setSaving(true);
    const result = await TaskSheetService.updateSheet(sheet.id, updatedTasks);
    if (result.success) {
      setTasks(result.data.tasks || updatedTasks);
      onSheetUpdated(result.data);
    } else {
      if (result.orderCompleted) setOrderCompleted(true);
      toast.error(result.error || "Failed to add task.");
      // revert
      setTasks(tasks);
    }
    setSaving(false);
  };

  // ------ Submit the sheet (via sign-off modal) ------
  const handleSubmitClick = () => {
    if (isReadOnly || submitting) return;
    if (!isCheckedIn) {
      toast.error("Please check in at the service location before submitting.");
      return;
    }
    setShowSignOff(true);
  };

  const handleSignOffConfirm = async (signatureBase64) => {
    if (isReadOnly || submitting) return;

    // flush any pending debounced save
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      await TaskSheetService.updateSheet(sheet.id, tasks);
    }

    setSubmitting(true);
    const submitOptions = signatureBase64
      ? { clientSignature: signatureBase64, signedAt: new Date().toISOString() }
      : {};

    const result = await TaskSheetService.submitSheet(sheet.id, submitOptions);
    if (result.success) {
      onSheetUpdated(result.data);
      toast.success(`Visit ${sheet.sheetNumber} submitted!`);
      setShowSignOff(false);
    } else {
      if (result.orderCompleted) setOrderCompleted(true);
      toast.error(result.error || "Failed to submit.");
    }
    setSubmitting(false);
  };

  // ------ Check-in callback ------
  const handleCheckedIn = (checkinData) => {
    setCheckin(checkinData);
    // Update the sheet in parent so tab state reflects the check-in
    onSheetUpdated({ ...sheet, checkin: checkinData });
  };

  // ------ Report callbacks ------
  const handleObservationCreated = () => {
    setObservationCount((c) => c + 1);
  };

  const handleIncidentCreated = () => {
    setIncidentCount((c) => c + 1);
  };

  // ------ Accept/reject proposed tasks ------
  const handleAcceptProposedTask = async (taskId) => {
    await handleRespondToProposal([{ taskId, accepted: true }]);
  };

  const handleRejectProposedTask = async (taskId) => {
    await handleRespondToProposal([{ taskId, accepted: false }]);
  };

  const handleRespondToAllPending = async (accepted) => {
    const pendingTasks = tasks.filter(
      (t) => t.addedByClient && t.proposalStatus === "Pending"
    );
    if (pendingTasks.length === 0) return;
    const responses = pendingTasks.map((t) => ({ taskId: t.id, accepted }));
    await handleRespondToProposal(responses);
  };

  const handleRespondToProposal = async (responses) => {
    setRespondingToProposals(true);
    const result = await TaskSheetService.respondToProposedTasks(sheet.id, responses);
    if (result.success) {
      setTasks(result.data.tasks || tasks);
      onSheetUpdated(result.data);
      const acceptCount = responses.filter((r) => r.accepted).length;
      const rejectCount = responses.filter((r) => !r.accepted).length;
      if (acceptCount > 0) toast.success(`${acceptCount} task(s) accepted`);
      if (rejectCount > 0) toast.info(`${rejectCount} task(s) rejected`);
    } else {
      if (result.orderCompleted) setOrderCompleted(true);
      toast.error(result.error || "Failed to respond to proposed tasks.");
    }
    setRespondingToProposals(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleRequestCancellation = async () => {
    if (!cancelRequestReason.trim()) {
      toast.error("Please provide a reason for the cancellation request.");
      return;
    }
    setCancelRequestLoading(true);
    const result = await VisitCancellationService.requestCaregiverCancellation(
      orderId,
      sheet.id,
      cancelRequestReason
    );
    if (result.success) {
      toast.success(result.data.message || "Cancellation request submitted. The client will be notified.");
      setShowCancelRequest(false);
      setCancelRequestReason("");
    } else {
      toast.error(result.error || "Failed to submit cancellation request.");
    }
    setCancelRequestLoading(false);
  };

  return (
    <div className={`ts-page ${isReadOnly ? "ts-page--submitted" : ""}`}>
      {orderCompleted && (
        <div className="ts-order-completed-banner">
          This order has been completed. Task sheets can no longer be modified.
        </div>
      )}

      {isCancelled && (
        <div className="ts-order-completed-banner" style={{ background: '#fff3e0', color: '#e65100' }}>
          🚫 This visit has been cancelled by the client.
          <p style={{ fontSize: '13px', marginTop: '6px', fontWeight: 400 }}>
            No further action is needed. You can move on to the next scheduled visit.
          </p>
        </div>
      )}

      {isScheduled && (
        <div className="ts-scheduled-banner">
          <div className="ts-scheduled-banner-content">
            <span className="ts-scheduled-icon">📅</span>
            <div>
              <strong>Scheduled Visit</strong>
              {sheet.scheduledDate && (
                <span className="ts-scheduled-date">
                  {" — "}{new Date(sheet.scheduledDate).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "long", month: "long", day: "numeric" })}
                  {sheet.scheduledStartTime && sheet.scheduledEndTime &&
                    ` · ${formatTimeStr(sheet.scheduledStartTime)} – ${formatTimeStr(sheet.scheduledEndTime)} (WAT)`}
                </span>
              )}
              <p className="ts-scheduled-hint">When you arrive at the client's location, activate this visit to begin check-in.</p>
            </div>
          </div>
          <button
            className="ts-activate-btn"
            onClick={() => onActivateSheet(sheet.id)}
            disabled={activating}
          >
            {activating ? "Activating…" : "▶ Activate Visit"}
          </button>
        </div>
      )}

      {/* Check-in section — only shown after the sheet has been activated (not while still scheduled) */}
      {!isSubmitted && !isCancelled && !isScheduled && (
        <CheckInSection
          sheet={{ ...sheet, checkin }}
          orderId={orderId}
          serviceLocationSetByClient={serviceLocationSetByClient}
          serviceLocationSetAt={serviceLocationSetAt}
          serviceAddress={serviceAddress}
          onCheckedIn={handleCheckedIn}
          disabled={isSubmitted || isCancelled || orderCompleted}
        />
      )}

      <div className="ts-page-header">
        <h3>Visit {sheet.sheetNumber} Tasks</h3>
        {isSubmitted && (
          <span className="ts-submitted-badge">
            ✓ Submitted{" "}
            {sheet.submittedAt
              ? new Date(sheet.submittedAt).toLocaleDateString()
              : ""}
          </span>
        )}
        {!isSubmitted && saving && (
          <span className="ts-saving-indicator">Saving...</span>
        )}
      </div>

      {/* Visit duration (shown after submission) */}
      {isSubmitted && sheet.visitDurationMinutes != null && (
        <div className="ts-duration">
          <span className="ts-duration-icon">⏱️</span>
          <span className="ts-duration-text">
            Visit duration: {sheet.visitDurationMinutes >= 60
              ? `${Math.floor(sheet.visitDurationMinutes / 60)}h ${Math.round(sheet.visitDurationMinutes % 60)}m`
              : `${Math.round(sheet.visitDurationMinutes)} min`}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="ts-progress">
        <div className="ts-progress-bar">
          <div
            className="ts-progress-fill"
            style={{
              width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : "0%",
            }}
          />
        </div>
        <span className="ts-progress-text">
          {completedCount}/{tasks.length} completed
        </span>
      </div>

      {/* Task list */}
      <div className="ts-task-list">
        {/* Pending proposals banner */}
        {hasPending && !isReadOnly && (
          <div className="ts-pending-banner">
            <span>⚠️ {pendingCount} client-proposed task(s) need your review</span>
            <div className="ts-pending-banner-actions">
              <button
                className="ts-pending-accept-all"
                onClick={() => handleRespondToAllPending(true)}
                disabled={respondingToProposals}
              >
                Accept All
              </button>
              <button
                className="ts-pending-reject-all"
                onClick={() => handleRespondToAllPending(false)}
                disabled={respondingToProposals}
              >
                Reject All
              </button>
            </div>
          </div>
        )}

        {tasks.map((task, index) => (
          <TaskItem
            key={task.id || `temp-${index}`}
            task={task}
            disabled={isReadOnly}
            onToggle={() => handleToggle(task.id)}
            showProposalActions={!isReadOnly && task.addedByClient && task.proposalStatus === "Pending"}
            onAccept={handleAcceptProposedTask}
            onReject={handleRejectProposedTask}
          />
        ))}

        {tasks.length === 0 && (
          <p className="ts-no-tasks">No tasks on this sheet yet.</p>
        )}
      </div>

      {/* Add task input (only if not submitted) */}
      {!isReadOnly && <AddTaskInput onAdd={handleAddTask} disabled={saving} />}

      {/* Client signature display (if submitted with signature) */}
      {isSubmitted && sheet.clientSignature?.signatureUrl && (
        <div className="ts-signature-display">
          <span className="ts-signature-label">Client Signature</span>
          <img
            src={sheet.clientSignature.signatureUrl}
            alt="Client signature"
            className="ts-signature-image"
          />
          {sheet.clientSignature.signedAt && (
            <span className="ts-signature-date">
              Signed {new Date(sheet.clientSignature.signedAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} (WAT)
            </span>
          )}
        </div>
      )}

      {/* Report action buttons */}
      {!orderCompleted && (
        <div className="ts-report-actions">
          <button
            className="ts-report-btn ts-report-btn--observation"
            onClick={() => setShowObservation(true)}
          >
            📋 Observation Report
            {observationCount > 0 && (
              <span className="ts-report-badge">{observationCount}</span>
            )}
          </button>
          <button
            className="ts-report-btn ts-report-btn--incident"
            onClick={() => setShowIncident(true)}
          >
            🚨 Incident Report
            {incidentCount > 0 && (
              <span className="ts-report-badge ts-report-badge--incident">{incidentCount}</span>
            )}
          </button>
        </div>
      )}

      {/* Submit button */}
      {!isReadOnly && (
        <div className="ts-submit-section">
          <button
            className="ts-submit-btn"
            onClick={handleSubmitClick}
            disabled={submitting || tasks.length === 0 || hasPending}
          >
            {submitting ? "Submitting..." : `Submit Visit ${sheet.sheetNumber}`}
          </button>
          <p className="ts-submit-hint">
            {hasPending
              ? `⚠️ You must accept or reject all ${pendingCount} pending task proposal(s) before submitting.`
              : !isCheckedIn
              ? "You must check in before submitting."
              : "Client will sign off, then the sheet becomes read-only."}
          </p>
        </div>
      )}

      {/* Sign-off modal */}
      <SignOffModal
        isOpen={showSignOff}
        onClose={() => setShowSignOff(false)}
        onConfirm={handleSignOffConfirm}
        sheetNumber={sheet.sheetNumber}
        submitting={submitting}
      />

      {/* Caregiver cancel-request section */}
      {!isCancelled && !isSubmitted && (
        <div className="ts-caregiver-cancel-section">
          {!showCancelRequest ? (
            <button
              className="ts-caregiver-cancel-btn"
              onClick={() => setShowCancelRequest(true)}
            >
              ✕ Request Visit Cancellation
            </button>
          ) : (
            <div className="ts-caregiver-cancel-form">
              <p className="ts-caregiver-cancel-prompt">
                ⚠️ Request Visit Cancellation
              </p>
              <p className="ts-caregiver-cancel-info">
                The client will be notified and must confirm the cancellation. Please provide a clear reason.
              </p>
              <textarea
                className="ts-caregiver-cancel-reason"
                placeholder="Reason for cancellation request (required)"
                value={cancelRequestReason}
                onChange={(e) => setCancelRequestReason(e.target.value)}
                rows="3"
              />
              <div className="ts-caregiver-cancel-actions">
                <button
                  className="ts-caregiver-cancel-dismiss-btn"
                  onClick={() => { setShowCancelRequest(false); setCancelRequestReason(""); }}
                  disabled={cancelRequestLoading}
                >
                  Go Back
                </button>
                <button
                  className="ts-caregiver-cancel-submit-btn"
                  onClick={handleRequestCancellation}
                  disabled={cancelRequestLoading || !cancelRequestReason.trim()}
                >
                  {cancelRequestLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Observation report modal */}
      <ObservationReportModal
        isOpen={showObservation}
        onClose={() => setShowObservation(false)}
        orderId={orderId}
        taskSheetId={sheet.id}
        onReportCreated={handleObservationCreated}
      />

      {/* Incident report modal */}
      <IncidentReportModal
        isOpen={showIncident}
        onClose={() => setShowIncident(false)}
        orderId={orderId}
        taskSheetId={sheet.id}
        onReportCreated={handleIncidentCreated}
      />
    </div>
  );
};

export default TaskSheetPage;

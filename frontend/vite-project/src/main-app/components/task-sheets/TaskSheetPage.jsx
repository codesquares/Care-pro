import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import CheckInSection from "./CheckInSection";
import SignOffModal from "./SignOffModal";
import ObservationReportModal from "./ObservationReportModal";
import IncidentReportModal from "./IncidentReportModal";
import "./TaskSheets.css";

/**
 * TaskSheetPage — renders the checklist for a single visit sheet.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - orderId: the order ID (needed for check-in and reports)
 *  - onSheetUpdated: callback(updatedSheet) after a save/submit
 */
const TaskSheetPage = ({ sheet, orderId, onSheetUpdated, orderCompleted: orderCompletedProp }) => {
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

  const isSubmitted = sheet.status === "submitted";
  const isReadOnly = isSubmitted || orderCompleted;
  const isCheckedIn = !!checkin;
  const debounceTimer = useRef(null);

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

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className={`ts-page ${isReadOnly ? "ts-page--submitted" : ""}`}>
      {orderCompleted && (
        <div className="ts-order-completed-banner">
          This order has been completed. Task sheets can no longer be modified.
        </div>
      )}

      {/* Check-in section */}
      <CheckInSection
        sheet={{ ...sheet, checkin }}
        orderId={orderId}
        onCheckedIn={handleCheckedIn}
        disabled={isReadOnly}
      />

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
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id || `temp-${index}`}
            task={task}
            disabled={isReadOnly}
            onToggle={() => handleToggle(task.id)}
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
              Signed {new Date(sheet.clientSignature.signedAt).toLocaleString()}
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
            disabled={submitting || tasks.length === 0}
          >
            {submitting ? "Submitting..." : `Submit Visit ${sheet.sheetNumber}`}
          </button>
          <p className="ts-submit-hint">
            {!isCheckedIn
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

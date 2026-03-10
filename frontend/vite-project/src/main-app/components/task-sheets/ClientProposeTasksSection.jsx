import { useState } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import "../task-proposals/TaskProposals.css";

/**
 * ClientProposeTasksSection — Lets the client propose tasks on an in-progress task sheet.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - onSheetUpdated: callback(updatedSheet) after proposal submission
 */
const ClientProposeTasksSection = ({ sheet, onSheetUpdated }) => {
  const [showForm, setShowForm] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = sheet.status === "submitted";
  if (isSubmitted) return null;

  const handleAddToList = () => {
    const text = newTaskText.trim();
    if (!text) return;
    if (pendingTasks.length >= 10) {
      toast.warn("Maximum 10 tasks per proposal.");
      return;
    }
    setPendingTasks((prev) => [...prev, { text }]);
    setNewTaskText("");
  };

  const handleRemoveFromList = (index) => {
    setPendingTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddToList();
    }
  };

  const handleSubmitProposals = async () => {
    if (pendingTasks.length === 0) return;
    setSubmitting(true);

    const result = await TaskSheetService.clientProposeTasks(
      sheet.id,
      pendingTasks
    );

    if (result.success) {
      toast.success(`${pendingTasks.length} task(s) proposed! Waiting for caregiver to review.`);
      setPendingTasks([]);
      setShowForm(false);
      onSheetUpdated(result.data);
    } else {
      toast.error(result.error || "Failed to propose tasks.");
    }
    setSubmitting(false);
  };

  const handleCancel = () => {
    setPendingTasks([]);
    setNewTaskText("");
    setShowForm(false);
  };

  return (
    <div className="tp-visit-propose-section">
      {!showForm ? (
        <button
          className="tp-visit-propose-toggle"
          onClick={() => setShowForm(true)}
        >
          + Propose New Tasks
        </button>
      ) : (
        <div className="tp-visit-propose-form">
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>
            Propose Tasks for This Visit
          </h4>
          <p style={{ fontSize: "12px", color: "#666", margin: "0 0 8px" }}>
            Your caregiver will need to accept these before they become part of the task list.
          </p>

          {/* Tasks queued for submission */}
          {pendingTasks.length > 0 && (
            <div className="tp-visit-propose-pending-list">
              {pendingTasks.map((task, index) => (
                <div key={index} className="tp-visit-propose-pending-item">
                  <span>{task.text}</span>
                  <button
                    className="tp-form-remove-btn"
                    onClick={() => handleRemoveFromList(index)}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input for new task */}
          <div className="tp-visit-propose-input-row">
            <input
              type="text"
              className="tp-visit-propose-input"
              placeholder="Describe the task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
            />
            <button
              className="tp-visit-propose-add-btn"
              onClick={handleAddToList}
              disabled={!newTaskText.trim()}
              type="button"
            >
              +
            </button>
          </div>

          {/* Submit / Cancel */}
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              className="tp-visit-propose-submit-btn"
              onClick={handleSubmitProposals}
              disabled={submitting || pendingTasks.length === 0}
            >
              {submitting
                ? "Sending..."
                : `Send ${pendingTasks.length} Task(s) to Caregiver`}
            </button>
            <button
              className="tp-visit-propose-cancel-btn"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProposeTasksSection;

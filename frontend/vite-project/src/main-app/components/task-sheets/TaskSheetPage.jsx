import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import TaskSheetService from "../../services/taskSheetService";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import "./TaskSheets.css";

/**
 * TaskSheetPage — renders the checklist for a single visit sheet.
 *
 * Props:
 *  - sheet: the TaskSheet object
 *  - onSheetUpdated: callback(updatedSheet) after a save/submit
 */
const TaskSheetPage = ({ sheet, onSheetUpdated, orderCompleted: orderCompletedProp }) => {
  const [tasks, setTasks] = useState(sheet.tasks || []);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(orderCompletedProp || false);
  const isSubmitted = sheet.status === "submitted";
  const isReadOnly = isSubmitted || orderCompleted;
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

  // ------ Submit the sheet ------
  const handleSubmit = async () => {
    if (isReadOnly || submitting) return;

    // flush any pending debounced save
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      // save current state first
      await TaskSheetService.updateSheet(sheet.id, tasks);
    }

    setSubmitting(true);
    const result = await TaskSheetService.submitSheet(sheet.id);
    if (result.success) {
      onSheetUpdated(result.data);
      toast.success(`Visit ${sheet.sheetNumber} submitted!`);
    } else {
      if (result.orderCompleted) setOrderCompleted(true);
      toast.error(result.error || "Failed to submit.");
    }
    setSubmitting(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className={`ts-page ${isReadOnly ? "ts-page--submitted" : ""}`}>
      {orderCompleted && (
        <div className="ts-order-completed-banner">
          This order has been completed. Task sheets can no longer be modified.
        </div>
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

      {/* Submit button */}
      {!isReadOnly && (
        <div className="ts-submit-section">
          <button
            className="ts-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || tasks.length === 0}
          >
            {submitting ? "Submitting..." : `Submit Visit ${sheet.sheetNumber}`}
          </button>
          <p className="ts-submit-hint">
            Once submitted, this sheet becomes read-only.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskSheetPage;

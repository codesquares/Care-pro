import "./TaskSheets.css";

/**
 * TaskItem — a single checkable task row.
 *
 * Props:
 *  - task: { id, text, completed, addedByCaregiver, addedByClient, proposalStatus }
 *  - disabled: boolean (true when sheet is submitted)
 *  - onToggle: callback when checkbox is clicked
 *  - onAccept: callback(taskId) — caregiver accepts a pending proposal
 *  - onReject: callback(taskId) — caregiver rejects a pending proposal
 *  - showProposalActions: boolean — whether to show accept/reject buttons
 */
const TaskItem = ({ task, disabled, onToggle, onAccept, onReject, showProposalActions = false }) => {
  const isPending = task.addedByClient && task.proposalStatus === "Pending";
  const isRejected = task.addedByClient && task.proposalStatus === "Rejected";
  const isClientTask = task.addedByClient;

  // Pending and rejected tasks shouldn't be toggleable
  const canToggle = !disabled && !isPending && !isRejected;

  return (
    <div
      className={`ts-task-item ${task.completed ? "ts-task-item--done" : ""} ${
        disabled ? "ts-task-item--disabled" : ""
      } ${isPending ? "ts-task-item--pending" : ""} ${isRejected ? "ts-task-item--rejected" : ""}`}
      onClick={canToggle ? onToggle : undefined}
      role="checkbox"
      aria-checked={task.completed}
      tabIndex={0}
      onKeyDown={(e) => {
        if (canToggle && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="ts-task-checkbox">
        {isRejected ? "✕" : task.completed ? "☑" : "☐"}
      </span>
      <span className={`ts-task-text ${task.completed ? "ts-task-text--done" : ""} ${isRejected ? "ts-task-text--rejected" : ""}`}>
        {task.text}
      </span>
      {task.addedByCaregiver && (
        <span className="ts-task-custom-badge">custom</span>
      )}
      {isClientTask && (
        <span className="ts-task-client-badge">client</span>
      )}
      {isPending && (
        <span className="ts-task-pending-badge">pending</span>
      )}
      {isRejected && (
        <span className="ts-task-rejected-badge">rejected</span>
      )}
      {/* Accept/Reject buttons for caregiver */}
      {showProposalActions && isPending && (
        <div className="ts-task-proposal-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="ts-task-accept-btn"
            onClick={(e) => { e.stopPropagation(); onAccept?.(task.id); }}
          >
            ✓
          </button>
          <button
            className="ts-task-reject-btn"
            onClick={(e) => { e.stopPropagation(); onReject?.(task.id); }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskItem;

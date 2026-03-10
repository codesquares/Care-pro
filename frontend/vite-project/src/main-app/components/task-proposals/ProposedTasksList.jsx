import { useState } from "react";
import ContractService from "../../services/contractService";
import "./TaskProposals.css";

/**
 * ProposedTasksList — Displays proposed tasks on a contract with status indicators.
 *
 * Props:
 *  - proposedTasks: Array of proposed task objects from ContractDTO
 *  - userRole: "Client" | "Caregiver"
 *  - onRespond: callback({ proposedTaskId, accepted, note }) — only for caregiver during revision
 *  - showActions: boolean — whether to show accept/reject buttons (caregiver revision mode)
 */
const ProposedTasksList = ({ proposedTasks = [], userRole, onRespond, showActions = false }) => {
  const [responseNotes, setResponseNotes] = useState({});

  if (!proposedTasks || proposedTasks.length === 0) return null;

  const { pending, accepted, rejected } = ContractService.getProposedTasksByStatus({ proposedTasks });

  const handleRespond = (taskId, isAccepted) => {
    if (onRespond) {
      onRespond({
        proposedTaskId: taskId,
        accepted: isAccepted,
        note: responseNotes[taskId] || ""
      });
    }
  };

  const renderTask = (task) => {
    const isPending = task.status === "Proposed";
    const isAccepted = task.status === "Accepted";
    const isRejected = task.status === "Rejected";

    return (
      <div
        key={task.id}
        className={`tp-task-item ${isPending ? "tp-task--pending" : ""} ${isAccepted ? "tp-task--accepted" : ""} ${isRejected ? "tp-task--rejected" : ""}`}
      >
        <div className="tp-task-header">
          <span className="tp-task-title">{task.title}</span>
          <span className={`tp-status-badge tp-status--${task.status?.toLowerCase()}`}>
            {isPending ? "⏳ Pending" : isAccepted ? "✅ Accepted" : "❌ Rejected"}
          </span>
        </div>

        {task.description && (
          <p className="tp-task-description">{task.description}</p>
        )}

        <div className="tp-task-meta">
          {task.category && <span className="tp-task-category">{task.category}</span>}
          {task.priority && <span className={`tp-task-priority tp-priority--${task.priority?.toLowerCase()}`}>{task.priority}</span>}
          <span className="tp-task-proposer">
            Proposed by {task.proposedByRole === "Client" ? "Client" : "Caregiver"}
          </span>
          {task.proposedAt && (
            <span className="tp-task-date">
              {new Date(task.proposedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.responseNote && (
          <div className="tp-task-response-note">
            <strong>Response:</strong> {task.responseNote}
          </div>
        )}

        {/* Accept/Reject actions for caregiver during revision */}
        {showActions && isPending && userRole === "Caregiver" && (
          <div className="tp-task-actions">
            <input
              type="text"
              className="tp-response-note-input"
              placeholder="Add a note (optional)..."
              value={responseNotes[task.id] || ""}
              onChange={(e) =>
                setResponseNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
              }
            />
            <div className="tp-action-buttons">
              <button
                className="tp-accept-btn"
                onClick={() => handleRespond(task.id, true)}
              >
                ✓ Accept
              </button>
              <button
                className="tp-reject-btn"
                onClick={() => handleRespond(task.id, false)}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tp-proposed-tasks-list">
      <h4 className="tp-section-title">📋 Proposed Tasks</h4>

      {pending.length > 0 && (
        <div className="tp-group">
          <h5 className="tp-group-title tp-group--pending">
            Pending Review ({pending.length})
          </h5>
          {pending.map(renderTask)}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="tp-group">
          <h5 className="tp-group-title tp-group--accepted">
            Accepted ({accepted.length})
          </h5>
          {accepted.map(renderTask)}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="tp-group">
          <h5 className="tp-group-title tp-group--rejected">
            Rejected ({rejected.length})
          </h5>
          {rejected.map(renderTask)}
        </div>
      )}
    </div>
  );
};

export default ProposedTasksList;

import { useState } from "react";
import ContractService from "../../services/contractService";
import "./TaskProposals.css";

/**
 * TaskProposalForm — Form for adding task proposals.
 *
 * Used in two contexts:
 * 1. Contract negotiation: Client proposes tasks during review request
 * 2. Contract generation/revision: Caregiver adds additional tasks
 *
 * Props:
 *  - onTasksChange: callback(tasks[]) — called whenever the list changes
 *  - tasks: Array of current tasks (controlled)
 *  - showCategoryAndPriority: boolean (true for contract tasks, false for visit tasks)
 *  - label: string — section label
 *  - placeholder: string — input placeholder
 *  - maxTasks: number — max allowed tasks (default 10)
 */
const TaskProposalForm = ({
  onTasksChange,
  tasks = [],
  showCategoryAndPriority = true,
  label = "Propose Tasks",
  placeholder = "Task title...",
  maxTasks = 10,
}) => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "Medium",
  });

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    if (tasks.length >= maxTasks) return;

    const taskToAdd = showCategoryAndPriority
      ? {
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          category: newTask.category,
          priority: newTask.priority,
        }
      : { text: newTask.title.trim() };

    onTasksChange([...tasks, taskToAdd]);
    setNewTask({ title: "", description: "", category: "Other", priority: "Medium" });
  };

  const handleRemove = (index) => {
    onTasksChange(tasks.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="tp-form">
      <h4 className="tp-form-label">{label}</h4>

      {/* Existing tasks list */}
      {tasks.length > 0 && (
        <div className="tp-form-list">
          {tasks.map((task, index) => (
            <div key={index} className="tp-form-item">
              <div className="tp-form-item-content">
                <span className="tp-form-item-title">
                  {task.title || task.text}
                </span>
                {task.description && (
                  <span className="tp-form-item-desc">{task.description}</span>
                )}
                {showCategoryAndPriority && (
                  <span className="tp-form-item-meta">
                    {task.category} · {task.priority}
                  </span>
                )}
              </div>
              <button
                className="tp-form-remove-btn"
                onClick={() => handleRemove(index)}
                type="button"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new task form */}
      {tasks.length < maxTasks && (
        <div className="tp-form-add">
          <div className="tp-form-add-row">
            <input
              type="text"
              className="tp-form-input"
              placeholder={placeholder}
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
          </div>

          {showCategoryAndPriority && (
            <>
              <textarea
                className="tp-form-textarea"
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, description: e.target.value }))
                }
                rows="2"
              />
              <div className="tp-form-selectors">
                <select
                  className="tp-form-select"
                  value={newTask.category}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  {ContractService.TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select
                  className="tp-form-select"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, priority: e.target.value }))
                  }
                >
                  {ContractService.TASK_PRIORITIES.map((pri) => (
                    <option key={pri.value} value={pri.value}>
                      {pri.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            className="tp-form-add-btn"
            onClick={handleAdd}
            disabled={!newTask.title.trim()}
            type="button"
          >
            + Add Task
          </button>
        </div>
      )}

      {tasks.length >= maxTasks && (
        <p className="tp-form-limit">Maximum {maxTasks} tasks reached.</p>
      )}
    </div>
  );
};

export default TaskProposalForm;

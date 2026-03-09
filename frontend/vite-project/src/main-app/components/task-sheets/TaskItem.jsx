import "./TaskSheets.css";

/**
 * TaskItem — a single checkable task row.
 *
 * Props:
 *  - task: { id, text, completed, addedByCaregiver }
 *  - disabled: boolean (true when sheet is submitted)
 *  - onToggle: callback when checkbox is clicked
 */
const TaskItem = ({ task, disabled, onToggle }) => {
  return (
    <div
      className={`ts-task-item ${task.completed ? "ts-task-item--done" : ""} ${
        disabled ? "ts-task-item--disabled" : ""
      }`}
      onClick={!disabled ? onToggle : undefined}
      role="checkbox"
      aria-checked={task.completed}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <span className="ts-task-checkbox">
        {task.completed ? "☑" : "☐"}
      </span>
      <span className={`ts-task-text ${task.completed ? "ts-task-text--done" : ""}`}>
        {task.text}
      </span>
      {task.addedByCaregiver && (
        <span className="ts-task-custom-badge">custom</span>
      )}
    </div>
  );
};

export default TaskItem;

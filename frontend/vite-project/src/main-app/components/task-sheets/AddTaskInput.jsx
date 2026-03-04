import { useState } from "react";
import "./TaskSheets.css";

/**
 * AddTaskInput — inline input for adding a caregiver-created task.
 *
 * Props:
 *  - onAdd: callback(text) when the caregiver confirms a new task
 *  - disabled: boolean
 */
const AddTaskInput = ({ onAdd, disabled }) => {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
    setExpanded(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setText("");
      setExpanded(false);
    }
  };

  if (!expanded) {
    return (
      <button
        className="ts-add-task-btn"
        onClick={() => setExpanded(true)}
        disabled={disabled}
      >
        + Add Task
      </button>
    );
  }

  return (
    <div className="ts-add-task-form">
      <input
        type="text"
        className="ts-add-task-input"
        placeholder="Describe the task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoFocus
        maxLength={200}
      />
      <div className="ts-add-task-actions">
        <button
          className="ts-add-task-confirm"
          onClick={handleAdd}
          disabled={disabled || !text.trim()}
        >
          Add
        </button>
        <button
          className="ts-add-task-cancel"
          onClick={() => {
            setText("");
            setExpanded(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddTaskInput;

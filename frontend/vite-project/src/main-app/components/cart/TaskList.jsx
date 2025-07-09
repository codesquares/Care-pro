import React, { useState } from 'react';
import './TaskList.css';

const TaskList = ({ tasks, onAddTask, onRemoveTask }) => {
  const [newTask, setNewTask] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask('');
      setIsAddingTask(false);
    }
  };

  const handleAddClick = () => {
    setIsAddingTask(true);
  };

  return (
    <div className="task-list">
      <h3 className="task-list__title">Enter Tasks</h3>
      
      <div className="task-list__items">
        {tasks.map((task, index) => (
          <div key={index} className="task-list__item">
            <span className="task-list__item-text">{task}</span>
            <button 
              className="task-list__remove-btn"
              onClick={() => onRemoveTask(index)}
              type="button"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {isAddingTask ? (
        <form onSubmit={handleSubmitTask} className="task-list__add-form">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a new task..."
            className="task-list__add-input"
            autoFocus
          />
          <div className="task-list__add-actions">
            <button type="submit" className="task-list__add-submit">
              Add
            </button>
            <button 
              type="button" 
              onClick={() => setIsAddingTask(false)}
              className="task-list__add-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button 
          className="task-list__add-btn"
          onClick={handleAddClick}
          type="button"
        >
          + Add a new task...
        </button>
      )}
    </div>
  );
};

export default TaskList;
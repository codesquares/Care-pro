import React, { useState } from 'react';
import './TaskList.css';

const TaskList = ({ tasks, onAddTask, onRemoveTask, userTasksCount, validateTasks }) => {
  const [newTask, setNewTask] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Separate explanatory and user tasks
  const explanatoryTasks = tasks.filter(task => task.isExplanatory);
  const userTasks = tasks.filter(task => !task.isExplanatory);

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
      
      {/* Explanatory Tasks Section */}
      {explanatoryTasks.length > 0 && (
        <div className="task-list__section">
          <h4 className="task-list__section-title">Example tasks:</h4>
          <div className="task-list__items task-list__items--explanatory">
            {explanatoryTasks.map((task) => (
              <div key={task.id} className="task-list__item task-list__item--explanatory">
                <span className="task-list__item-text task-list__item-text--explanatory">
                  {task.text}
                </span>
                <span className="task-list__item-label">Example</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Tasks Section */}
      <div className="task-list__section">
        <h4 className="task-list__section-title">
          Your tasks: 
          <span className="task-list__count">
            ({userTasksCount} task{userTasksCount !== 1 ? 's' : ''} added)
          </span>
        </h4>
        
        {userTasks.length > 0 && (
          <div className="task-list__items">
            {userTasks.map((task) => (
              <div key={task.id} className="task-list__item">
                <span className="task-list__item-text">{task.text}</span>
                {task.deletable && (
                  <button 
                    className="task-list__remove-btn"
                    onClick={() => onRemoveTask(task.id)}
                    type="button"
                    title="Remove task"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {userTasksCount === 0 && (
          <div className="task-list__empty-state">
            <p className="task-list__empty-text">
              No tasks added yet. Please add at least one task for your caregiver.
            </p>
          </div>
        )}
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
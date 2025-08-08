import React, { useState, useEffect } from 'react';
import './PackageDetailsInput.scss';

const PackageDetailsInput = ({ 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  placeholder, 
  className 
}) => {
  const [tasks, setTasks] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState('');

  // Convert string to tasks array
  const stringToTasks = (detailsString) => {
    if (!detailsString || detailsString.trim() === '') return [];
    return detailsString.split(';').filter(task => task.trim() !== '').map(task => task.trim());
  };

  // Convert tasks array to string
  const tasksToString = (tasksArray) => {
    return tasksArray.join(';');
  };

  // Initialize tasks from prop value
  useEffect(() => {
    const tasksFromString = stringToTasks(value);
    setTasks(tasksFromString);
  }, [value]);

  // Update word count when input changes
  useEffect(() => {
    const words = currentInput.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [currentInput]);

  // Update parent component with string value
  const updateParent = (newTasks) => {
    const stringValue = tasksToString(newTasks);
    onChange(stringValue);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setCurrentInput(inputValue);
    setError('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  };

  // Add new task
  const addTask = () => {
    const trimmedInput = currentInput.trim();
    
    // Validation
    if (!trimmedInput) {
      setError('Please enter a task description');
      return;
    }

    if (wordCount > 50) {
      setError(`Task cannot exceed 50 words (currently ${wordCount})`);
      return;
    }

    if (tasks.length >= 8) {
      setError('Maximum 8 tasks allowed');
      return;
    }

    // Add task
    const newTasks = [...tasks, trimmedInput];
    setTasks(newTasks);
    updateParent(newTasks);
    setCurrentInput('');
    setError('');
  };

  // Remove task
  const removeTask = (indexToRemove) => {
    const newTasks = tasks.filter((_, index) => index !== indexToRemove);
    setTasks(newTasks);
    updateParent(newTasks);
  };

  // Get word count color
  const getWordCountColor = () => {
    if (wordCount <= 40) return '#28a745'; // Green
    if (wordCount <= 50) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div className={`package-details-input ${className || ''}`}>
      {/* Input field */}
      <div className="input-container">
        <input
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder || "Enter a task and press Enter (e.g., medication assistance)"}
          className="task-input"
        />
        <div className="input-meta">
          <span 
            className="word-count" 
            style={{ color: getWordCountColor() }}
          >
            {wordCount}/50 words
          </span>
          <span className="task-count">
            {tasks.length}/8 tasks
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="input-error">
          {error}
        </div>
      )}

      {/* Tasks list */}
      {tasks.length > 0 && (
        <div className="tasks-list">
          {tasks.map((task, index) => (
            <div key={index} className="task-item">
              <span className="task-text">{task}</span>
              <button
                type="button"
                className="remove-task"
                onClick={() => removeTask(index)}
                aria-label="Remove task"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="help-text">
        Press Enter to add each task. Example: "medication assistance", "vital checks", "hospital visit coordination"
      </div>

      {/* Minimum tasks validation */}
      {tasks.length === 0 && (
        <div className="min-tasks-warning">
          At least 1 task is required
        </div>
      )}
    </div>
  );
};

export default PackageDetailsInput;

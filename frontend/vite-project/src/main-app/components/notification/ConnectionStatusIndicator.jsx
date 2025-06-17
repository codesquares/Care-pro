import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import './connection-status-indicator.css';

const ConnectionStatusIndicator = () => {
  const { connectionError } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show the indicator if there's a connection error
  useEffect(() => {
    if (connectionError) {
      setIsVisible(true);
    } else {
      // Hide after a delay when error is resolved
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) return null;

  return (
    <div className={`connection-status-indicator ${connectionError ? 'error' : 'ok'} ${isExpanded ? 'expanded' : ''}`}>
      <div className="indicator-header" onClick={toggleExpanded}>
        <div className="status-icon">
          {connectionError ? '⚠️' : '✅'}
        </div>
        <div className="status-message">
          {connectionError ? 'Connection Issue' : 'Connected'}
        </div>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="indicator-details">
          <p>{connectionError || 'Connection is working normally.'}</p>
          {connectionError && (
            <div className="troubleshooting">
              <h4>Troubleshooting Steps:</h4>
              <ol>
                <li>Check if your backend API is running</li>
                <li>Verify your network connection</li>
                <li>Ensure your authentication token is valid</li>
                <li>Check CORS configuration on the backend</li>
                <li>Try refreshing the page</li>
              </ol>
              <p className="note">Note: Some features may be unavailable until connection is restored.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;

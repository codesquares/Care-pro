import React, { useState, useEffect } from 'react';
import { useMessageContext } from '../../context/MessageContext';
import chatService from '../../services/signalRChatService';
import { performanceMetrics } from '../../utils/performanceMetrics';
import './chat-metrics.scss';

/**
 * ChatMetrics Component
 * 
 * A debugging component that shows connection metrics and performance data
 * for the messaging system. Only rendered in development mode or when enabled.
 */
const ChatMetrics = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [connectionInfo, setConnectionInfo] = useState({});
  const { connectionState } = useMessageContext();

  // Update metrics periodically
  useEffect(() => {
    if (!isExpanded) return;

    const intervalId = setInterval(() => {
      // Get API metrics
      const apiMetrics = performanceMetrics.getMetrics('api-call') || [];
      
      // Get connection info
      const connInfo = {
        state: chatService.getConnectionState(),
        id: chatService.connectionId,
        transport: chatService.connection?.transport?.name || 'none',
        messageCache: chatService._messageCache ? [...chatService._messageCache.keys()].length : 0,
        statusCache: chatService._statusCache ? [...chatService._statusCache.keys()].length : 0
      };
      
      setMetrics({
        api: apiMetrics,
        averageApiTime: performanceMetrics.getAverage('api-call'),
        messageApiTime: performanceMetrics.getAverage('api-call', 'GET /api/chat/history')
      });
      
      setConnectionInfo(connInfo);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isExpanded]);

  // Don't render in production unless forced
  if (process.env.NODE_ENV === 'production' && !sessionStorage.getItem('showChatMetrics')) {
    return null;
  }

  return (
    <div className={`chat-metrics ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="chat-metrics-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className={`connection-indicator ${connectionState.toLowerCase()}`} />
        <span>Chat Metrics ({connectionState})</span>
        <button className="toggle-button">{isExpanded ? '▼' : '▲'}</button>
      </div>
      
      {isExpanded && (
        <div className="chat-metrics-content">
          <div className="metrics-section">
            <h3>Connection</h3>
            <div className="metrics-table">
              <div className="metrics-row">
                <span>State</span>
                <span>{connectionInfo.state}</span>
              </div>
              <div className="metrics-row">
                <span>ID</span>
                <span>{connectionInfo.id || 'none'}</span>
              </div>
              <div className="metrics-row">
                <span>Transport</span>
                <span>{connectionInfo.transport}</span>
              </div>
              <div className="metrics-row">
                <span>Cache Size</span>
                <span>Messages: {connectionInfo.messageCache}, Status: {connectionInfo.statusCache}</span>
              </div>
            </div>
          </div>
          
          <div className="metrics-section">
            <h3>API Performance</h3>
            <div className="metrics-stats">
              <div className="stat-box">
                <div className="stat-value">{metrics.averageApiTime ? Math.round(metrics.averageApiTime) : 0}ms</div>
                <div className="stat-label">Average API Time</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{metrics.messageApiTime ? Math.round(metrics.messageApiTime) : 0}ms</div>
                <div className="stat-label">Message API Time</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{metrics.api ? metrics.api.filter(m => !m.success).length : 0}</div>
                <div className="stat-label">Failed Calls</div>
              </div>
            </div>
          </div>
          
          <div className="metrics-section">
            <h3>Recent API Calls</h3>
            <div className="metrics-list">
              {metrics.api && metrics.api.slice(-5).reverse().map((m, i) => (
                <div key={i} className={`metrics-list-item ${m.success ? 'success' : 'error'}`}>
                  <span className="metrics-time">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  <span className="metrics-name">{m.name}</span>
                  <span className="metrics-duration">{Math.round(m.duration)}ms</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="metrics-actions">
            <button onClick={() => chatService.connect()} className="action-button">
              Reconnect
            </button>
            <button onClick={() => performanceMetrics.metrics = {}} className="action-button">
              Clear Metrics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMetrics;

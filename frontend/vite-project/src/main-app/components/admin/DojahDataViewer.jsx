import React, { useState } from 'react';
import { getAllWebhookData, getWebhookStatistics } from '../../services/dojahService';

const DojahDataViewer = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('statistics'); // 'statistics' or 'data'

  const token = localStorage.getItem('authToken');

  const loadData = async (type) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (type === 'statistics') {
        response = await getWebhookStatistics(token);
        setData({ type: 'statistics', ...response });
      } else {
        response = await getAllWebhookData(token);
        setData({ type: 'data', ...response });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    loadData(newView);
  };

  React.useEffect(() => {
    loadData('statistics');
  }, []);

  return (
    <div className="dojah-data-viewer">
      <div className="viewer-header">
        <h3>Dojah Webhook Data</h3>
        <div className="view-tabs">
          <button 
            className={view === 'statistics' ? 'active' : ''} 
            onClick={() => handleViewChange('statistics')}
          >
            Statistics
          </button>
          <button 
            className={view === 'data' ? 'active' : ''} 
            onClick={() => handleViewChange('data')}
          >
            Raw Data
          </button>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn">×</button>
        )}
      </div>

      <div className="viewer-content">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">Error: {error}</div>}

        {data && !loading && (
          <div className="data-display">
            {view === 'statistics' && data.statistics && (
              <div className="statistics-view">
                <div className="stats-grid">
                  {Object.entries(data.statistics).map(([key, value]) => (
                    <div key={key} className="stat-item">
                      <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</label>
                      <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'data' && data.data && (
              <div className="raw-data-view">
                <div className="data-summary">
                  <p>Total Records: {data.data.length}</p>
                  <p>Retrieved At: {new Date(data.metadata?.retrievedAt).toLocaleString()}</p>
                </div>
                <div className="data-list">
                  {data.data.map((item, index) => (
                    <div key={index} className="data-item">
                      <div className="item-header">
                        <strong>User: {item.userId}</strong>
                        <span className="timestamp">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="item-details">
                        <p>Expires in: {item.expiresIn} hours</p>
                        <p>Status: {item.webhookData.data?.status || 'Unknown'}</p>
                        <details>
                          <summary>View Raw Data</summary>
                          <pre className="json-data">
                            {JSON.stringify(item.webhookData, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .dojah-data-viewer {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 800px;
          margin: 20px auto;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .view-tabs {
          display: flex;
          gap: 10px;
        }

        .view-tabs button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .view-tabs button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .viewer-content {
          padding: 20px;
          max-height: 500px;
          overflow-y: auto;
        }

        .loading, .error {
          text-align: center;
          padding: 20px;
        }

        .error {
          color: #dc3545;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .stat-item label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }

        .stat-item span {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .data-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .data-item {
          border: 1px solid #eee;
          border-radius: 6px;
          margin-bottom: 15px;
          overflow: hidden;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
        }

        .timestamp {
          color: #666;
          font-size: 14px;
        }

        .item-details {
          padding: 15px;
        }

        .json-data {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
          margin-top: 10px;
        }

        details {
          margin-top: 10px;
        }

        summary {
          cursor: pointer;
          color: #007bff;
        }
      `}</style>
    </div>
  );
};

export default DojahDataViewer;

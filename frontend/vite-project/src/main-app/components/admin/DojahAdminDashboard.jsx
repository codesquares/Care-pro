import React, { useState, useEffect } from 'react';
import { getAllWebhookData, getWebhookStatistics } from '../../services/dojahService';

const DojahAdminDashboard = () => {
  const [webhookData, setWebhookData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [allDataResponse, statsResponse] = await Promise.all([
        getAllWebhookData(token),
        getWebhookStatistics(token)
      ]);

      setWebhookData(allDataResponse.data || []);
      setStatistics(statsResponse.statistics);
    } catch (err) {
      setError(err.message);
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatVerificationData = (webhook) => {
    const { data } = webhook.webhookData;
    return {
      status: data?.status || 'Unknown',
      firstName: data?.first_name || 'N/A',
      lastName: data?.last_name || 'N/A',
      verificationType: data?.id_type || data?.verification_method || 'N/A',
      verificationNumber: data?.id_number || data?.bvn || data?.nin || 'N/A'
    };
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="loading-spinner">Loading webhook data...</div>
      </div>
    );
  }

  return (
    <div className="dojah-admin-dashboard">
      <div className="dashboard-header">
        <h2>Dojah Verification Admin Dashboard</h2>
        <button onClick={loadData} className="refresh-btn">
          <i className="fas fa-refresh"></i> Refresh Data
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card">
            <h3>Total Records</h3>
            <div className="stat-value">{statistics.totalRecords}</div>
          </div>
          <div className="stat-card">
            <h3>Active Records</h3>
            <div className="stat-value">{statistics.activeRecords}</div>
          </div>
          <div className="stat-card">
            <h3>Successful Verifications</h3>
            <div className="stat-value success">{statistics.successfulVerifications}</div>
          </div>
          <div className="stat-card">
            <h3>Failed Verifications</h3>
            <div className="stat-value error">{statistics.failedVerifications}</div>
          </div>
          <div className="stat-card">
            <h3>Success Rate</h3>
            <div className="stat-value">{statistics.successRate}%</div>
          </div>
          <div className="stat-card">
            <h3>Recent (24h)</h3>
            <div className="stat-value">{statistics.recentVerifications}</div>
          </div>
        </div>
      )}

      {/* Webhook Data Table */}
      <div className="webhook-data-section">
        <h3>Webhook Data ({webhookData.length} records)</h3>
        
        {webhookData.length === 0 ? (
          <div className="no-data">
            <p>No webhook data found.</p>
          </div>
        ) : (
          <div className="webhook-table-container">
            <table className="webhook-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Verification Type</th>
                  <th>Expires In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhookData.map((webhook, index) => {
                  const verificationData = formatVerificationData(webhook);
                  return (
                    <tr key={`${webhook.userId}-${index}`}>
                      <td className="user-id">{webhook.userId}</td>
                      <td>{formatTimestamp(webhook.timestamp)}</td>
                      <td>
                        <span className={`status-badge ${verificationData.status.toLowerCase()}`}>
                          {verificationData.status}
                        </span>
                      </td>
                      <td>{`${verificationData.firstName} ${verificationData.lastName}`}</td>
                      <td>{verificationData.verificationType}</td>
                      <td>{webhook.expiresIn}h</td>
                      <td>
                        <button 
                          onClick={() => setSelectedWebhook(webhook)}
                          className="view-btn"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <div className="webhook-modal-overlay" onClick={() => setSelectedWebhook(null)}>
          <div className="webhook-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Webhook Details - User: {selectedWebhook.userId}</h3>
              <button onClick={() => setSelectedWebhook(null)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="webhook-details">
                <h4>Webhook Information</h4>
                <p><strong>Timestamp:</strong> {formatTimestamp(selectedWebhook.timestamp)}</p>
                <p><strong>Expires At:</strong> {formatTimestamp(selectedWebhook.expiresAt)}</p>
                <p><strong>Retrieved:</strong> {selectedWebhook.retrieved ? 'Yes' : 'No'}</p>
              </div>
              <div className="raw-data">
                <h4>Raw Webhook Data</h4>
                <pre className="json-display">
                  {JSON.stringify(selectedWebhook.webhookData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dojah-admin-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
        }

        .statistics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .stat-value.success { color: #28a745; }
        .stat-value.error { color: #dc3545; }

        .webhook-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .webhook-table {
          width: 100%;
          border-collapse: collapse;
        }

        .webhook-table th,
        .webhook-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .webhook-table th {
          background: #f8f9fa;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.failed,
        .status-badge.error {
          background: #f8d7da;
          color: #721c24;
        }

        .view-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }

        .webhook-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .webhook-modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
        }

        .modal-content {
          padding: 20px;
        }

        .json-display {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          font-size: 12px;
          line-height: 1.4;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .loading-spinner {
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default DojahAdminDashboard;

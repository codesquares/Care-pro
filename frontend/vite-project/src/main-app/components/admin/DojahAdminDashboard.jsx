import React, { useState, useEffect } from 'react';
import { getAllWebhookData, getWebhookStatistics } from '../../services/dojahService';
import styles from './DojahAdminDashboard.module.css';

const DojahAdminDashboard = () => {
  const [webhookData, setWebhookData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);

  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('userDetails') || '{}');
  console.log('Current User:', user);

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
    const webhookData = webhook.webhookData;
    
    // Handle Dojah's actual webhook format
    const governmentData = webhookData.data?.government_data?.data;
    const userData = webhookData.data?.user_data?.data;
    const idData = webhookData.data?.id?.data?.id_data;
    
    // Extract name from BVN data if available
    let firstName = '';
    let lastName = '';
    let verificationNumber = '';
    let verificationType = '';
    
    if (governmentData?.bvn?.entity) {
      const bvnEntity = governmentData.bvn.entity;
      firstName = bvnEntity.first_name?.trim() || '';
      lastName = bvnEntity.last_name?.trim() || '';
      verificationNumber = bvnEntity.bvn || '';
      verificationType = 'BVN';
    }
    
    // Fallback to user data
    if (!firstName && userData) {
      firstName = userData.first_name || '';
      lastName = userData.last_name || '';
    }
    
    // Fallback to ID data
    if (!firstName && idData) {
      firstName = idData.first_name || '';
      lastName = idData.last_name?.replace(',', '') || '';
    }
    
    // Get verification type and number from main webhook data
    if (!verificationType) {
      verificationType = webhookData.id_type || webhookData.verification_type || 'Unknown';
    }
    
    if (!verificationNumber) {
      verificationNumber = webhookData.value || webhookData.verification_value || 'N/A';
    }
    
    return {
      status: webhookData.status === true ? 'success' : (webhookData.status === false ? 'failed' : 'unknown'),
      firstName: firstName || 'N/A',
      lastName: lastName || 'N/A',
      verificationType: verificationType,
      verificationNumber: verificationNumber
    };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return '';
    }
  };

  console.log("admin dashboard=====>", webhookData);
  if (loading) {
    return (
      <div className={styles.dojahAdminDashboard}>
        <div className={styles.loadingSpinner}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dojahAdminDashboard}>
      <div className={styles.dashboardHeader}>
        <h2>Dojah Verification Dashboard</h2>
        <button onClick={loadData} className={styles.refreshBtn}>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          Error: {error}
        </div>
      )}

      {statistics && (
        <div className={styles.statisticsGrid}>
          <div className={styles.statCard}>
            <h3>Total Records</h3>
            <div className={styles.statValue}>{statistics.totalRecords}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Active Records</h3>
            <div className={styles.statValue}>{statistics.activeRecords}</div>
          </div>
          <div className={styles.statCard}>
            <h3>Successful Verifications</h3>
            <div className={`${styles.statValue} ${styles.success}`}>
              {statistics.successfulVerifications}
            </div>
          </div>
          <div className={styles.statCard}>
            <h3>Failed Verifications</h3>
            <div className={`${styles.statValue} ${styles.error}`}>
              {statistics.failedVerifications}
            </div>
          </div>
          <div className={styles.statCard}>
            <h3>Success Rate</h3>
            <div className={styles.statValue}>{statistics.successRate}%</div>
          </div>
          <div className={styles.statCard}>
            <h3>Recent (24h)</h3>
            <div className={styles.statValue}>{statistics.recentVerifications}</div>
          </div>
        </div>
      )}

      {webhookData.length > 0 ? (
        <div className={styles.webhookTableContainer}>
          <table className={styles.webhookTable}>
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
                  <tr key={index}>
                    <td>{webhook.userId}</td>
                    <td>{formatTimestamp(webhook.timestamp)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[getStatusColor(verificationData.status)]}`}>
                        {verificationData.status}
                      </span>
                    </td>
                    <td>{verificationData.firstName} {verificationData.lastName}</td>
                    <td>{verificationData.verificationType}</td>
                    <td>{webhook.expiresIn} hours</td>
                    <td>
                      <button 
                        onClick={() => setSelectedWebhook(webhook)}
                        className={styles.viewBtn}
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
      ) : (
        !loading && (
          <div className={styles.noData}>
            No webhook data available
          </div>
        )
      )}

      {selectedWebhook && (
        <div className={styles.webhookModalOverlay} onClick={() => setSelectedWebhook(null)}>
          <div className={styles.webhookModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Webhook Details - {selectedWebhook.userId}</h3>
              <button 
                onClick={() => setSelectedWebhook(null)} 
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div style={{ marginBottom: '20px' }}>
                <h4>Verification Information</h4>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                  {(() => {
                    const verificationData = formatVerificationData(selectedWebhook);
                    return (
                      <div>
                        <p><strong>Status:</strong> {verificationData.status}</p>
                        <p><strong>Name:</strong> {verificationData.firstName} {verificationData.lastName}</p>
                        <p><strong>Verification Type:</strong> {verificationData.verificationType}</p>
                        <p><strong>Verification Number:</strong> {verificationData.verificationNumber}</p>
                        <p><strong>Timestamp:</strong> {formatTimestamp(selectedWebhook.timestamp)}</p>
                        <p><strong>Expires In:</strong> {selectedWebhook.expiresIn} hours</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                <h4>Raw Webhook Data</h4>
                <pre className={styles.jsonDisplay}>
                  {JSON.stringify(selectedWebhook.webhookData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DojahAdminDashboard;

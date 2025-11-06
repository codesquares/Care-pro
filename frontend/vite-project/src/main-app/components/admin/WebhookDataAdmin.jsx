import { useState, useEffect } from 'react';
import { getAllVerificationData, getVerificationStatistics, testAllDojahEndpoints, checkWebhookStatus, getDojahStatus } from '../../services/dojahService';
import './WebhookDataAdmin.scss';
import config from '../../config';

const WebhookDataAdmin = () => {
  const [webhookData, setWebhookData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [endpointTests, setEndpointTests] = useState(null);
  const [testUserId, setTestUserId] = useState('6903b65d1c50be786447bf11'); // Default test user ID
  
  // Filter states
  const [filters, setFilters] = useState({
    term: '',
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('userDetails') || '{}');

  // Debug token
  console.log('Admin Token Info:', { 
    hasToken: !!token, 
    tokenLength: token?.length,
    tokenStart: token?.substring(0, 20),
    tokenEnd: token?.substring(token?.length - 20),
    userRole: user?.role 
  });

  // Function to test token validity
  const testTokenValidity = async () => {
    if (!token) {
      console.log('No token available');
      return false;
    }
    
    try {
      // Test with a simpler endpoint first - FIXED: Use centralized config instead of hardcoded URL
      const response = await fetch(`${config.BASE_URL}/api/Dojah/admin/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Token test response status:', response.status);
      return response.ok;
    } catch (error) {
      console.log('Token test error:', error);
      return false;
    }
  };

  useEffect(() => {
    loadData();
    // Test token validity when component loads
    testTokenValidity().then(isValid => {
      console.log('Token is valid:', isValid);
    });
  }, []);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    setEndpointTests(null);
    
    try {
      // Test all Dojah endpoints
      console.log('Testing all .NET backend Dojah endpoints...');
      const testResults = await testAllDojahEndpoints(token, testUserId, 'Caregiver');
      
      setEndpointTests(testResults);
      
      // Set overall connection status based on webhook test
      if (testResults.webhook.success) {
        setConnectionStatus({ 
          success: true, 
          message: 'Successfully connected to .NET backend Dojah endpoints',
          statusCode: 200
        });
      } else {
        setConnectionStatus({ 
          success: false, 
          message: `Connection failed: ${testResults.webhook.message}`,
          statusCode: null
        });
      }
      
    } catch (error) {
      setConnectionStatus({ 
        success: false, 
        message: `Connection error: ${error.message}`,
        statusCode: null
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading webhook data from .NET backend...', filters);
      
      // Load both statistics and all webhook data with filters
      const [allDataResponse, statsResponse] = await Promise.all([
        getAllVerificationData(token, filters),
        getVerificationStatistics(token)
      ]);

      console.log('Statistics Response:', statsResponse);
      console.log('All Data Response:', allDataResponse);

      // Handle the response structure from .NET backend
      setWebhookData(allDataResponse.data || allDataResponse || []);
      setStatistics(statsResponse.statistics || statsResponse);
      
    } catch (err) {
      setError(err.message);
      console.error('Error loading webhook data from .NET backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    loadData();
  };

  const clearFilters = () => {
    setFilters({
      term: '',
      start: '',
      end: ''
    });
    // Reload data without filters
    setTimeout(() => loadData(), 100);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp.toString();
    }
  };

  const formatVerificationData = (webhook) => {
    // Handle different possible structures from .NET backend
    const data = webhook.webhookData || webhook.data || webhook;
    
    // Extract verification information
    let status = 'Unknown';
    let firstName = 'N/A';
    let lastName = 'N/A';
    let verificationType = 'N/A';
    let verificationNumber = 'N/A';

    // Handle .NET backend response structure
    if (data) {
      status = data.status || data.verificationStatus || 'Unknown';
      firstName = data.firstName || data.first_name || 'N/A';
      lastName = data.lastName || data.last_name || 'N/A';
      verificationType = data.verificationType || data.verification_type || data.id_type || 'N/A';
      verificationNumber = data.verificationNumber || data.verification_number || data.id_number || data.bvn || data.nin || 'N/A';
    }

    return {
      status,
      firstName,
      lastName,
      verificationType,
      verificationNumber
    };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'verified':
        return 'success';
      case 'failed':
      case 'error':
      case 'rejected':
        return 'error';
      case 'pending':
      case 'ongoing':
        return 'warning';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="webhook-admin-dashboard">
        <div className="loading-spinner">
          Loading webhook data from .NET backend...
        </div>
      </div>
    );
  }

  return (
    <div className="webhook-admin-dashboard">
      <div className="dashboard-header">
        <h2>Webhook Data Administration</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="filter-btn"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button 
            onClick={testConnection} 
            className="test-btn"
            disabled={isTestingConnection}
          >
            {isTestingConnection ? 'Testing...' : 'Test All Endpoints'}
          </button>
          <button onClick={loadData} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="filters-section">
          <h4>Filter Webhook Data</h4>
          <div className="filter-controls">
            <div className="filter-row">
              <label>Search Term:</label>
              <input
                type="text"
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                placeholder="Search by user ID, name, or verification number..."
                className="filter-input"
              />
            </div>
            <div className="filter-row">
              <label>Start Date:</label>
              <input
                type="date"
                value={filters.start}
                onChange={(e) => handleFilterChange('start', e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-row">
              <label>End Date:</label>
              <input
                type="date"
                value={filters.end}
                onChange={(e) => handleFilterChange('end', e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="filter-actions">
              <button onClick={applyFilters} className="apply-btn">
                Apply Filters
              </button>
              <button onClick={clearFilters} className="clear-btn">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`connection-status ${connectionStatus.success ? 'success' : 'error'}`}>
          <strong>Connection Status:</strong> {connectionStatus.message}
          {connectionStatus.statusCode && <span> (Status: {connectionStatus.statusCode})</span>}
        </div>
      )}

      {/* API Endpoint Information */}
      <div className="api-info">
        <h4>Available Backend Endpoints</h4>
        <code>GET {config.BASE_URL}/Dojah/webhook</code>
        <code>GET {config.BASE_URL}/Dojah/admin/statistics</code>
        <code>GET {config.BASE_URL}/Dojah/admin/all-data</code>
        <code>GET {config.BASE_URL}/Dojah/admin/all-data?term=search&start=2024-01-01&end=2024-12-31</code>
        <code>GET {config.BASE_URL}/Dojah/status?userId=&userType=&token=</code>
      </div>

      {/* Endpoint Test Results */}
      {endpointTests && (
        <div className="endpoint-tests">
          <h4>Endpoint Test Results</h4>
          <div className="test-grid">
            <div className={`test-card ${endpointTests.webhook.success ? 'success' : 'error'}`}>
              <h5>Webhook Status</h5>
              <div className="test-status">{endpointTests.webhook.success ? '✅ Pass' : '❌ Fail'}</div>
              <p>{endpointTests.webhook.message}</p>
              {endpointTests.webhook.data && (
                <small>Response: {JSON.stringify(endpointTests.webhook.data)}</small>
              )}
            </div>

            <div className={`test-card ${endpointTests.statistics.success ? 'success' : 'error'}`}>
              <h5>Statistics API</h5>
              <div className="test-status">{endpointTests.statistics.success ? '✅ Pass' : '❌ Fail'}</div>
              <p>{endpointTests.statistics.message}</p>
            </div>

            <div className={`test-card ${endpointTests.allData.success ? 'success' : 'error'}`}>
              <h5>All Data API</h5>
              <div className="test-status">{endpointTests.allData.success ? '✅ Pass' : '❌ Fail'}</div>
              <p>{endpointTests.allData.message}</p>
            </div>

            <div className={`test-card ${endpointTests.status.success ? 'success' : 'error'}`}>
              <h5>Status Check API</h5>
              <div className="test-status">{endpointTests.status.success ? '✅ Pass' : '❌ Fail'}</div>
              <p>{endpointTests.status.message}</p>
              <div style={{ marginTop: '10px' }}>
                <label>Test User ID: </label>
                <input 
                  type="text" 
                  value={testUserId} 
                  onChange={(e) => setTestUserId(e.target.value)}
                  style={{ 
                    padding: '4px 8px', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    width: '200px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <br />
          <small>Make sure your .NET backend is running on the correct port and the endpoints are accessible.</small>
        </div>
      )}

      {/* Statistics Section */}
      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card">
            <h3>Total Records</h3>
            <div className="stat-value">{statistics.totalRecords || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Records</h3>
            <div className="stat-value">{statistics.activeRecords || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Successful Verifications</h3>
            <div className="stat-value success">
              {statistics.successfulVerifications || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Failed Verifications</h3>
            <div className="stat-value error">
              {statistics.failedVerifications || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>Success Rate</h3>
            <div className="stat-value">{statistics.successRate || 0}%</div>
          </div>
          <div className="stat-card">
            <h3>Recent (24h)</h3>
            <div className="stat-value">{statistics.recentVerifications || 0}</div>
          </div>
        </div>
      )}

      {/* Webhook Data Table */}
      {webhookData && webhookData.length > 0 ? (
        <div className="webhook-table-container">
          <h3>Webhook Data Records ({webhookData.length})</h3>
          <table className="webhook-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Name</th>
                <th>Verification Type</th>
                <th>Verification Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhookData.map((webhook, index) => {
                const verificationData = formatVerificationData(webhook);
                return (
                  <tr key={webhook.id || index}>
                    <td>{webhook.userId || webhook.user_id || 'N/A'}</td>
                    <td>{formatTimestamp(webhook.timestamp || webhook.created_at)}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(verificationData.status)}`}>
                        {verificationData.status}
                      </span>
                    </td>
                    <td>{verificationData.firstName} {verificationData.lastName}</td>
                    <td>{verificationData.verificationType}</td>
                    <td>{verificationData.verificationNumber}</td>
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
      ) : (
        !loading && (
          <div className="no-data">
            <h3>No webhook data available</h3>
            <p>No webhook records were found with the current filters.</p>
            <p>Try adjusting your filters or check that the backend has processed some Dojah verifications.</p>
          </div>
        )
      )}

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <div className="webhook-modal-overlay" onClick={() => setSelectedWebhook(null)}>
          <div className="webhook-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Webhook Details - {selectedWebhook.userId || selectedWebhook.user_id}</h3>
              <button 
                onClick={() => setSelectedWebhook(null)} 
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '20px' }}>
                <h4>Verification Information</h4>
                <div className="verification-info">
                  {(() => {
                    const verificationData = formatVerificationData(selectedWebhook);
                    return (
                      <div>
                        <p><strong>User ID:</strong> {selectedWebhook.userId || selectedWebhook.user_id}</p>
                        <p><strong>Status:</strong> {verificationData.status}</p>
                        <p><strong>Name:</strong> {verificationData.firstName} {verificationData.lastName}</p>
                        <p><strong>Verification Type:</strong> {verificationData.verificationType}</p>
                        <p><strong>Verification Number:</strong> {verificationData.verificationNumber}</p>
                        <p><strong>Timestamp:</strong> {formatTimestamp(selectedWebhook.timestamp || selectedWebhook.created_at)}</p>
                        {selectedWebhook.expiresIn && (
                          <p><strong>Expires In:</strong> {selectedWebhook.expiresIn} hours</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                <h4>Raw Webhook Data</h4>
                <pre className="json-display">
                  {JSON.stringify(selectedWebhook, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      {import.meta.env.MODE === 'development' && (
        <div className="debug-info">
          <h4>Debug Information</h4>
          <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
          <p><strong>User Role:</strong> {user?.role || 'Unknown'}</p>
          <p><strong>API Base URL:</strong> {config.BASE_URL}</p>
          <p><strong>Test User ID:</strong> {testUserId}</p>
          <p><strong>Statistics Loaded:</strong> {statistics ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Individual Endpoint Testing */}
      <div className="individual-tests">
        <h4>Individual Endpoint Tests</h4>
        <div className="test-controls">
          <div className="test-row">
            <label>Test User Status Check:</label>
            <input 
              type="text" 
              placeholder="Enter User ID" 
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="test-input"
            />
            <button 
              onClick={async () => {
                try {
                  const result = await getDojahStatus(testUserId, 'Caregiver', token);
                  alert(`Status Check Result: ${JSON.stringify(result, null, 2)}`);
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="test-btn-small"
              disabled={!testUserId || !token}
            >
              Test Status
            </button>
          </div>
          
          <div className="test-row">
            <label>Test Webhook Connectivity:</label>
            <button 
              onClick={async () => {
                try {
                  const result = await checkWebhookStatus(token);
                  alert(`Webhook Test Result: ${JSON.stringify(result, null, 2)}`);
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="test-btn-small"
              disabled={!token}
            >
              Test Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookDataAdmin;
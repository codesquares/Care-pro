import { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './notification-center.css';

const NotificationCenter = () => {
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState('individual'); // 'individual', 'caregivers', 'clients', 'all'
  const [notificationData, setNotificationData] = useState({
    recipientId: '',
    type: 'SystemAlert',
    title: '',
    content: ''
  });
  const [caregivers, setCaregivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const adminId = userDetails.id;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [caregiversResult, clientsResult] = await Promise.all([
        adminService.getAllCaregivers(),
        adminService.getAllClients()
      ]);

      if (caregiversResult.success) {
        setCaregivers(caregiversResult.data);
      }

      if (clientsResult.success) {
        setClients(clientsResult.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;

      if (sendingTo === 'individual') {
        if (!notificationData.recipientId) {
          setError('Please select a recipient');
          setLoading(false);
          return;
        }

        response = await adminService.sendNotification({
          ...notificationData,
          senderId: adminId
        });
      } else if (sendingTo === 'caregivers') {
        response = await adminService.broadcastNotificationToCaregivers({
          senderId: adminId,
          type: notificationData.type,
          title: notificationData.title,
          content: notificationData.content
        });
      } else if (sendingTo === 'clients') {
        response = await adminService.broadcastNotificationToClients({
          senderId: adminId,
          type: notificationData.type,
          title: notificationData.title,
          content: notificationData.content
        });
      } else if (sendingTo === 'all') {
        response = await adminService.broadcastNotificationToAllUsers({
          senderId: adminId,
          type: notificationData.type,
          title: notificationData.title,
          content: notificationData.content
        });
      }

      if (response.success) {
        setResult({
          success: true,
          message: sendingTo === 'individual'
            ? 'Notification sent successfully!'
            : `Notification sent to ${response.successCount || response.totalSuccessCount} users`,
          details: response
        });

        // Reset form
        setNotificationData({
          recipientId: '',
          type: 'SystemAlert',
          title: '',
          content: ''
        });
      } else {
        setError(response.error || 'Failed to send notification');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = adminService.getNotificationTypes();

  return (
    <div className="notification-center">
      <div className="page-header">
        <h1>Notification Center</h1>
        <p>Send notifications to users in the system</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <div>
            <p><strong>{result.message}</strong></p>
            {result.details && (result.details.successCount !== undefined || result.details.totalSuccessCount !== undefined) && (
              <div className="result-details">
                {result.details.totalSuccessCount !== undefined ? (
                  <>
                    <p>Successfully sent: {result.details.totalSuccessCount}</p>
                    <p>Failed: {result.details.totalFailureCount || 0}</p>
                  </>
                ) : (
                  <>
                    <p>Successfully sent: {result.details.successCount}</p>
                    <p>Failed: {result.details.failureCount || 0}</p>
                    <p>Total: {result.details.total}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setResult(null)}>×</button>
        </div>
      )}

      <div className="notification-form-container">
        <div className="recipient-selector">
          <h3>Select Recipients</h3>
          <div className="recipient-options">
            <label className={sendingTo === 'individual' ? 'active' : ''}>
              <input
                type="radio"
                name="sendingTo"
                value="individual"
                checked={sendingTo === 'individual'}
                onChange={(e) => setSendingTo(e.target.value)}
              />
              <div className="option-card">
                <i className="fas fa-user"></i>
                <span>Individual User</span>
              </div>
            </label>

            <label className={sendingTo === 'caregivers' ? 'active' : ''}>
              <input
                type="radio"
                name="sendingTo"
                value="caregivers"
                checked={sendingTo === 'caregivers'}
                onChange={(e) => setSendingTo(e.target.value)}
              />
              <div className="option-card">
                <i className="fas fa-user-nurse"></i>
                <span>All Caregivers</span>
                <small>{caregivers.length} users</small>
              </div>
            </label>

            <label className={sendingTo === 'clients' ? 'active' : ''}>
              <input
                type="radio"
                name="sendingTo"
                value="clients"
                checked={sendingTo === 'clients'}
                onChange={(e) => setSendingTo(e.target.value)}
              />
              <div className="option-card">
                <i className="fas fa-user-friends"></i>
                <span>All Clients</span>
                <small>{clients.length} users</small>
              </div>
            </label>

            <label className={sendingTo === 'all' ? 'active' : ''}>
              <input
                type="radio"
                name="sendingTo"
                value="all"
                checked={sendingTo === 'all'}
                onChange={(e) => setSendingTo(e.target.value)}
              />
              <div className="option-card">
                <i className="fas fa-users"></i>
                <span>All Users</span>
                <small>{caregivers.length + clients.length} users</small>
              </div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="notification-form">
          {sendingTo === 'individual' && (
            <div className="form-group">
              <label htmlFor="recipientId">Select Recipient *</label>
              <select
                id="recipientId"
                name="recipientId"
                value={notificationData.recipientId}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select a user --</option>
                <optgroup label="Caregivers">
                  {caregivers.map(cg => (
                    <option key={cg.id} value={cg.id}>
                      {cg.firstName} {cg.lastName} - {cg.email}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Clients">
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} - {client.email}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="type">Notification Type *</label>
            <select
              id="type"
              name="type"
              value={notificationData.type}
              onChange={handleInputChange}
              required
            >
              {notificationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title (Optional)</label>
            <input
              type="text"
              id="title"
              name="title"
              value={notificationData.title}
              onChange={handleInputChange}
              placeholder="Enter notification title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Message Content *</label>
            <textarea
              id="content"
              name="content"
              value={notificationData.content}
              onChange={handleInputChange}
              placeholder="Enter your notification message here..."
              rows="6"
              required
            />
            <small className="char-count">
              {notificationData.content.length} characters
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setNotificationData({
                  recipientId: '',
                  type: 'SystemAlert',
                  title: '',
                  content: ''
                });
                setError(null);
                setResult(null);
              }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="notification-info">
        <h3>Available Notification Types</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>SystemAlert</h4>
            <p>System-wide alerts and announcements</p>
          </div>
          <div className="info-card">
            <h4>OrderNotification</h4>
            <p>Notifications related to orders and bookings</p>
          </div>
          <div className="info-card">
            <h4>MessageNotification</h4>
            <p>Chat and message-related notifications</p>
          </div>
          <div className="info-card">
            <h4>WithdrawalRequest</h4>
            <p>Withdrawal and payment notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

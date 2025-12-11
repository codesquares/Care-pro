import React, { useState, useEffect } from 'react';
import adminVerificationService from '../../../services/adminVerificationService';
import './verification-management.css';

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [filteredVerifications, setFilteredVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [webhookDetails, setWebhookDetails] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(null); // 'Approve' or 'Reject'
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get admin user ID from localStorage
  const adminId = JSON.parse(localStorage.getItem('userDetails') || '{}')?.id || 'admin_id';

  useEffect(() => {
    loadVerifications();
  }, []);

  useEffect(() => {
    filterVerifications();
  }, [verifications, searchTerm, statusFilter]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const result = await adminVerificationService.getPendingVerifications();
      if (result.success) {
        setVerifications(result.data || []);
      } else {
        setError(result.error || 'Failed to load verifications');
      }
    } catch (err) {
      console.error('Error loading verifications:', err);
      setError('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const filterVerifications = () => {
    let filtered = [...verifications];

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(v => v.verificationStatus === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.caregiverName?.toLowerCase().includes(term) ||
        v.caregiverEmail?.toLowerCase().includes(term) ||
        v.verificationMethod?.toLowerCase().includes(term)
      );
    }

    setFilteredVerifications(filtered);
  };

  const handleViewVerification = async (verification) => {
    if (!verification.webhookLogId) {
      alert('No webhook data available for this verification');
      return;
    }

    try {
      setActionLoading(true);
      const result = await adminVerificationService.getWebhookDetails(verification.webhookLogId);
      
      if (result.success) {
        setSelectedVerification(verification);
        setWebhookDetails(result.data);
        setShowReviewModal(true);
      } else {
        alert(result.error || 'Failed to load webhook details');
      }
    } catch (err) {
      console.error('Error loading webhook details:', err);
      alert('Failed to load webhook details');
    } finally {
      setActionLoading(false);
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedVerification(null);
    setWebhookDetails(null);
    setAdminNotes('');
    setReviewAction(null);
  };

  const showReview = (action) => {
    setReviewAction(action);
  };

  const handleReviewSubmit = async () => {
    if (!selectedVerification || !reviewAction) return;

    // Require notes for rejection
    if (reviewAction === 'Reject' && !adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminVerificationService.reviewVerification({
        verificationId: selectedVerification.verificationId,
        adminId: adminId,
        decision: reviewAction,
        adminNotes: adminNotes,
        reviewedWebhookLogId: selectedVerification.webhookLogId
      });

      if (result.success) {
        setSuccessMessage(`Verification ${reviewAction.toLowerCase()}d successfully! Caregiver has been notified.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        closeReviewModal();
        loadVerifications(); // Reload to get updated data
      } else {
        alert(result.error || `Failed to ${reviewAction.toLowerCase()} verification`);
      }
    } catch (err) {
      console.error('Error reviewing verification:', err);
      alert('Failed to review verification');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'verified':
        return 'status-verified';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toUpperCase()) {
      case 'NIN':
        return 'fa-id-card';
      case 'BVN':
        return 'fa-university';
      case 'DRIVERS LICENSE':
      case 'DRIVER LICENSE':
        return 'fa-car';
      default:
        return 'fa-id-badge';
    }
  };

  if (loading) {
    return (
      <div className="verification-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-management">
      {/* Header */}
      <div className="verify-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-id-badge"></i>
            Identity Verification Management
          </h1>
          <p>Review and manage caregiver identity verifications</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <i className="fas fa-check-circle"></i>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="verify-controls">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or method..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={loadVerifications} disabled={loading}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="verify-stats">
        <div className="stat-card">
          <div className="stat-icon verified">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Verified</span>
            <span className="stat-value">
              {verifications.filter(v => v.isVerified).length}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Review</span>
            <span className="stat-value">
              {verifications.filter(v => !v.isVerified && v.verificationStatus === 'Pending').length}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Failed</span>
            <span className="stat-value">
              {verifications.filter(v => v.verificationStatus === 'Failed').length}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total</span>
            <span className="stat-value">{verifications.length}</span>
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="verify-table-container">
        <table className="verify-table">
          <thead>
            <tr>
              <th>Caregiver Name</th>
              <th>Email</th>
              <th>Method</th>
              <th>Status</th>
              <th>Verified Date</th>
              <th>Raw Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerifications.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  <i className="fas fa-inbox"></i>
                  <p>No verifications found</p>
                </td>
              </tr>
            ) : (
              filteredVerifications.map((verification) => (
                <tr key={verification.verificationId}>
                  <td className="caregiver-name">
                    <i className="fas fa-user-circle"></i>
                    {verification.caregiverName || 'N/A'}
                  </td>
                  <td>{verification.caregiverEmail || 'N/A'}</td>
                  <td>
                    <span className="method-badge">
                      <i className={`fas ${getMethodIcon(verification.verificationMethod)}`}></i>
                      {verification.verificationMethod || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(verification.verificationStatus)}`}>
                      {verification.isVerified ? 'Verified' : verification.verificationStatus}
                    </span>
                  </td>
                  <td>
                    {verification.verifiedOn 
                      ? new Date(verification.verifiedOn).toLocaleDateString()
                      : 'Not verified'}
                  </td>
                  <td>
                    {verification.hasRawData ? (
                      <span className="badge-has-data">
                        <i className="fas fa-database"></i>
                        Available
                      </span>
                    ) : (
                      <span className="badge-no-data">No Data</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-review"
                      onClick={() => handleViewVerification(verification)}
                      disabled={!verification.hasRawData}
                    >
                      <i className="fas fa-eye"></i>
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedVerification && webhookDetails && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content verify-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-user-check"></i>
                Verification Review
              </h2>
              <button className="close-modal" onClick={closeReviewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="verification-summary">
                <div className="summary-item">
                  <span className="label">Verification ID:</span>
                  <span className="value">{selectedVerification.verificationId}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Method:</span>
                  <span className="value">{selectedVerification.verificationMethod}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(selectedVerification.verificationStatus)}`}>
                    {selectedVerification.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="comparison-grid">
                {/* Left: Registered Profile */}
                <div className="comparison-column">
                  <h3><i className="fas fa-user"></i> Registered Profile</h3>
                  <div className="data-card">
                    <div className="data-row">
                      <span className="data-label">First Name:</span>
                      <span className="data-value">{webhookDetails.registeredProfile?.firstName || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Last Name:</span>
                      <span className="data-value">{webhookDetails.registeredProfile?.lastName || 'N/A'}</span>
                    </div>
                    {webhookDetails.registeredProfile?.middleName && (
                      <div className="data-row">
                        <span className="data-label">Middle Name:</span>
                        <span className="data-value">{webhookDetails.registeredProfile.middleName}</span>
                      </div>
                    )}
                    <div className="data-row">
                      <span className="data-label">Email:</span>
                      <span className="data-value">{webhookDetails.registeredProfile?.email || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Phone:</span>
                      <span className="data-value">{webhookDetails.registeredProfile?.phoneNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Verified Data from Government */}
                <div className="comparison-column">
                  <h3><i className="fas fa-shield-alt"></i> Government Verified Data</h3>
                  <div className="data-card">
                    <div className="data-row">
                      <span className="data-label">First Name:</span>
                      <span className="data-value highlighted">
                        {webhookDetails.parsedData?.verifiedName?.firstName || 'N/A'}
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Last Name:</span>
                      <span className="data-value highlighted">
                        {webhookDetails.parsedData?.verifiedName?.lastName || 'N/A'}
                      </span>
                    </div>
                    {webhookDetails.parsedData?.verifiedName?.middleName && (
                      <div className="data-row">
                        <span className="data-label">Middle Name:</span>
                        <span className="data-value highlighted">
                          {webhookDetails.parsedData.verifiedName.middleName}
                        </span>
                      </div>
                    )}
                    <div className="data-row">
                      <span className="data-label">ID Type:</span>
                      <span className="data-value">{webhookDetails.parsedData?.idType || 'N/A'}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">ID Number:</span>
                      <span className="data-value">{webhookDetails.parsedData?.verificationNo || 'N/A'}</span>
                    </div>
                    {webhookDetails.parsedData?.verifiedDetails?.dateOfBirth && (
                      <div className="data-row">
                        <span className="data-label">Date of Birth:</span>
                        <span className="data-value">
                          {new Date(webhookDetails.parsedData.verifiedDetails.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {webhookDetails.parsedData?.verifiedDetails?.phoneNumber && (
                      <div className="data-row">
                        <span className="data-label">Phone:</span>
                        <span className="data-value">
                          {webhookDetails.parsedData.verifiedDetails.phoneNumber}
                        </span>
                      </div>
                    )}
                    {webhookDetails.parsedData?.verifiedDetails?.gender && (
                      <div className="data-row">
                        <span className="data-label">Gender:</span>
                        <span className="data-value">
                          {webhookDetails.parsedData.verifiedDetails.gender}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Message */}
              {webhookDetails.parsedData?.message && (
                <div className="verification-message">
                  <i className="fas fa-info-circle"></i>
                  <strong>Dojah Verification Message:</strong>
                  <p>{webhookDetails.parsedData.message}</p>
                </div>
              )}

              {/* Admin Decision Section */}
              {!reviewAction ? (
                <div className="action-buttons">
                  <button
                    className="btn-approve"
                    onClick={() => showReview('Approve')}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check"></i>
                    Approve Verification
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => showReview('Reject')}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times"></i>
                    Reject Verification
                  </button>
                </div>
              ) : (
                <div className="review-form">
                  <h4>
                    <i className={`fas fa-${reviewAction === 'Approve' ? 'check-circle' : 'times-circle'}`}></i>
                    {reviewAction} Verification
                  </h4>
                  <p className={reviewAction === 'Reject' ? 'warning-text' : ''}>
                    {reviewAction === 'Approve'
                      ? 'You are about to approve this verification. The caregiver will be marked as verified.'
                      : (
                        <>
                          <i className="fas fa-exclamation-triangle"></i>
                          You must provide a specific reason. The caregiver will receive this in their notification.
                        </>
                      )}
                  </p>

                  <div className="form-group">
                    <label>{reviewAction === 'Approve' ? 'Approval Notes (Optional):' : 'Rejection Reason (Required):'}</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={reviewAction === 'Approve'
                        ? 'Add any notes about this approval...'
                        : 'Provide a clear and specific reason for rejection...'}
                      rows="4"
                      required={reviewAction === 'Reject'}
                    />
                    {adminNotes && (
                      <small className="char-count">
                        {adminNotes.length} characters
                      </small>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-confirm"
                      onClick={handleReviewSubmit}
                      disabled={actionLoading || (reviewAction === 'Reject' && !adminNotes.trim())}
                    >
                      {actionLoading ? 'Processing...' : `Confirm ${reviewAction}`}
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setReviewAction(null)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Raw Data Toggle (for debugging) */}
              <details className="raw-data-section">
                <summary>
                  <i className="fas fa-code"></i>
                  View Raw Webhook Data (Debug)
                </summary>
                <pre className="raw-data-content">
                  {webhookDetails.rawPayload}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;

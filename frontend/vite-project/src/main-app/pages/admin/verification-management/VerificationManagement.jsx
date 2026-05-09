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

  // Admin escape-hatch: status override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('Completed');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExtraConfirm, setOverrideExtraConfirm] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Admin escape-hatch: caregiver name edit modal state
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameForm, setNameForm] = useState({ firstName: '', middleName: '', lastName: '' });
  const [nameReason, setNameReason] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Get admin user ID from localStorage
  const adminId = JSON.parse(localStorage.getItem('userDetails') || '{}')?.id || 'admin_id';

  const ALLOWED_OVERRIDE_STATUSES = ['Completed', 'Verified', 'Success', 'Failed', 'Pending'];

  // Treat Completed/Verified/Success as "verified". Failed/Pending as "not verified".
  // Default override flips to the opposite side; flipping a verified record
  // (e.g. Completed -> Failed) requires an extra confirmation in the UI.
  const isVerifiedStatus = (s) => {
    const v = (s || '').toLowerCase();
    return v === 'completed' || v === 'verified' || v === 'success';
  };
  const defaultOverrideFor = (currentStatus) =>
    isVerifiedStatus(currentStatus) ? 'Failed' : 'Completed';
  const overrideIsRevocation = (currentStatus, nextStatus) =>
    isVerifiedStatus(currentStatus) && !isVerifiedStatus(nextStatus);

  // Resolve the caregiver's ObjectId for the name-edit endpoint. Pending list
  // and webhook details both expose userId; in rare/older records that may be
  // an email instead of an ObjectId — surface a clear error in that case.
  const resolveCaregiverId = () => {
    const candidate =
      selectedVerification?.userId ||
      selectedVerification?.caregiverId ||
      webhookDetails?.userId ||
      webhookDetails?.registeredProfile?.userId;
    return candidate || '';
  };

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

  // -------- Status override (escape-hatch) --------
  const openOverrideModal = () => {
    setOverrideStatus(defaultOverrideFor(selectedVerification?.verificationStatus));
    setOverrideReason(adminNotes || '');
    setOverrideExtraConfirm(false);
    setOverrideError('');
    setShowOverrideModal(true);
  };

  const closeOverrideModal = () => {
    if (overrideLoading) return;
    setShowOverrideModal(false);
    setOverrideError('');
    setOverrideExtraConfirm(false);
  };

  const handleOverrideSubmit = async () => {
    if (!selectedVerification) return;
    setOverrideError('');

    if (!ALLOWED_OVERRIDE_STATUSES.includes(overrideStatus)) {
      setOverrideError('Choose a valid status.');
      return;
    }
    if (!overrideReason || overrideReason.trim().length < 5) {
      setOverrideError('Reason is required (minimum 5 characters).');
      return;
    }
    if (overrideIsRevocation(selectedVerification.verificationStatus, overrideStatus) && !overrideExtraConfirm) {
      setOverrideError('You are revoking a verified record. Tick the extra confirmation to proceed.');
      return;
    }

    setOverrideLoading(true);
    try {
      const result = await adminVerificationService.overrideVerificationStatus({
        verificationId: selectedVerification.verificationId,
        adminId,
        newStatus: overrideStatus,
        reason: overrideReason.trim()
      });
      if (result.success) {
        setSuccessMessage(
          `Verification status overridden: ${result.previousStatus || selectedVerification.verificationStatus} \u2192 ${result.newStatus || overrideStatus}.`
        );
        setTimeout(() => setSuccessMessage(''), 6000);
        setShowOverrideModal(false);
        closeReviewModal();
        loadVerifications();
      } else {
        setOverrideError(result.error || 'Failed to override status');
      }
    } catch (err) {
      console.error('Override status failed:', err);
      setOverrideError('Failed to override status');
    } finally {
      setOverrideLoading(false);
    }
  };

  // -------- Caregiver name edit (escape-hatch) --------
  const openNameModal = () => {
    // Pre-fill from Dojah-returned name so admin only edits if needed.
    const dojahName = webhookDetails?.parsedData?.verifiedName || {};
    const profile = webhookDetails?.registeredProfile || {};
    setNameForm({
      firstName: dojahName.firstName || profile.firstName || '',
      middleName: dojahName.middleName || profile.middleName || '',
      lastName: dojahName.lastName || profile.lastName || ''
    });
    setNameReason('');
    setNameConfirmed(false);
    setNameError('');
    setShowNameModal(true);
  };

  const closeNameModal = () => {
    if (nameLoading) return;
    setShowNameModal(false);
    setNameError('');
    setNameConfirmed(false);
  };

  const handleNameSubmit = async () => {
    if (!selectedVerification) return;
    setNameError('');

    const caregiverId = resolveCaregiverId();
    if (!caregiverId) {
      setNameError('Could not determine the caregiver ID for this verification.');
      return;
    }
    if (!adminVerificationService.isObjectId(caregiverId)) {
      setNameError(
        'This verification record stores the caregiver as an email, not an ObjectId. Resolve the caregiver via the user list and update from there.'
      );
      return;
    }
    if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
      setNameError('First name and last name are required.');
      return;
    }
    if (!nameReason || nameReason.trim().length < 5) {
      setNameError('Reason is required (minimum 5 characters).');
      return;
    }
    if (!nameConfirmed) {
      setNameError('You must tick the confirmation checkbox.');
      return;
    }

    setNameLoading(true);
    try {
      const result = await adminVerificationService.updateCaregiverName({
        caregiverId,
        adminId,
        firstName: nameForm.firstName,
        middleName: nameForm.middleName,
        lastName: nameForm.lastName,
        confirmed: true,
        reason: nameReason.trim()
      });
      if (result.success) {
        setSuccessMessage(
          `Caregiver name updated: ${result.previousFirstName || ''} ${result.previousLastName || ''} \u2192 ${result.newFirstName || ''} ${result.newLastName || ''}.`
        );
        setTimeout(() => setSuccessMessage(''), 6000);
        setShowNameModal(false);
        // Reload pending list so the registered-profile column reflects the new name.
        loadVerifications();
        // Refresh the open webhook details too (registeredProfile is the stale piece).
        if (selectedVerification.webhookLogId) {
          const refreshed = await adminVerificationService.getWebhookDetails(selectedVerification.webhookLogId);
          if (refreshed.success) setWebhookDetails(refreshed.data);
        }
      } else {
        setNameError(result.error || 'Failed to update caregiver name');
      }
    } catch (err) {
      console.error('Name edit failed:', err);
      setNameError('Failed to update caregiver name');
    } finally {
      setNameLoading(false);
    }
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
                  <button
                    className="btn-edit-name"
                    onClick={openNameModal}
                    disabled={actionLoading}
                    title="Correct the caregiver's stored legal name (e.g. Dojah returned middle name in first-name slot)"
                  >
                    <i className="fas fa-id-card"></i>
                    Correct Caregiver Name
                  </button>
                  <button
                    className="btn-override"
                    onClick={openOverrideModal}
                    disabled={actionLoading}
                    title="Override the verification status (escape-hatch; writes to admin audit log)"
                  >
                    <i className="fas fa-bolt"></i>
                    Override Status
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

      {/* Override Status Modal */}
      {showOverrideModal && selectedVerification && (
        <div className="modal-overlay" onClick={closeOverrideModal}>
          <div className="modal-content override-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-bolt"></i>
                Override Verification Status
              </h2>
              <button className="close-modal" onClick={closeOverrideModal} disabled={overrideLoading}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="override-context">
                Current status:{' '}
                <span className={`status-badge ${getStatusBadgeClass(selectedVerification.verificationStatus)}`}>
                  {selectedVerification.verificationStatus}
                </span>
              </p>

              <div className="form-group">
                <label>New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => {
                    setOverrideStatus(e.target.value);
                    setOverrideExtraConfirm(false);
                  }}
                  disabled={overrideLoading}
                >
                  {ALLOWED_OVERRIDE_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reason (required, min 5 characters)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Dojah returned middle name as first name; DOB and last name match document."
                  rows="3"
                  disabled={overrideLoading}
                />
                <small className="char-count">{overrideReason.length} characters</small>
              </div>

              {overrideIsRevocation(selectedVerification.verificationStatus, overrideStatus) && (
                <div className="warning-box">
                  <label className="confirm-checkbox">
                    <input
                      type="checkbox"
                      checked={overrideExtraConfirm}
                      onChange={(e) => setOverrideExtraConfirm(e.target.checked)}
                      disabled={overrideLoading}
                    />
                    <span>
                      <i className="fas fa-exclamation-triangle"></i>{' '}
                      I understand I am revoking a verified record.
                    </span>
                  </label>
                </div>
              )}

              {overrideError && (
                <div className="inline-error">
                  <i className="fas fa-exclamation-circle"></i> {overrideError}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn-confirm"
                  onClick={handleOverrideSubmit}
                  disabled={overrideLoading}
                >
                  {overrideLoading ? 'Processing...' : 'Apply Override'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={closeOverrideModal}
                  disabled={overrideLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Caregiver Name Modal */}
      {showNameModal && selectedVerification && (
        <div className="modal-overlay" onClick={closeNameModal}>
          <div className="modal-content name-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-id-card"></i>
                Correct Caregiver Name
              </h2>
              <button className="close-modal" onClick={closeNameModal} disabled={nameLoading}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="name-context">
                Pre-filled from Dojah-returned data. Edit only if needed, then confirm.
              </p>

              {webhookDetails && (
                <div className="name-comparison">
                  <div>
                    <strong>Currently stored:</strong>{' '}
                    {[
                      webhookDetails.registeredProfile?.firstName,
                      webhookDetails.registeredProfile?.middleName,
                      webhookDetails.registeredProfile?.lastName
                    ].filter(Boolean).join(' ') || 'N/A'}
                  </div>
                  <div>
                    <strong>Returned by Dojah:</strong>{' '}
                    {[
                      webhookDetails.parsedData?.verifiedName?.firstName,
                      webhookDetails.parsedData?.verifiedName?.middleName,
                      webhookDetails.parsedData?.verifiedName?.lastName
                    ].filter(Boolean).join(' ') || 'N/A'}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={nameForm.firstName}
                    onChange={(e) => setNameForm(f => ({ ...f, firstName: e.target.value }))}
                    disabled={nameLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    value={nameForm.middleName}
                    onChange={(e) => setNameForm(f => ({ ...f, middleName: e.target.value }))}
                    disabled={nameLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={nameForm.lastName}
                    onChange={(e) => setNameForm(f => ({ ...f, lastName: e.target.value }))}
                    disabled={nameLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason (required, min 5 characters)</label>
                <textarea
                  value={nameReason}
                  onChange={(e) => setNameReason(e.target.value)}
                  placeholder="e.g. Correcting names per uploaded ID — middle name was in the first-name field."
                  rows="3"
                  disabled={nameLoading}
                />
                <small className="char-count">{nameReason.length} characters</small>
              </div>

              <div className="warning-box">
                <label className="confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={nameConfirmed}
                    onChange={(e) => setNameConfirmed(e.target.checked)}
                    disabled={nameLoading}
                  />
                  <span>I confirm this change. The caregiver's profile and linked AppUser name will be updated.</span>
                </label>
              </div>

              {nameError && (
                <div className="inline-error">
                  <i className="fas fa-exclamation-circle"></i> {nameError}
                </div>
              )}

              <div className="form-actions">
                <button
                  className="btn-confirm"
                  onClick={handleNameSubmit}
                  disabled={nameLoading || !nameConfirmed}
                >
                  {nameLoading ? 'Saving...' : 'Save Name'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={closeNameModal}
                  disabled={nameLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;

import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './certificate-management.css';

const CertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [successMessage, setSuccessMessage] = useState('');
  const [imageZoom, setImageZoom] = useState(false);

  // Get admin user ID from localStorage
  const adminId = JSON.parse(localStorage.getItem('userDetails') || '{}')?.id || 'admin_id';

  useEffect(() => {
    loadCertificates();
  }, []);

  useEffect(() => {
    filterCertificates();
  }, [certificates, searchTerm, statusFilter]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminService.getAllCertificates();
      
      if (result.success) {
        setCertificates(result.data);
        const stats = adminService.getCertificateStatistics(result.data);
        setStatistics(stats);
      } else {
        setError(result.error || 'Failed to load certificates');
      }
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = [...certificates];

    // Filter by status
    if (statusFilter !== 'All') {
      const statusValue = adminService.getVerificationStatuses()[statusFilter];
      filtered = filtered.filter(cert => cert.verificationStatus === statusValue);
    }

    // Search filter
    if (searchTerm) {
      filtered = adminService.filterCertificates(filtered, searchTerm);
    }

    setFilteredCertificates(filtered);
  };

  const handleViewCertificate = async (certificateId) => {
    try {
      console.log('Fetching certificate details for ID:', certificateId);
      const result = await adminService.getCertificateDetails(certificateId);
      console.log('Certificate details result:', result);
      
      if (result.success) {
        const formattedData = adminService.formatCertificateData(result.data);
        console.log('Formatted certificate data:', formattedData);
        console.log('Status value:', formattedData?.statusValue);
        setSelectedCertificate(formattedData);
        setShowCertModal(true);
      } else {
        console.error('Failed to load certificate:', result.error);
        alert(result.error || 'Failed to load certificate details');
      }
    } catch (err) {
      console.error('Error loading certificate:', err);
      alert('Failed to load certificate details: ' + err.message);
    }
  };

  const closeCertModal = () => {
    setShowCertModal(false);
    setSelectedCertificate(null);
    setShowReviewModal(false);
    setAdminNotes('');
    setReviewAction(null);
    setImageZoom(false);
  };

  // New unified review handler
  const handleReviewCertificate = async () => {
    if (!selectedCertificate) return;

    const approved = reviewAction === 'approve';

    // Require notes for rejection
    if (!approved && !adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    console.log('handleReviewCertificate called with:', {
      certificateId: selectedCertificate.id,
      adminId,
      approved,
      adminNotes,
      reviewAction
    });

    setActionLoading(true);
    try {
      const result = await adminService.reviewCertificate(
        selectedCertificate.id,
        adminId,
        approved,
        adminNotes
      );

      console.log('Review result:', result);

      if (result.success) {
        const action = approved ? 'approved' : 'rejected';
        setSuccessMessage(`Certificate ${action} successfully! Caregiver has been notified.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        closeCertModal();
        loadCertificates(); // Reload to get updated data
      } else {
        alert(result.error || `Failed to ${approved ? 'approve' : 'reject'} certificate`);
      }
    } catch (err) {
      console.error('Error reviewing certificate:', err);
      alert('Failed to review certificate');
    } finally {
      setActionLoading(false);
    }
  };

  const showReview = (action) => {
    setReviewAction(action);
    setShowReviewModal(true);
    setAdminNotes('');
  };

  if (loading) {
    return (
      <div className="certificate-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-management">
      {/* Header */}
      <div className="cert-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-certificate"></i>
            Certificate Management
          </h1>
          <p>Review and manage caregiver certificate verifications</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="close-alert">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button onClick={loadCertificates} className="retry-btn">
            <i className="fas fa-redo"></i>
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <i className="fas fa-certificate"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.total}</h3>
              <p>Total Certificates</p>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.manualReview}</h3>
              <p>Pending Review</p>
            </div>
          </div>
          <div className="stat-card stat-verified">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.verified}</h3>
              <p>Verified</p>
            </div>
          </div>
          <div className="stat-card stat-invalid">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.invalid}</h3>
              <p>Invalid/Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by caregiver name, email, certificate name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-group">
          <label>
            <i className="fas fa-filter"></i>
            Status Filter:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="ManualReviewRequired">Manual Review Required</option>
            <option value="Verified">Verified</option>
            <option value="Invalid">Invalid/Rejected</option>
            <option value="PendingVerification">Pending Verification</option>
            <option value="VerificationFailed">Verification Failed</option>
            <option value="NotVerified">Not Verified</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="certificates-table-container">
        <table className="certificates-table">
          <thead>
            <tr>
              <th>Caregiver</th>
              <th>Certificate</th>
              <th>Issuer</th>
              <th>Submitted</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No certificates found</p>
                </td>
              </tr>
            ) : (
              filteredCertificates.map((cert) => {
                const formatted = adminService.formatCertificateData(cert);
                return (
                  <tr key={cert.id}>
                    <td>
                      <div className="caregiver-info">
                        <strong>{formatted.caregiver?.name || 'N/A'}</strong>
                        <small>{formatted.caregiver?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      <strong>{formatted.name}</strong>
                    </td>
                    <td>{formatted.issuer}</td>
                    <td>{formatted.submittedDate}</td>
                    <td>
                      <div className="confidence-badge">
                        <span
                          className={`confidence-indicator confidence-${formatted.confidence.color}`}
                        >
                          {formatted.confidence.percentage}%
                        </span>
                        <small>{formatted.confidence.level}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${formatted.statusClass}`}>
                        {formatted.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => handleViewCertificate(cert.id)}
                      >
                        <i className="fas fa-eye"></i>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Certificate Review Modal */}
      {showCertModal && selectedCertificate && (
        <div className="modal-overlay" onClick={closeCertModal}>
          <div className="modal-content cert-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-certificate"></i>
                Certificate Review
              </h2>
              <button className="close-modal" onClick={closeCertModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {!selectedCertificate || !selectedCertificate.imageUrl ? (
                <div className="loading-state">
                  <p>Loading certificate details...</p>
                </div>
              ) : (
              <div className="cert-review-grid">
                {/* Left: Certificate Image */}
                <div className="cert-image-section">
                  <div className={`cert-image-container ${imageZoom ? 'zoomed' : ''}`}>
                    <img
                      src={selectedCertificate.imageUrl}
                      alt="Certificate"
                      onClick={() => setImageZoom(!imageZoom)}
                    />
                    <div className="image-controls">
                      <button onClick={() => setImageZoom(!imageZoom)} className="zoom-btn">
                        <i className={`fas fa-${imageZoom ? 'compress' : 'expand'}`}></i>
                        {imageZoom ? 'Zoom Out' : 'Zoom In'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Details and Actions */}
                <div className="cert-details-section">
                  {/* Certificate Info */}
                  <div className="detail-card">
                    <h3>Certificate Information</h3>
                    <div className="detail-row">
                      <span className="label">Certificate Name:</span>
                      <span className="value">{selectedCertificate.name || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Issuer:</span>
                      <span className="value">{selectedCertificate.issuer}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Year Obtained:</span>
                      <span className="value">{selectedCertificate.yearObtained}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Submitted On:</span>
                      <span className="value">{selectedCertificate.submittedDate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className={`status-badge ${selectedCertificate.statusClass}`}>
                        {selectedCertificate.status}
                      </span>
                    </div>
                  </div>

                  {/* Caregiver Info */}
                  {selectedCertificate.caregiver && (
                    <div className="detail-card">
                      <h3>Caregiver Profile</h3>
                      <div className="detail-row">
                        <span className="label">Name:</span>
                        <span className="value">{selectedCertificate.caregiver.name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Email:</span>
                        <span className="value">{selectedCertificate.caregiver.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Phone:</span>
                        <span className="value">{selectedCertificate.caregiver.phone}</span>
                      </div>
                    </div>
                  )}

                  {/* Extracted Info */}
                  {selectedCertificate.extractedInfo && (
                    <div className="detail-card">
                      <h3>Extracted Information</h3>
                      <div className="detail-row">
                        <span className="label">Holder Name:</span>
                        <span className="value">{selectedCertificate.extractedInfo.holderName || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Document Number:</span>
                        <span className="value">{selectedCertificate.extractedInfo.documentNumber || 'N/A'}</span>
                      </div>
                      {selectedCertificate.nameMatch !== null && (
                        <div className={`name-match-indicator ${selectedCertificate.nameMatch ? 'match' : 'mismatch'}`}>
                          <i className={`fas fa-${selectedCertificate.nameMatch ? 'check-circle' : 'exclamation-triangle'}`}></i>
                          {selectedCertificate.nameMatch ? 'Name matches profile' : 'Name mismatch detected'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Info */}
                  <div className="detail-card">
                    <h3>Verification Details</h3>
                    <div className="detail-row">
                      <span className="label">Confidence Score:</span>
                      <span className={`confidence-badge confidence-${selectedCertificate.confidence?.color || 'gray'}`}>
                        {selectedCertificate.confidence?.percentage || 0}% ({selectedCertificate.confidence?.level || 'Unknown'})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Verification Attempts:</span>
                      <span className="value">{selectedCertificate.attempts || 0}</span>
                    </div>
                    {selectedCertificate.verifiedDate && selectedCertificate.verifiedDate !== 'N/A' && (
                      <div className="detail-row">
                        <span className="label">Verified Date:</span>
                        <span className="value">{selectedCertificate.verifiedDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Validation Issues */}
                  {selectedCertificate.validationIssues && selectedCertificate.validationIssues.length > 0 && (
                    <div className="detail-card validation-issues-card">
                      <h3>
                        <i className="fas fa-exclamation-triangle"></i>
                        Validation Issues
                      </h3>
                      <div className="validation-issues-list">
                        {selectedCertificate.validationIssues.map((issue, idx) => (
                          <div key={idx} className="validation-issue-item">
                            <i className="fas fa-circle"></i>
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Review Information */}
                  {selectedCertificate.adminReviewNotes && (
                    <div className="detail-card review-notes-card">
                      <h3>
                        <i className="fas fa-clipboard-list"></i>
                        Admin Review Notes
                      </h3>
                      <div className="review-notes-content">
                        <p>{selectedCertificate.adminReviewNotes}</p>
                      </div>
                      {selectedCertificate.reviewedByAdminId && (
                        <div className="review-metadata">
                          <div className="detail-row">
                            <span className="label">Reviewed By:</span>
                            <span className="value">Admin ID: {selectedCertificate.reviewedByAdminId}</span>
                          </div>
                          {selectedCertificate.reviewedAt && (
                            <div className="detail-row">
                              <span className="label">Reviewed At:</span>
                              <span className="value">{new Date(selectedCertificate.reviewedAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedCertificate.statusValue === 4 && !showReviewModal && (
                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => showReview('approve')}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-check"></i>
                        Approve Certificate
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => showReview('reject')}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-times"></i>
                        Reject Certificate
                      </button>
                    </div>
                  )}

                  {/* Status message for non-reviewable certificates */}
                  {selectedCertificate.statusValue === 1 && (
                    <div className="status-message success-message">
                      <i className="fas fa-check-circle"></i>
                      This certificate has already been verified and approved.
                    </div>
                  )}
                  {(selectedCertificate.statusValue === 2 || selectedCertificate.statusValue === 3) && (
                    <div className="status-message warning-message">
                      <i className="fas fa-info-circle"></i>
                      This certificate has already been reviewed and marked as {selectedCertificate.status}. 
                      Only certificates flagged for manual review can be re-reviewed through this interface.
                    </div>
                  )}
                  {selectedCertificate.statusValue === 0 && (
                    <div className="status-message info-message">
                      <i className="fas fa-clock"></i>
                      This certificate is pending automatic verification. It will be available for manual review if verification fails.
                    </div>
                  )}

                  {/* Unified Review Modal */}
                  {showReviewModal && (
                    <div className={`action-form review-form ${reviewAction === 'approve' ? 'approval-form' : 'rejection-form'}`}>
                      <h4>
                        <i className={`fas fa-${reviewAction === 'approve' ? 'check-circle' : 'times-circle'}`}></i>
                        {reviewAction === 'approve' ? 'Approve Certificate' : 'Reject Certificate'}
                      </h4>
                      
                      {/* Show validation issues for context */}
                      {selectedCertificate.validationIssues && selectedCertificate.validationIssues.length > 0 && (
                        <div className="review-context">
                          <p className="context-label">
                            <i className="fas fa-info-circle"></i>
                            AI Validation Issues Detected:
                          </p>
                          <ul className="context-issues-list">
                            {selectedCertificate.validationIssues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className={reviewAction === 'reject' ? 'warning-text' : ''}>
                        {reviewAction === 'approve' 
                          ? 'You are about to approve this certificate. The caregiver will be notified.'
                          : (
                            <>
                              <i className="fas fa-exclamation-triangle"></i>
                              You must provide a specific reason. The caregiver will receive this in their notification.
                            </>
                          )
                        }
                      </p>

                      {reviewAction === 'reject' && (
                        <div className="form-group">
                          <label>Quick Select Reason:</label>
                          <div className="quick-reasons">
                            {adminService.getCommonRejectionReasons().map((reason, idx) => (
                              <button
                                key={idx}
                                className={`reason-chip ${adminNotes === reason ? 'selected' : ''}`}
                                onClick={() => setAdminNotes(reason)}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <label>{reviewAction === 'approve' ? 'Approval Notes (Optional):' : 'Rejection Reason (Required):'}</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder={reviewAction === 'approve' 
                            ? 'Add any notes about this approval...'
                            : 'Provide a clear and specific reason for rejection...'
                          }
                          rows="4"
                          required={reviewAction === 'reject'}
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
                          onClick={handleReviewCertificate}
                          disabled={actionLoading || (reviewAction === 'reject' && !adminNotes.trim())}
                        >
                          {actionLoading ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={closeCertModal}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement;

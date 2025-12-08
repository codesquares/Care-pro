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
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
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
      const result = await adminService.getCertificateDetails(certificateId);
      if (result.success) {
        setSelectedCertificate(adminService.formatCertificateData(result.data));
        setShowCertModal(true);
        setRejectionReason('');
        setApprovalNotes('');
      } else {
        alert(result.error || 'Failed to load certificate details');
      }
    } catch (err) {
      console.error('Error loading certificate:', err);
      alert('Failed to load certificate details');
    }
  };

  const closeCertModal = () => {
    setShowCertModal(false);
    setSelectedCertificate(null);
    setShowRejectModal(false);
    setShowApprovalModal(false);
    setRejectionReason('');
    setApprovalNotes('');
    setImageZoom(false);
  };

  const handleApprove = async () => {
    if (!selectedCertificate) return;

    setActionLoading(true);
    try {
      const result = await adminService.approveCertificate(
        selectedCertificate.id,
        adminId,
        approvalNotes
      );

      if (result.success) {
        setSuccessMessage('Certificate approved successfully! Caregiver has been notified.');
        setTimeout(() => setSuccessMessage(''), 5000);
        closeCertModal();
        loadCertificates(); // Reload to get updated data
      } else {
        alert(result.error || 'Failed to approve certificate');
      }
    } catch (err) {
      console.error('Error approving certificate:', err);
      alert('Failed to approve certificate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCertificate) return;

    if (!rejectionReason || rejectionReason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminService.rejectCertificate(
        selectedCertificate.id,
        adminId,
        rejectionReason
      );

      if (result.success) {
        setSuccessMessage('Certificate rejected. Caregiver has been notified with detailed feedback.');
        setTimeout(() => setSuccessMessage(''), 5000);
        closeCertModal();
        loadCertificates(); // Reload to get updated data
      } else {
        alert(result.error || 'Failed to reject certificate');
      }
    } catch (err) {
      console.error('Error rejecting certificate:', err);
      alert('Failed to reject certificate');
    } finally {
      setActionLoading(false);
    }
  };

  const showApprovalConfirmation = () => {
    setShowApprovalModal(true);
  };

  const showRejectionForm = () => {
    setShowRejectModal(true);
  };

  const selectRejectionReason = (reason) => {
    setRejectionReason(reason);
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
                      <span className="value">{selectedCertificate.name}</span>
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
                      <span className={`confidence-badge confidence-${selectedCertificate.confidence.color}`}>
                        {selectedCertificate.confidence.percentage}% ({selectedCertificate.confidence.level})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Verification Attempts:</span>
                      <span className="value">{selectedCertificate.attempts}</span>
                    </div>
                    {selectedCertificate.verifiedDate !== 'N/A' && (
                      <div className="detail-row">
                        <span className="label">Verified Date:</span>
                        <span className="value">{selectedCertificate.verifiedDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {selectedCertificate.statusValue === 4 && !showRejectModal && !showApprovalModal && (
                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={showApprovalConfirmation}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-check"></i>
                        Approve Certificate
                      </button>
                      <button
                        className="btn-reject"
                        onClick={showRejectionForm}
                        disabled={actionLoading}
                      >
                        <i className="fas fa-times"></i>
                        Reject Certificate
                      </button>
                    </div>
                  )}

                  {/* Approval Form */}
                  {showApprovalModal && (
                    <div className="action-form approval-form">
                      <h4>
                        <i className="fas fa-check-circle"></i>
                        Approve Certificate
                      </h4>
                      <p>You are about to approve this certificate. The caregiver will be notified.</p>
                      <div className="form-group">
                        <label>Approval Notes (Optional):</label>
                        <textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          placeholder="Add any notes about this approval..."
                          rows="3"
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          className="btn-confirm"
                          onClick={handleApprove}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : 'Confirm Approval'}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => setShowApprovalModal(false)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection Form */}
                  {showRejectModal && (
                    <div className="action-form rejection-form">
                      <h4>
                        <i className="fas fa-times-circle"></i>
                        Reject Certificate
                      </h4>
                      <p className="warning-text">
                        <i className="fas fa-exclamation-triangle"></i>
                        You must provide a specific reason. The caregiver will receive this in their notification.
                      </p>
                      <div className="form-group">
                        <label>Quick Select Reason:</label>
                        <div className="quick-reasons">
                          {adminService.getCommonRejectionReasons().map((reason, idx) => (
                            <button
                              key={idx}
                              className={`reason-chip ${rejectionReason === reason ? 'selected' : ''}`}
                              onClick={() => selectRejectionReason(reason)}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Rejection Reason (Required):</label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide a clear and specific reason for rejection..."
                          rows="4"
                          required
                        />
                        {rejectionReason && (
                          <small className="char-count">
                            {rejectionReason.length} characters
                          </small>
                        )}
                      </div>
                      <div className="form-actions">
                        <button
                          className="btn-confirm btn-reject"
                          onClick={handleReject}
                          disabled={actionLoading || !rejectionReason.trim()}
                        >
                          {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => setShowRejectModal(false)}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement;

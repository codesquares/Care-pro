import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import './CareRequestDetail.css';

const URGENCY_LABELS = {
  'within-24h': 'Urgent — Within 24 hours',
  'within-week': 'Within a week',
  'within-month': 'Within a month',
  'no-rush': 'No rush',
};

const formatBudget = (req) => {
  if (req.budgetMin != null && req.budgetMax != null) {
    return `₦${Number(req.budgetMin).toLocaleString()}–₦${Number(req.budgetMax).toLocaleString()}`;
  }
  if (req.budget) return req.budget;
  return 'Not specified';
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const CareRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('responders');
  const [actionLoading, setActionLoading] = useState(null);  const [hireTarget, setHireTarget] = useState(null);
  const [hiring, setHiring] = useState(false);
  const fetchDetail = useCallback(async () => {
    try {
      const result = await CareRequestService.getRequestDetail(requestId);
      setData(result);
    } catch (err) {
      console.error('Failed to load request detail:', err);
      toast.error(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ─── Lifecycle Actions ───

  const handleLifecycleAction = async (action) => {
    const confirmMsg = {
      pause: 'Pause this request? Caregivers will no longer see it.',
      reopen: 'Re-open this request?',
      close: 'Close this request? All pending responders will be notified.',
      cancel: 'Cancel this request?',
      delete: 'Delete this request? This cannot be undone.',
    };

    if (!window.confirm(confirmMsg[action])) return;

    setActionLoading(action);
    try {
      if (action === 'pause') await CareRequestService.pauseRequest(requestId);
      else if (action === 'reopen') await CareRequestService.reopenRequest(requestId);
      else if (action === 'close') await CareRequestService.closeRequest(requestId);
      else if (action === 'cancel') await CareRequestService.cancelCareRequest(requestId);
      else if (action === 'delete') {
        await CareRequestService.deleteRequest(requestId);
        toast.success('Request deleted.');
        navigate('/app/client/your-requests');
        return;
      }
      toast.success(`Request ${action}ed successfully.`);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Shortlist / Remove ───

  const handleShortlist = async (responseId) => {
    try {
      await CareRequestService.shortlistResponse(requestId, responseId);
      toast.success('Caregiver shortlisted.');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to shortlist.');
    }
  };

  const handleRemoveShortlist = async (responseId) => {
    try {
      await CareRequestService.removeShortlist(requestId, responseId);
      toast.success('Removed from shortlist.');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove from shortlist.');
    }
  };

  // ─── Hire ───

  const handleHire = async (responseId) => {
    setHireTarget(responseId);
  };

  const confirmHire = async () => {
    if (!hireTarget) return;
    setHiring(true);
    try {
      const result = await CareRequestService.hireCaregiver(requestId, hireTarget);
      setHireTarget(null);
      // New flow: hire creates a negotiation instead of a special gig directly.
      // Navigate to negotiation with careRequestMeta so re-initiation works after rejection/expiry.
      if (result.negotiationId) {
        toast.success('Caregiver hired! Setting up price negotiation...');
        navigate(`/app/client/price-negotiation/${result.negotiationId}`, {
          state: { careRequestMeta: { careRequestId: requestId, responseId: hireTarget } },
        });
      } else if (result.specialGigId) {
        // Legacy fallback in case backend has not yet deployed the new response shape
        toast.success('Caregiver hired! Redirecting to booking...');
        navigate(`/app/client/commitment-payment/${result.specialGigId}`);
      } else {
        toast.success('Caregiver hired!');
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to hire caregiver.');
    } finally {
      setHiring(false);
    }
  };

  if (loading) {
    return (
      <div className="crd-page">
        <div className="crd-loading">Loading request details...</div>
      </div>
    );
  }

  if (!data?.request) {
    return (
      <div className="crd-page">
        <div className="crd-loading">Request not found.</div>
      </div>
    );
  }

  const { request, responders, counts } = data;
  const status = (request.status || '').toLowerCase();
  const canPause = status === 'pending' || status === 'matched';
  const canReopen = status === 'paused';
  const canClose = status === 'pending' || status === 'matched' || status === 'paused';
  const canCancel = status === 'pending' || status === 'matched' || status === 'paused';
  const canDelete = ['cancelled', 'closed', 'pending', 'unmatched'].includes(status);

  const tabData = {
    responders: responders?.all || [],
    shortlisted: responders?.shortlisted || [],
    hired: responders?.hired || [],
  };

  return (
    <div className="crd-page">
      {/* Header Bar */}
      <div className="crd-header-bar">
        <div className="crd-header-info">
          <h1 className="crd-title">{request.title}</h1>
          <div className="crd-header-meta">
            {request.location && <span className="crd-meta-item">📍 {request.location}</span>}
            <span className="crd-meta-item">Posted {formatTimeAgo(request.postedAt || request.createdAt)}</span>
          </div>
        </div>
        <div className="crd-header-actions">
          {canReopen && (
            <button className="crd-action-btn crd-action-reopen" onClick={() => handleLifecycleAction('reopen')} disabled={actionLoading}>
              Re-open Request
            </button>
          )}
          {canClose && (
            <button className="crd-action-btn crd-action-close" onClick={() => handleLifecycleAction('close')} disabled={actionLoading}>
              Close Request
            </button>
          )}
          {canPause && (
            <button className="crd-action-btn crd-action-pause" onClick={() => handleLifecycleAction('pause')} disabled={actionLoading}>
              Pause Request
            </button>
          )}
          {canCancel && (
            <button className="crd-action-btn crd-action-cancel" onClick={() => handleLifecycleAction('cancel')} disabled={actionLoading}>
              Cancel Request
            </button>
          )}
          {canDelete && (
            <button className="crd-action-btn crd-action-delete" onClick={() => handleLifecycleAction('delete')} disabled={actionLoading}>
              Delete Request
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="crd-content">
        {/* Left: Request Details */}
        <div className="crd-left">
          <div className="crd-section">
            <h3 className="crd-section-title">Service Details</h3>
            <div className="crd-field"><span className="crd-label">Service Group:</span><span>{request.serviceGroup || '—'}</span></div>
            <div className="crd-field"><span className="crd-label">Service Type:</span><span>● {request.serviceCategory || '—'}</span></div>
            {request.servicePackageType && (
              <div className="crd-field"><span className="crd-label">Service Package Type:</span><span>{request.servicePackageType}</span></div>
            )}
          </div>

          <div className="crd-section">
            <h3 className="crd-section-title">Tasks Required</h3>
            {request.tasks?.length > 0 ? (
              <ul className="crd-tasks">{request.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
            ) : (
              <p className="crd-muted">No tasks specified.</p>
            )}
          </div>

          <div className="crd-section">
            <h3 className="crd-section-title">Schedule Details</h3>
            <div className="crd-field"><span className="crd-label">Priority:</span><span>{URGENCY_LABELS[request.urgency] || request.urgency || '—'}</span></div>
            <div className="crd-field"><span className="crd-label">Preferred time of day:</span><span>{request.schedule?.join(', ') || '—'}</span></div>
            <div className="crd-field"><span className="crd-label">Service Mode:</span><span>{request.serviceMode || request.frequency || '—'}</span></div>
          </div>

          <div className="crd-section">
            <h3 className="crd-section-title">Budget Details</h3>
            <div className="crd-field"><span className="crd-label">Range:</span><span>{formatBudget(request)}</span></div>
            {request.budgetType && <div className="crd-field"><span className="crd-label">Budget Type:</span><span>{request.budgetType}</span></div>}
          </div>

          {request.notes && (
            <div className="crd-section">
              <h3 className="crd-section-title">Notes</h3>
              <p className="crd-notes-text">{request.notes}</p>
            </div>
          )}

          <div className="crd-section">
            <h3 className="crd-section-title">Caregiver Preferences</h3>
            <div className="crd-field"><span className="crd-label">Experience:</span><span>{request.experiencePreference || '—'}</span></div>
            <div className="crd-field"><span className="crd-label">Certifications:</span><span>{request.certificationPreference || '—'}</span></div>
            <div className="crd-field"><span className="crd-label">Language:</span><span>{request.languagePreference || '—'}</span></div>
          </div>
        </div>

        {/* Right: Responder Tabs */}
        <div className="crd-right">
          <div className="crd-tabs">
            <button className={`crd-tab ${activeTab === 'responders' ? 'active' : ''}`} onClick={() => setActiveTab('responders')}>
              Responders ({counts?.responders || 0})
            </button>
            <button className={`crd-tab ${activeTab === 'shortlisted' ? 'active' : ''}`} onClick={() => setActiveTab('shortlisted')}>
              Shortlisted ({counts?.shortlisted || 0})
            </button>
            <button className={`crd-tab ${activeTab === 'hired' ? 'active' : ''}`} onClick={() => setActiveTab('hired')}>
              Hired ({counts?.hired || 0})
            </button>
          </div>

          {/* Responder Cards */}
          <div className="crd-responder-grid">
            {tabData[activeTab].length === 0 ? (
              <div className="crd-no-responders">
                {activeTab === 'responders' && 'No caregivers have responded yet.'}
                {activeTab === 'shortlisted' && 'No caregivers shortlisted yet.'}
                {activeTab === 'hired' && 'No caregiver hired yet.'}
              </div>
            ) : (
              tabData[activeTab].map((cg) => (
                <CaregiverCard
                  key={cg.responseId}
                  caregiver={cg}
                  activeTab={activeTab}
                  onViewProfile={() => navigate(`/service/${cg.specialGigId || cg.caregiverId}`)}
                  onShortlist={() => handleShortlist(cg.responseId)}
                  onRemoveShortlist={() => handleRemoveShortlist(cg.responseId)}
                  onHire={() => handleHire(cg.responseId)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hire Confirmation Modal */}
      {hireTarget && (
        <div className="crd-modal-overlay" onClick={() => !hiring && setHireTarget(null)}>
          <div className="crd-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="crd-modal-title">Confirm Hire</h3>
            <p className="crd-modal-text">
              A dedicated service listing will be created for this caregiver so you can proceed to booking. Continue?
            </p>
            <div className="crd-modal-actions">
              <button className="crd-modal-btn crd-modal-btn--cancel" onClick={() => setHireTarget(null)} disabled={hiring}>
                Cancel
              </button>
              <button className="crd-modal-btn crd-modal-btn--confirm" onClick={confirmHire} disabled={hiring}>
                {hiring ? 'Processing…' : 'Yes, Hire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Caregiver Card Component ───

const CaregiverCard = ({ caregiver, activeTab, onViewProfile, onShortlist, onRemoveShortlist, onHire }) => {
  const cg = caregiver;
  const initials = (cg.caregiverName || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="crd-cg-card">
      <div className="crd-cg-avatar">
        {cg.profileImage ? (
          <img src={cg.profileImage} alt={cg.caregiverName} />
        ) : (
          <div className="crd-cg-initials">{initials}</div>
        )}
        {(cg.isVerified || cg.isIdentityVerified) && <span className="crd-cg-verified" title="Verified">✓</span>}
      </div>

      <h4 className="crd-cg-name">{cg.caregiverName}</h4>

      {cg.averageRating > 0 && (
        <div className="crd-cg-rating">
          <span className="crd-cg-stars">{'★'.repeat(Math.round(cg.averageRating))}</span>
          <span className="crd-cg-rating-num">{cg.averageRating.toFixed(1)}</span>
        </div>
      )}

      {cg.location && <p className="crd-cg-location">📍 {cg.location}</p>}

      <div className="crd-cg-actions">
        <button className="crd-cg-btn-profile" onClick={onViewProfile}>View Profile</button>

        {activeTab === 'responders' && cg.status === 'pending' && (
          <button className="crd-cg-btn-shortlist" onClick={onShortlist}>Shortlist</button>
        )}
        {activeTab === 'responders' && cg.status === 'pending' && (
          <button className="crd-cg-btn-hire" onClick={onHire}>Hire</button>
        )}
        {activeTab === 'shortlisted' && (
          <>
            <button className="crd-cg-btn-hire" onClick={onHire}>Hire</button>
            <button className="crd-cg-btn-remove" onClick={onRemoveShortlist}>Remove</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CareRequestDetail;

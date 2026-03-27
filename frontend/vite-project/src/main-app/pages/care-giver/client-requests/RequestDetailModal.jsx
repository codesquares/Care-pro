import { useState } from 'react';
import './RequestDetailModal.css';

const URGENCY_COLORS = {
  'within-24h': '#ef4444',
  'within-week': '#f59e0b',
  'within-month': '#3b82f6',
  'no-rush': '#22c55e',
};

const formatBudget = (req) => {
  if (req.budgetMin != null && req.budgetMax != null) {
    return `₦${Number(req.budgetMin).toLocaleString()}–₦${Number(req.budgetMax).toLocaleString()}`;
  }
  if (req.budget) return req.budget;
  return 'Not specified';
};

const formatUrgency = (u) => {
  if (!u) return 'Not specified';
  return u.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const RequestDetailModal = ({ request, loading, onClose, onRespond }) => {
  const [responding, setResponding] = useState(false);
  const [message, setMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onRespond(request.id, {
        message: message.trim() || null,
        proposedRate: proposedRate ? Number(proposedRate) : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rdm-overlay" onClick={onClose}>
      <div className="rdm-modal" onClick={e => e.stopPropagation()}>
        <button className="rdm-close" onClick={onClose}>×</button>

        {loading ? (
          <div className="rdm-loading">Loading request details...</div>
        ) : !request ? (
          <div className="rdm-loading">Request not found.</div>
        ) : (
          <>
            {/* Header */}
            <div className="rdm-header">
              <div className="rdm-header-meta">
                {request.respondersCount > 0 && (
                  <span className="rdm-meta-responders">{request.respondersCount} Caregiver{request.respondersCount !== 1 ? 's' : ''} Responded</span>
                )}
              </div>
              <h2 className="rdm-title">{request.title}</h2>
              <p className="rdm-notes">{request.notes}</p>
            </div>

            {/* Body Grid */}
            <div className="rdm-body">
              {/* Left Column: Service Details */}
              <div className="rdm-section">
                <h3 className="rdm-section-title">Service Details</h3>
                <div className="rdm-field">
                  <span className="rdm-label">Service Group:</span>
                  <span>{request.serviceGroup || '—'}</span>
                </div>
                <div className="rdm-field">
                  <span className="rdm-label">Service Type:</span>
                  <span>{request.serviceCategory || '—'}</span>
                </div>
                {request.servicePackageType && (
                  <div className="rdm-field">
                    <span className="rdm-label">Service Package Type:</span>
                    <span>{request.servicePackageType}</span>
                  </div>
                )}

                <h3 className="rdm-section-title" style={{ marginTop: 20 }}>Tasks Required</h3>
                {request.tasks?.length > 0 ? (
                  <ul className="rdm-tasks">
                    {request.tasks.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                ) : (
                  <p className="rdm-muted">No specific tasks listed.</p>
                )}

                <h3 className="rdm-section-title" style={{ marginTop: 20 }}>Schedule Details</h3>
                <div className="rdm-field">
                  <span className="rdm-label">Priority:</span>
                  <span style={{ color: URGENCY_COLORS[request.urgency] || '#64748b' }}>
                    {formatUrgency(request.urgency)}
                  </span>
                </div>
                <div className="rdm-field">
                  <span className="rdm-label">Preferred time of day:</span>
                  <span>{request.schedule?.join(', ') || '—'}</span>
                </div>
                <div className="rdm-field">
                  <span className="rdm-label">Frequency:</span>
                  <span>{request.frequency || '—'}</span>
                </div>
                {request.serviceMode && (
                  <div className="rdm-field">
                    <span className="rdm-label">Service Mode:</span>
                    <span>{request.serviceMode}</span>
                  </div>
                )}

                <h3 className="rdm-section-title" style={{ marginTop: 20 }}>Budget Details</h3>
                <div className="rdm-field">
                  <span className="rdm-label">Range:</span>
                  <span>{formatBudget(request)}</span>
                </div>
                {request.budgetType && (
                  <div className="rdm-field">
                    <span className="rdm-label">Budget Type:</span>
                    <span>{request.budgetType}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Caregiver Preferences */}
              <div className="rdm-section">
                <h3 className="rdm-section-title">Caregiver Preferences</h3>
                <div className="rdm-field">
                  <span className="rdm-label">Experience:</span>
                  <span>{request.experiencePreference || '—'}</span>
                </div>
                <div className="rdm-field">
                  <span className="rdm-label">Certifications:</span>
                  <span>{request.certificationPreference || '—'}</span>
                </div>
                <div className="rdm-field">
                  <span className="rdm-label">Language:</span>
                  <span>{request.languagePreference || '—'}</span>
                </div>
              </div>
            </div>

            {/* Response Form (if clicking respond) */}
            {responding && !request.hasResponded && (
              <div className="rdm-respond-form">
                <h3 className="rdm-section-title">Your Response</h3>
                <textarea
                  className="rdm-textarea"
                  placeholder="Optional message to the client (max 500 chars)"
                  maxLength={500}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                />
                <div className="rdm-rate-row">
                  <label className="rdm-label">Proposed Rate (₦):</label>
                  <input
                    type="number"
                    className="rdm-rate-input"
                    placeholder="Optional"
                    value={proposedRate}
                    onChange={e => setProposedRate(e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="rdm-actions">
              {request.hasResponded ? (
                <button className="rdm-btn-responded" disabled>Already Responded</button>
              ) : responding ? (
                <>
                  <button className="rdm-btn-cancel" onClick={() => setResponding(false)}>Back</button>
                  <button className="rdm-btn-submit" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Response'}
                  </button>
                </>
              ) : (
                <>
                  <button className="rdm-btn-respond" onClick={() => setResponding(true)}>
                    Respond to Request
                  </button>
                  <button className="rdm-btn-not-interested" onClick={onClose}>
                    Not Interested
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestDetailModal;

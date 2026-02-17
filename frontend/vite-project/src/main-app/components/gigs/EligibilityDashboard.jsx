import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import specializedAssessmentService from '../../services/specializedAssessmentService';
import {
  SERVICE_TIERS,
  CATEGORY_TIER_MAP,
  toServiceKey,
  toDisplayName,
  SPECIALIZED_CERTIFICATE_TYPES,
} from '../../constants/serviceClassification';
import './eligibility-dashboard.css';

/**
 * EligibilityDashboard — Shows per-category eligibility status for the
 * current caregiver, with links to take assessments or upload certificates.
 *
 * Can be embedded in ProfileInformation or used as a standalone page.
 */
const EligibilityDashboard = ({ caregiverId: propCaregiverId, compact = false, onUploadCert }) => {
  const navigate = useNavigate();

  const getCaregiverId = () => {
    if (propCaregiverId) return propCaregiverId;
    try {
      return JSON.parse(localStorage.getItem('userDetails') || '{}').id || null;
    } catch { return null; }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState(null); // { categories: { ... } }
  const [requirements, setRequirements] = useState([]); // Array of ServiceRequirement
  const [certificates, setCertificates] = useState([]); // Array of Certificate
  const [filter, setFilter] = useState('all'); // all | eligible | pending

  // ─── Load Data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const cid = getCaregiverId();
    if (!cid) {
      setError('Unable to identify your account.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [eligRes, reqRes, certRes] = await Promise.all([
        specializedAssessmentService.getEligibility(cid),
        specializedAssessmentService.getServiceRequirements(),
        specializedAssessmentService.getCertificateStatus(cid),
      ]);

      if (eligRes.success) setEligibility(eligRes.data);
      if (reqRes.success) setRequirements(reqRes.data || []);
      if (certRes.success) setCertificates(certRes.data || []);

      if (!eligRes.success) {
        setError('Could not load eligibility data.');
      }
    } catch (err) {
      console.error('Error loading eligibility dashboard:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [propCaregiverId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Build category list ─────────────────────────────────────────────────
  // Backend returns categories as an array — build a lookup map by serviceCategory
  const eligibilityMap = {};
  if (Array.isArray(eligibility?.categories)) {
    eligibility.categories.forEach((cat) => {
      eligibilityMap[cat.serviceCategory] = cat;
    });
  } else if (eligibility?.categories && typeof eligibility.categories === 'object') {
    // Fallback: if backend ever changes to object-keyed
    Object.assign(eligibilityMap, eligibility.categories);
  }

  const specializedCategories = Object.entries(CATEGORY_TIER_MAP)
    .filter(([, tier]) => tier === SERVICE_TIERS.SPECIALIZED)
    .map(([displayName]) => {
      const key = toServiceKey(displayName);
      const elig = eligibilityMap[key] || null;
      const req = requirements.find((r) => r.serviceCategory === key) || null;
      return { displayName, serviceKey: key, elig, req };
    });

  const filteredCategories = specializedCategories.filter((c) => {
    if (filter === 'eligible') return c.elig?.isEligible;
    if (filter === 'pending') return !c.elig?.isEligible;
    return true;
  });

  const eligibleCount = specializedCategories.filter((c) => c.elig?.isEligible).length;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`ed-container ${compact ? 'ed-compact' : ''}`}>
        <div className="ed-loading">
          <div className="ed-spinner" />
          <p>Loading eligibility...</p>
        </div>
      </div>
    );
  }

  if (error && !eligibility) {
    return (
      <div className={`ed-container ${compact ? 'ed-compact' : ''}`}>
        <div className="ed-error">
          <p>{error}</p>
          <button className="ed-btn ed-btn-primary" onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ed-container ${compact ? 'ed-compact' : ''}`}>
      {/* Header */}
      {!compact && (
        <div className="ed-header">
          <div className="ed-header-text">
            <h2>Specialized Service Eligibility</h2>
            <p>
              Track your qualification status for specialized care categories.
              Pass the assessment and upload required certificates to unlock each category.
            </p>
          </div>
          <div className="ed-summary-badge">
            <span className="ed-summary-count">{eligibleCount}</span>
            <span className="ed-summary-label">
              of {specializedCategories.length} categories eligible
            </span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="ed-filter-tabs">
        {['all', 'eligible', 'pending'].map((f) => (
          <button
            key={f}
            className={`ed-tab ${filter === f ? 'ed-tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'eligible' ? 'Eligible' : 'Pending'}
          </button>
        ))}
      </div>

      {/* Category cards */}
      <div className="ed-categories">
        {filteredCategories.length === 0 ? (
          <div className="ed-empty">
            <p>No categories match this filter.</p>
          </div>
        ) : (
          filteredCategories.map(({ displayName, serviceKey, elig, req }) => {
            const isEligible = elig?.isEligible;
            const assessmentPassed = elig?.assessmentPassed;
            const assessmentExpired = elig?.assessmentExpired;
            const assessmentExpiresAt = elig?.assessmentExpiresAt;
            const certValid = elig?.certificatesVerified;
            const missingCerts = elig?.missingCertificates || [];
            const cooldown = elig?.cooldownUntil;
            const hasCooldown = cooldown && new Date(cooldown) > new Date();

            return (
              <div
                key={serviceKey}
                className={`ed-category-card ${isEligible ? 'ed-card-eligible' : 'ed-card-pending'}`}
              >
                <div className="ed-card-header">
                  <h4 className="ed-card-title">
                    {isEligible ? '✅' : '🔒'} {displayName}
                  </h4>
                  <span className={`ed-status-pill ${isEligible ? 'eligible' : 'pending'}`}>
                    {isEligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>

                <div className="ed-card-checklist">
                  {/* Assessment status */}
                  <div className={`ed-check-item ${assessmentPassed && !assessmentExpired ? 'done' : 'undone'}`}>
                    <span className="ed-check-icon">{assessmentPassed && !assessmentExpired ? '✅' : assessmentExpired ? '⚠️' : '❌'}</span>
                    <span className="ed-check-text">
                      Specialized assessment
                      {elig?.assessmentScore != null && (
                        <span className="ed-score-inline"> — {elig.assessmentScore}%</span>
                      )}
                      {assessmentExpired && (
                        <span className="ed-expired-text" style={{ color: '#f59e0b', fontSize: '0.85em', display: 'block', marginTop: '2px' }}>
                          Your assessment expired{assessmentExpiresAt ? ` on ${new Date(assessmentExpiresAt).toLocaleDateString()}` : ''}. Please retake.
                        </span>
                      )}
                      {!assessmentExpired && assessmentExpiresAt && assessmentPassed && (
                        <span className="ed-expiry-text" style={{ color: '#6b7280', fontSize: '0.8em', display: 'block', marginTop: '2px' }}>
                          Expires: {new Date(assessmentExpiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                    {(!assessmentPassed || assessmentExpired) && (
                      <button
                        className="ed-action-link"
                        onClick={() =>
                          navigate(`/app/caregiver/specialized-assessment?category=${serviceKey}`)
                        }
                        disabled={hasCooldown}
                        title={hasCooldown ? 'Cooldown active' : assessmentExpired ? 'Retake the assessment' : 'Take the assessment'}
                      >
                        {hasCooldown ? 'Cooldown active' : assessmentExpired ? 'Retake Assessment' : 'Take Assessment'}
                      </button>
                    )}
                  </div>

                  {/* Certificate status */}
                  <div className={`ed-check-item ${certValid ? 'done' : 'undone'}`}>
                    <span className="ed-check-icon">{certValid ? '✅' : '❌'}</span>
                    <span className="ed-check-text">Certificates verified</span>
                    {!certValid && missingCerts.length > 0 && (
                      <div className="ed-missing-certs">
                        <span className="ed-missing-label">Missing:</span>
                        {missingCerts.map((cert, i) => (
                          <span key={i} className="ed-missing-cert-tag">{cert}</span>
                        ))}
                      </div>
                    )}
                    {!certValid && (
                      <button
                        className="ed-action-link"
                        onClick={() => onUploadCert ? onUploadCert() : navigate('/app/caregiver/profile?uploadCert=true')}
                      >
                        Upload Certificates
                      </button>
                    )}
                  </div>

                  {/* Required certificates info */}
                  {req?.requiredCertificates?.length > 0 && (
                    <div className="ed-required-info">
                      <span className="ed-required-label">Required:</span>
                      {req.requiredCertificates.map((cert, i) => (
                        <span key={i} className="ed-required-tag">{cert}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cooldown notice */}
                {hasCooldown && (
                  <div className="ed-cooldown-notice">
                    ⏳ Retake available at {new Date(cooldown).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Certificates section */}
      {!compact && certificates.length > 0 && (
        <div className="ed-certificates-section">
          <h3>Your Certificates</h3>
          <div className="ed-cert-list">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className={`ed-cert-item ${cert.isVerified ? 'verified' : 'unverified'}`}
              >
                <div className="ed-cert-info">
                  <span className="ed-cert-name">{cert.certificateType}</span>
                  <span className={`ed-cert-cat ed-cert-cat-${cert.certificateCategory || 'other'}`}>
                    {cert.certificateCategory || 'Other'}
                  </span>
                </div>
                <div className="ed-cert-meta">
                  <span className={`ed-cert-status ${cert.isVerified ? 'verified' : 'pending'}`}>
                    {cert.isVerified ? '✅ Verified' : '⏳ Pending'}
                  </span>
                  {cert.expiryDate && (
                    <span className="ed-cert-expiry">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                  {cert.serviceCategories?.length > 0 && (
                    <span className="ed-cert-covers">
                      Covers: {cert.serviceCategories.map(toDisplayName).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EligibilityDashboard;

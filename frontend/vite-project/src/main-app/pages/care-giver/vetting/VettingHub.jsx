import { useEffect, useState } from 'react';
import { isProfessionalProfileDone } from '../../../utils/professionalProfileRule';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, {
  REQUIRED_GUARANTOR_COUNT,
  READINESS_REASON_INFO,
} from '../../../services/caregiverVettingService';
import professionalProfileService from '../../../services/professionalProfileService';
import policeClearanceService from '../../../services/policeClearanceService';
import { formatLagos } from '../../../utils/lagosTime';
import { useVettingLockout } from '../../../contexts/VettingLockoutContext';
import { MISSING_LABELS } from '../../../utils/vettingLockout';
import './vetting.css';

const VettingHub = () => {
  const navigate = useNavigate();
  const basePath = '/app/caregiver/vetting';

  const lock = useVettingLockout();
  const [loading, setLoading] = useState(true);
  const [classification, setClassification] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [socialHandles, setSocialHandles] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState(null);
  const [profileCounts, setProfileCounts] = useState(null);
  const [clearance, setClearance] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const [c, g, cov, s, r, edu, cert, work, pc] = await Promise.all([
      caregiverVettingService.getClassification(),
      caregiverVettingService.getGuarantors(),
      caregiverVettingService.getAddressHistoryCoverage(),
      caregiverVettingService.getSocialMediaHandles(),
      caregiverVettingService.getReadiness(),
      professionalProfileService.getEducation(),
      professionalProfileService.getCertifications(),
      professionalProfileService.getWorkExperience(),
      policeClearanceService.getStatus(),
    ]);
    setClearance(pc.success ? pc.data : null);
    if (edu.success && cert.success && work.success) {
      setProfileCounts({
        education: (edu.data || []).length,
        certifications: (cert.data || []).length,
        work: (work.data || []).length,
      });
    }
    if (c.success) setClassification(c.data);
    if (g.success) setGuarantors(g.data || []);
    if (cov.success) setCoverage(cov.data);
    if (s.success) setSocialHandles(s.data || []);
    if (r.success) {
      setReadiness(r.data);
      setReadinessError(null);
    } else {
      setReadiness(null);
      setReadinessError(r.error);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const confirmedGuarantors = guarantors.filter((g) => g.status === 'confirmed').length;
  const guarantorsDone = guarantors.length >= REQUIRED_GUARANTOR_COUNT;
  const addressDone = !!coverage?.isComplete;
  const classificationDone = !!classification?.caregiverType;
  const socialDone = socialHandles.length > 0;

  const cardState = (done, attentionCondition) =>
    done ? 'vet-card--done' : attentionCondition ? 'vet-card--attention' : '';

  const identityDone = !!readiness?.isIdentityVerified;
  // const profileTotal = profileCounts ? profileCounts.education + profileCounts.certifications + profileCounts.work : 0;
  // const profileDone = profileTotal > 0;   // now: isProfessionalProfileDone (provisional rule, display only)
  const profileDone = isProfessionalProfileDone(profileCounts);

  // Police clearance card state: none | pending | approved | rejected | revoked (server-computed from the latest record).
  const clearanceStatus = clearance?.status || null;
  const clearanceDone = clearanceStatus === 'approved';
  const requiredFrom = clearance && !clearance.enforced && clearance.enforcementDate
    ? formatLagos(clearance.enforcementDate).replace(/ at .*$/, '')
    : null;

  const badge = (done, text) => (
    <span className={`vet-pkg-badge ${done ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>{text}</span>
  );

  const clearanceStatusNode = (() => {
    if (!clearance) return badge(false, 'Status unavailable');
    const dangerBadge = (text) => <span className="vet-pkg-badge vet-pkg-badge--danger">{text}</span>;
    const reqNote = requiredFrom ? <> <span className="vet-pkg-badge vet-pkg-badge--type">Required from {requiredFrom}</span></> : null;
    switch (clearanceStatus) {
      case 'approved': return badge(true, 'Approved');
      case 'pending': return <>{badge(false, 'Under review')}{reqNote}</>;
      case 'rejected': return <>{dangerBadge('Rejected')}<span className="vet-item-sub" data-testid="hub-clearance-reason"> {clearance.rejectionReason}</span></>;
      case 'revoked': return <>{dangerBadge('Approval withdrawn')}<span className="vet-item-sub" data-testid="hub-clearance-reason"> {clearance.revokedReason}</span></>;
      default: return <>{badge(false, 'Not submitted')}{reqNote}</>;
    }
  })();

  // One entry per step card. To add a step (e.g. police clearance), append an
  // entry here — nothing else in the page needs to change. `core` marks the
  // original four vetting sections used by the fallback "x of 4" summary;
  // identity verification and the professional profile are NOT lockout criteria.
  const steps = [
    {
      key: 'identity',
      title: 'Identity Verification',
      icon: 'fa-fingerprint',
      path: '/app/caregiver/verification',
      done: identityDone,
      status: readiness
        ? badge(identityDone, identityDone ? 'Verified' : 'Not verified yet')
        : badge(false, 'Status unavailable'),
    },
    {
      key: 'professional-profile',
      title: 'Professional Profile',
      icon: 'fa-user-graduate',
      path: `${basePath}/professional-profile`,
      done: profileDone,
      status: profileCounts
        ? badge(profileDone, profileDone
            ? `${profileCounts.education} education · ${profileCounts.certifications} certification${profileCounts.certifications === 1 ? '' : 's'} · ${profileCounts.work} work`
            : 'Not started')
        : badge(false, 'Status unavailable'),
    },
    {
      key: 'classification',
      core: true,
      title: 'Classification',
      icon: 'fa-id-badge',
      path: `${basePath}/classification`,
      done: classificationDone,
      status: classificationDone
        ? <span className="vet-pkg-badge vet-pkg-badge--active">Set: {classification.caregiverType}{classification.specialty ? ` · ${classification.specialty}` : ''}</span>
        : <span className="vet-pkg-badge vet-pkg-badge--inactive">Not set yet</span>,
    },
    {
      key: 'guarantors',
      core: true,
      title: 'Guarantors',
      icon: 'fa-user-shield',
      path: `${basePath}/guarantors`,
      done: guarantorsDone,
      status: guarantors.length === 0 ? (
        <span className="vet-pkg-badge vet-pkg-badge--inactive">None added</span>
      ) : (
        <>
          <span className={`vet-pkg-badge ${guarantorsDone ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
            {guarantors.length} of {REQUIRED_GUARANTOR_COUNT} added
          </span>{' '}
          <span className="vet-pkg-badge vet-pkg-badge--type">{confirmedGuarantors} confirmed</span>
        </>
      ),
    },
    {
      key: 'address-history',
      core: true,
      title: 'Address History',
      icon: 'fa-home',
      path: `${basePath}/address-history`,
      done: addressDone,
      status: coverage ? (
        <span className={`vet-pkg-badge ${addressDone ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
          {addressDone ? '5-year coverage complete' : `${coverage.recordCount} record${coverage.recordCount === 1 ? '' : 's'} · coverage incomplete`}
        </span>
      ) : (
        <span className="vet-pkg-badge vet-pkg-badge--inactive">Not started</span>
      ),
    },
    {
      // Police clearance — uploaded document reviewed by staff. NOT `core`. `done` only when staff have APPROVED it
      // (submitted/under review is not done).
      key: 'police-clearance',
      title: 'Police Clearance',
      icon: 'fa-shield-alt',
      path: `${basePath}/police-clearance`,
      done: clearanceDone,
      status: clearanceStatusNode,
    },
    {
      key: 'social-media',
      core: true,
      title: 'Social Media',
      icon: 'fa-share-alt',
      path: `${basePath}/social-media`,
      done: socialDone,
      status: socialDone
        ? <span className="vet-pkg-badge vet-pkg-badge--active">{socialHandles.length} handle{socialHandles.length === 1 ? '' : 's'} added</span>
        : <span className="vet-pkg-badge vet-pkg-badge--inactive">None added</span>,
    },
  ];

  const completedCount = steps.filter((x) => x.core && x.done).length;
  // Defensive: gigs are retired, so never surface no_active_gig even if an older API still emits it.
  const reasons = (readiness?.ineligibilityReasons || []).filter((r) => r !== 'no_active_gig');

  return (
    <div className="vet-page">
      <div className="vet-header">
        <h1><i className="fas fa-clipboard-check"></i> Caregiver Vetting</h1>
        <p>
          Your overall readiness to work on CarePro depends on identity verification, your
          assessment, and the vetting sections below (classification, guarantors,
          address history, police clearance, social media). This page shows where you stand on all of it.
        </p>
      </div>

      {lock.locked && (
        <div className="vet-alert vet-alert-error" data-testid="hub-lock-notice" role="alert">
          <i className="fas fa-lock"></i>
          <div>
            <p><strong>Your account is limited until you finish {lock.missing.length === 1 ? 'one step' : `${lock.missing.length} steps`}.</strong>{' '}
              Until then you can use this Vetting page, your wallet, settings, messages and notifications.</p>
            <ul style={{ margin: '0.3rem 0 0.5rem 1.1rem', padding: 0 }}>
              {lock.missing.map((m) => <li key={m} data-lock-missing={m}>{MISSING_LABELS[m]}</li>)}
            </ul>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              <strong>Not needed to unlock:</strong> your guarantors confirming, identity verification, your assessment, certificates, or staff
              approval of anything{lock.clearance?.enforced ? ' (including your police clearance)' : ''}. Those can still decide whether you can
              be assigned to clients.
            </p>
          </div>
        </div>
      )}

      {!loading && readiness && (
        readiness.isReady ? (
          <div className="vet-alert vet-alert-success">
            <i className="fas fa-check-circle"></i>
            <div><p>You're fully ready — every readiness check has passed.</p></div>
          </div>
        ) : (
          <div className="vet-panel">
            <div className="vet-panel-header">
              <h2><i className="fas fa-list-check"></i> What's left before you're ready</h2>
            </div>
            {reasons.length === 0 ? (
              <p className="vet-explainer">No outstanding readiness items were reported, but you're not marked ready yet — check back shortly.</p>
            ) : (
              <ul className="vet-list">
                {reasons.map((reasonCode) => {
                  const info = READINESS_REASON_INFO[reasonCode] || {
                    label: reasonCode,
                    description: '',
                    actionLabel: 'Review',
                    actionPath: basePath,
                  };
                  return (
                    <li key={reasonCode} className="vet-item" data-reason={reasonCode}>
                      <div className="vet-item-top">
                        <div>
                          <strong>{info.label}</strong>
                          {info.description && <span className="vet-item-sub">{info.description}</span>}
                        </div>
                        <span className="vet-pkg-badge vet-pkg-badge--inactive">{info.nonActionable ? 'Under review' : 'Not complete'}</span>
                      </div>
                      {!info.nonActionable && (
                        <div className="vet-item-actions">
                          <button className="vet-btn-secondary vet-btn-sm" onClick={() => navigate(info.actionPath)}>
                            {info.actionLabel} <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )
      )}

      {!loading && readiness && (readiness.informationalReasons || []).length > 0 && (
        <div className="vet-alert vet-alert-info" data-testid="hub-informational">
          <i className="fas fa-info-circle"></i>
          <div>
            {(readiness.informationalReasons || []).map((code) => {
              const info = READINESS_REASON_INFO[code];
              if (!info) return null;
              return (
                <p key={code}>
                  <strong>{info.label}.</strong>{' '}
                  {requiredFrom ? `Required from ${requiredFrom}. ` : 'This will become required soon. '}
                  {info.nonActionable ? 'Our team is reviewing it.' : (
                    <button className="vet-back-link" onClick={() => navigate(info.actionPath)}>{info.actionLabel} <i className="fas fa-arrow-right"></i></button>
                  )}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !readiness && (
        <div className="vet-alert vet-alert-info">
          <i className="fas fa-info-circle"></i>
          <div>
            <p>{completedCount} of 4 vetting sections complete.</p>
            {readinessError && <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Couldn't load your full readiness status: {readinessError}</p>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading your vetting status…</p></div>
      ) : (
        <div className="vet-cards">
          {steps.map((step) => (
            <div
              key={step.key}
              data-step={step.key}
              className={`vet-card ${cardState(step.done)}`}
              onClick={() => navigate(step.path)}
            >
              <div className="vet-card-top">
                <div className="vet-card-icon"><i className={`fas ${step.icon}`}></i></div>
                <i className="fas fa-chevron-right vet-card-arrow"></i>
              </div>
              <h3>{step.title}</h3>
              <p className="vet-card-status">{step.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VettingHub;

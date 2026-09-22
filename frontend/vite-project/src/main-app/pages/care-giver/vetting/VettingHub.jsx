import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, {
  REQUIRED_GUARANTOR_COUNT,
  READINESS_REASON_INFO,
} from '../../../services/caregiverVettingService';
import './vetting.css';

const VettingHub = () => {
  const navigate = useNavigate();
  const basePath = '/app/caregiver/vetting';

  const [loading, setLoading] = useState(true);
  const [classification, setClassification] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [socialHandles, setSocialHandles] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const [c, g, cov, s, r] = await Promise.all([
      caregiverVettingService.getClassification(),
      caregiverVettingService.getGuarantors(),
      caregiverVettingService.getAddressHistoryCoverage(),
      caregiverVettingService.getSocialMediaHandles(),
      caregiverVettingService.getReadiness(),
    ]);
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

  const completedCount = [classificationDone, guarantorsDone, addressDone, socialDone].filter(Boolean).length;
  const reasons = readiness?.ineligibilityReasons || [];

  return (
    <div className="vet-page">
      <div className="vet-header">
        <h1><i className="fas fa-clipboard-check"></i> Caregiver Vetting</h1>
        <p>
          Your overall readiness to work on CarePro depends on identity verification, your
          assessment, an active gig, and the vetting sections below (classification, guarantors,
          address history, social media). This page shows where you stand on all of it.
        </p>
      </div>

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
                    <li key={reasonCode} className="vet-item">
                      <div className="vet-item-top">
                        <div>
                          <strong>{info.label}</strong>
                          {info.description && <span className="vet-item-sub">{info.description}</span>}
                        </div>
                        <span className="vet-pkg-badge vet-pkg-badge--inactive">Not complete</span>
                      </div>
                      <div className="vet-item-actions">
                        <button className="vet-btn-secondary vet-btn-sm" onClick={() => navigate(info.actionPath)}>
                          {info.actionLabel} <i className="fas fa-arrow-right"></i>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )
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
          <div
            className={`vet-card ${cardState(classificationDone)}`}
            onClick={() => navigate(`${basePath}/classification`)}
          >
            <div className="vet-card-top">
              <div className="vet-card-icon"><i className="fas fa-id-badge"></i></div>
              <i className="fas fa-chevron-right vet-card-arrow"></i>
            </div>
            <h3>Classification</h3>
            <p className="vet-card-status">
              {classificationDone
                ? <span className="vet-pkg-badge vet-pkg-badge--active">Set: {classification.caregiverType}{classification.specialty ? ` · ${classification.specialty}` : ''}</span>
                : <span className="vet-pkg-badge vet-pkg-badge--inactive">Not set yet</span>}
            </p>
          </div>

          <div
            className={`vet-card ${cardState(guarantorsDone)}`}
            onClick={() => navigate(`${basePath}/guarantors`)}
          >
            <div className="vet-card-top">
              <div className="vet-card-icon"><i className="fas fa-user-shield"></i></div>
              <i className="fas fa-chevron-right vet-card-arrow"></i>
            </div>
            <h3>Guarantors</h3>
            <p className="vet-card-status">
              {guarantors.length === 0 ? (
                <span className="vet-pkg-badge vet-pkg-badge--inactive">None added</span>
              ) : (
                <>
                  <span className={`vet-pkg-badge ${guarantorsDone ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
                    {guarantors.length} of {REQUIRED_GUARANTOR_COUNT} added
                  </span>{' '}
                  <span className="vet-pkg-badge vet-pkg-badge--type">{confirmedGuarantors} confirmed</span>
                </>
              )}
            </p>
          </div>

          <div
            className={`vet-card ${cardState(addressDone)}`}
            onClick={() => navigate(`${basePath}/address-history`)}
          >
            <div className="vet-card-top">
              <div className="vet-card-icon"><i className="fas fa-home"></i></div>
              <i className="fas fa-chevron-right vet-card-arrow"></i>
            </div>
            <h3>Address History</h3>
            <p className="vet-card-status">
              {coverage ? (
                <span className={`vet-pkg-badge ${addressDone ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
                  {addressDone ? '5-year coverage complete' : `${coverage.recordCount} record${coverage.recordCount === 1 ? '' : 's'} · coverage incomplete`}
                </span>
              ) : (
                <span className="vet-pkg-badge vet-pkg-badge--inactive">Not started</span>
              )}
            </p>
          </div>

          <div
            className={`vet-card ${cardState(socialDone)}`}
            onClick={() => navigate(`${basePath}/social-media`)}
          >
            <div className="vet-card-top">
              <div className="vet-card-icon"><i className="fas fa-share-alt"></i></div>
              <i className="fas fa-chevron-right vet-card-arrow"></i>
            </div>
            <h3>Social Media</h3>
            <p className="vet-card-status">
              {socialDone
                ? <span className="vet-pkg-badge vet-pkg-badge--active">{socialHandles.length} handle{socialHandles.length === 1 ? '' : 's'} added</span>
                : <span className="vet-pkg-badge vet-pkg-badge--inactive">None added</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VettingHub;

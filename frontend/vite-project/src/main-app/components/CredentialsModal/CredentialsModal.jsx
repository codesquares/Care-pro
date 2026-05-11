import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CredentialsModal.css';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatPeriod = (startMonth, startYear, endMonth, endYear, ongoingFlag) => {
  const start = `${MONTHS[(startMonth || 1) - 1]} ${startYear}`;
  if (ongoingFlag) return `${start} – Present`;
  if (endMonth && endYear) return `${start} – ${MONTHS[endMonth - 1]} ${endYear}`;
  return start;
};

// ─── Education Tab ────────────────────────────────────────────────────────────
const EducationList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="cred-empty">No education listed yet.</p>;
  }
  return (
    <ul className="cred-list">
      {items.map((item) => (
        <li key={item.id} className="cred-item">
          <div className="cred-item-icon cred-icon-edu">🎓</div>
          <div className="cred-item-body">
            <p className="cred-item-title">{item.schoolName}</p>
            <p className="cred-item-sub">
              {item.degreeType}{item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ''}
            </p>
            <p className="cred-item-period">
              {formatPeriod(item.startMonth, item.startYear, item.endMonth, item.endYear, item.currentlyStudying)}
            </p>
            {item.grade && <p className="cred-item-detail">Grade: {item.grade}</p>}
            {item.activities && <p className="cred-item-detail">{item.activities}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
};

// ─── Certifications Tab ───────────────────────────────────────────────────────
const CertificationsList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="cred-empty">No certifications listed yet.</p>;
  }
  return (
    <ul className="cred-list">
      {items.map((item) => (
        <li key={item.id} className="cred-item">
          <div className="cred-item-icon cred-icon-cert">📜</div>
          <div className="cred-item-body">
            <p className="cred-item-title">{item.certificationName}</p>
            <p className="cred-item-sub">{item.issuingOrganisation}</p>
            <p className="cred-item-period">
              {formatPeriod(item.issueMonth, item.issueYear, item.expiryMonth, item.expiryYear, item.doesNotExpire)}
              {item.doesNotExpire && ' · No expiry'}
            </p>
            {item.credentialId && (
              <p className="cred-item-detail">ID: {item.credentialId}</p>
            )}
            {item.credentialUrl && (
              <a
                className="cred-item-link"
                href={item.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Verify credential ↗
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

// ─── Work Experience Tab ──────────────────────────────────────────────────────
const WorkExperienceList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="cred-empty">No work experience listed yet.</p>;
  }
  return (
    <ul className="cred-list">
      {items.map((item) => (
        <li key={item.id} className="cred-item">
          <div className="cred-item-icon cred-icon-work">💼</div>
          <div className="cred-item-body">
            <p className="cred-item-title">{item.jobTitle}</p>
            <p className="cred-item-sub">
              {item.organisationName}
              {item.employmentType ? ` · ${item.employmentType}` : ''}
              {item.industry ? ` · ${item.industry}` : ''}
            </p>
            <p className="cred-item-period">
              {formatPeriod(item.startMonth, item.startYear, item.endMonth, item.endYear, item.currentlyWorkingHere)}
            </p>
            {item.location && <p className="cred-item-detail">📍 {item.location}</p>}
            {item.description && <p className="cred-item-desc">{item.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const CredentialsModal = ({
  isOpen,
  onClose,
  activeTab,          // 'education' | 'certifications' | 'experience'
  onTabChange,
  education = [],
  certifications = [],
  workExperience = [],
  caregiverName = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'education', label: 'Education', count: education.length },
    { key: 'certifications', label: 'Qualifications', count: certifications.length },
    { key: 'experience', label: 'Experience', count: workExperience.length },
  ];

  return createPortal(
    <div className="cred-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cred-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cred-header">
          <div>
            <h2 className="cred-title">Professional Profile</h2>
            {caregiverName && <p className="cred-subtitle">{caregiverName}</p>}
          </div>
          <button className="cred-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="cred-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`cred-tab${activeTab === tab.key ? ' cred-tab--active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && <span className="cred-tab-badge">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="cred-body">
          {activeTab === 'education' && <EducationList items={education} />}
          {activeTab === 'certifications' && <CertificationsList items={certifications} />}
          {activeTab === 'experience' && <WorkExperienceList items={workExperience} />}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CredentialsModal;

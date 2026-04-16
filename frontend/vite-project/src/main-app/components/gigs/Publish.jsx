
import { useNavigate } from 'react-router-dom';
import { isSpecializedCategory, isSpecializedSubcategory, getSpecializedRequirements, SERVICE_TIERS, toServiceKey } from '../../constants/serviceClassification';
import './publishGig.css';

const PublishGig = ({ 
  onSaveAsDraft, 
  onPublish, 
  image, 
  title, 
  onPrev, 
  onNext, 
  onFieldFocus, 
  onFieldBlur, 
  onFieldHover, 
  onFieldLeave, 
  validationErrors = {},
  canPublish = true,
  activeGigsCount = 0,
  isEditingPublishedGig = false,
  isLoadingGigs = false,
  isSaving = false,
  caregiverStatus = null,
  selectedCategory = '',
  selectedSubcategories = [],
  categoryEligibility = null,
}) => {
  const navigate = useNavigate();
  // Determine if this gig involves specialized services
  const categoryIsSpecialized = isSpecializedCategory(selectedCategory);
  const hasSpecializedSubcategories = !categoryIsSpecialized && selectedSubcategories?.some(
    (sub) => isSpecializedSubcategory(selectedCategory, sub)
  );
  const requiresSpecialization = categoryIsSpecialized || hasSpecializedSubcategories;
  const specialReqs = categoryIsSpecialized ? getSpecializedRequirements(selectedCategory) : null;
  // Determine UI text based on gig status for idempotent behavior
  const isUpdatingPublishedGig = isEditingPublishedGig;
  const headerText = isUpdatingPublishedGig ? 'Update your gig' : 'Ready to publish your gig?';
  const descriptionText = isUpdatingPublishedGig
    ? 'Update your gig details. Your gig will remain published and visible to clients.'
    : 'You can save your gig as a draft or publish now and start receiving orders.';
  const buttonText = isUpdatingPublishedGig ? 'Update Gig' : 'Publish Gig';
  const savingText = isUpdatingPublishedGig ? 'Updating...' : 'Publishing...';

  return (
    <div className="publish-gig">
      <div className="publish-gig-container">
        <div className="publish-gig-main">
          <div className="publish-gig-header">
            <h2>{headerText}</h2>
            <p>
              {descriptionText}
            </p>
            {isLoadingGigs && (
              <p className="loading-message">Checking your current gigs...</p>
            )}
            {!isLoadingGigs && !canPublish && !isEditingPublishedGig && (
              <div className="gig-limit-warning">
                {activeGigsCount >= 2 ? (
                  <p>⚠️ You already have 2 active gigs (the maximum allowed). Please pause one of your active gigs to publish this one, or save as draft for now.</p>
                ) : caregiverStatus && (
                  <div>
                    <p>⚠️ To publish gigs, you need to complete the following requirements:</p>
                    <ul className="eligibility-checklist">
                      <li className={caregiverStatus.isVerified ? 'completed' : 'pending'}>
                        {caregiverStatus.isVerified ? '✅' : '❌'} Complete identity verification
                      </li>
                      <li className={caregiverStatus.isQualified ? 'completed' : 'pending'}>
                        {caregiverStatus.isQualified ? '✅' : '❌'} Pass qualification assessment
                      </li>
                      <li className={caregiverStatus.hasCertificates ? 'completed' : 'pending'}>
                        {caregiverStatus.hasCertificates ? '✅' : '❌'} Upload at least one certificate
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!isLoadingGigs && activeGigsCount >= 0 && (
              <p className="gig-count-info">
                Active gigs: {activeGigsCount}/2
                {isEditingPublishedGig && " (editing published gig)"}
              </p>
            )}

            {/* Specialized Category Requirements — data-driven */}
            {requiresSpecialization && (() => {
              const svcKey = toServiceKey(selectedCategory);
              // categories may be array or object — handle both
              let elig = null;
              if (Array.isArray(categoryEligibility?.categories)) {
                elig = categoryEligibility.categories.find(c => c.serviceCategory === svcKey) || null;
              } else if (categoryEligibility?.categories) {
                elig = categoryEligibility.categories[svcKey] || null;
              }
              const isEligible = elig?.isEligible;
              const assessmentPassed = elig?.assessmentPassed;
              const certValid = elig?.certificatesVerified;
              const missingCerts = elig?.missingCertificates || [];
              const hasCooldown = elig?.cooldownUntil && new Date(elig.cooldownUntil) > new Date();

              return (
                <div className={`specialized-requirements-section ${isEligible ? 'sr-eligible' : ''}`}>
                  <div className="specialized-requirements-header">
                    <span className="notice-icon">{isEligible ? '✅' : '🔒'}</span>
                    <h4>Specialized Service Requirements</h4>
                  </div>

                  {isEligible ? (
                    <p className="specialized-requirements-desc sr-pass-msg">
                      You are fully eligible to publish in "{selectedCategory}".
                    </p>
                  ) : (
                    <>
                      <p className="specialized-requirements-desc">
                        {categoryIsSpecialized
                          ? `"${selectedCategory}" is a specialized category.`
                          : 'Your selected subcategories include specialized services.'}
                        {' '}Publishing requires additional qualifications:
                      </p>
                      <ul className="eligibility-checklist specialized-checklist">
                        <li className={assessmentPassed ? 'completed' : 'pending'}>
                          {assessmentPassed ? '✅' : '📋'} Specialized assessment
                          {elig?.assessmentScore != null && (
                            <span className="ed-score-inline"> — {elig.assessmentScore}%</span>
                          )}
                          {!assessmentPassed && !hasCooldown && (
                            <button
                              type="button"
                              className="ed-action-link inline-link"
                              onClick={() => navigate(`/app/caregiver/specialized-assessment?category=${svcKey}`)}
                            >
                              Take Assessment →
                            </button>
                          )}
                          {hasCooldown && (
                            <span className="ed-cooldown-inline">
                              ⏳ Retake at {new Date(elig.cooldownUntil).toLocaleString()}
                            </span>
                          )}
                        </li>
                        <li className={certValid ? 'completed' : 'pending'}>
                          {certValid ? '✅' : '📄'} Certificates verified
                          {missingCerts.length > 0 && (
                            <span className="ed-missing-inline">
                              — Missing: {missingCerts.join(', ')}
                            </span>
                          )}
                          {!certValid && (
                            <button
                              type="button"
                              className="ed-action-link inline-link"
                              onClick={() => navigate('/app/caregiver/profile')}
                            >
                              Upload →
                            </button>
                          )}
                        </li>
                        {specialReqs?.requiredCertificates && (
                          <li className="pending">
                            🏥 Required certificates: {specialReqs.requiredCertificates.join(', ')}
                          </li>
                        )}
                      </ul>
                      <p className="specialized-cta-note">
                        You can still save this gig as a draft and complete these requirements later.
                      </p>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <div className="validation-summary">
              <h4>Please fix the following errors before publishing:</h4>
              <ul>
                {Object.entries(validationErrors).map(([key, error]) => (
                  <li key={key} className="validation-error">
                    {typeof error === 'object' ? 
                      Object.entries(error).map(([subKey, subError]) => (
                        <div key={`${key}-${subKey}`}>
                          {key.charAt(0).toUpperCase() + key.slice(1)} {subKey}: {subError}
                        </div>
                      )) : 
                      error
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="publish-gig-buttons">
            {/* Only show "Save as Draft" for new gigs or drafts - prevents unpublishing active gigs */}
            {!isEditingPublishedGig && (
              <button 
                className={`draft-button ${isSaving ? 'disabled' : ''}`}
                onClick={onSaveAsDraft}
                onMouseEnter={(e) => onFieldHover && onFieldHover('publish-save-draft', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
            )}
            <button 
              className={`publish-button ${!canPublish || isLoadingGigs || isSaving ? 'disabled' : ''}`}
              onClick={onPublish}
              onMouseEnter={(e) => onFieldHover && onFieldHover('publish-gig', e)}
              onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
              disabled={Object.keys(validationErrors).length > 0 || !canPublish || isLoadingGigs || isSaving}
              title={!canPublish ? 'You can only have 2 active gigs. Pause an active gig first.' : ''}
            >
              {isLoadingGigs ? 'Loading...' : isSaving ? savingText : buttonText}
            </button>
          </div>
        </div>

        <div className="publish-gig-sidebar">
          <div className="publish-card">
            <div className="publish-card-image">
              <img src={image} alt={title} />
            </div>
            <div className="publish-card-bottom">
              <p className="publish-card-title">{title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishGig;

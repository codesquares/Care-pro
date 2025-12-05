
import "./publishGig.scss";

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
  isSaving = false, // Add isSaving prop
  caregiverStatus = null // Add caregiver status for detailed messaging
}) => {
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
                className="draft-button" 
                onClick={onSaveAsDraft}
                onMouseEnter={(e) => onFieldHover && onFieldHover('publish-save-draft', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
              >
                Save as Draft
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

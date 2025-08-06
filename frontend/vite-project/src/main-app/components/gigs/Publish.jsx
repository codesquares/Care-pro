import React from "react";
import "./publishGig.scss";

const PublishGig = ({ onSaveAsDraft, onPublish, image, title, onPrev, onNext, onFieldFocus, onFieldBlur, onFieldHover, onFieldLeave, validationErrors = {} }) => {
  return (
    <div className="publish-gig">
      <div className="publish-gig-container">
        <div className="publish-gig-main">
          <div className="publish-gig-header">
            <h2>Ready to publish your gig?</h2>
            <p>
              You can save your gig as a draft or publish now and start receiving orders.
            </p>
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
            <button 
              className="draft-button" 
              onClick={onSaveAsDraft}
              onMouseEnter={(e) => onFieldHover && onFieldHover('publish-save-draft', e)}
              onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
            >
              Save as Draft
            </button>
            <button 
              className="publish-button" 
              onClick={onPublish}
              onMouseEnter={(e) => onFieldHover && onFieldHover('publish-gig', e)}
              onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
              disabled={Object.keys(validationErrors).length > 0}
            >
              Publish Gig
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

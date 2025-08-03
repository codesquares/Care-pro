import React from "react";
import "./publishGig.scss";

const PublishGig = ({ onSaveAsDraft, onPublish, image, title, onPrev, onNext, onFieldFocus, onFieldBlur, onFieldHover, onFieldLeave, validationErrors = {} }) => {
  return (
    <div className="publish-gig">
      <div className="publish-gig-main">
        <h2>Do you want to publish your gig now?</h2>
        <p>
          You can save your gig as a draft or publish now and start getting orders placed.
        </p>
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
            Publish
          </button>
        </div>
      </div>
      <div className="publish-gig-sidebar">
          {/* Image Section */}
      <div className="publish-card-image">
        <img src={image} alt={title} />
      </div>

      {/* Text and Controls Section */}
      <div className="publish-card-bottom">
        <p className="publish-card-title">{title}</p>
        {/* <div className="publish-card-controls">
          <button className="control-button" onClick={onPrev}>
            &#10094;
          </button>
          <div className="dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <button className="control-button" onClick={onNext}>
            &#10095;
          </button>
        </div> */}
      </div>
      </div>
    </div>

  );
};

export default PublishGig;

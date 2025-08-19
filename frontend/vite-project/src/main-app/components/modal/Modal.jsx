import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  title, 
  description, 
  buttonText, 
  buttonBgColor, 
  isEmailVerification = false,
  secondaryButtonText,
  onSecondaryAction
}) => {
  if (!isOpen) return null;

  // Function to format description with email highlighting
  const formatDescription = (text) => {
    // Replace **text** with <strong>text</strong> for email highlighting
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className="success-icon">
          {isEmailVerification ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path
                fill="#34A853"
                d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path
                fill="#34A853"
                d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.09 18.18l-5.65-5.65 1.41-1.41 4.24 4.24 7.07-7.07 1.41 1.41-8.48 8.48z"
              />
            </svg>
          )}
        </div>
        <h2 className="title">{title}</h2>
        <p 
          className="description" 
          dangerouslySetInnerHTML={{ __html: formatDescription(description) }}
        />
        <div className="modal-actions">
          <button
            className="proceed-button"
            onClick={onProceed}
            style={{ backgroundColor: buttonBgColor }}
          >
            {buttonText}
          </button>
          {secondaryButtonText && onSecondaryAction && (
            <button
              className="secondary-button"
              onClick={onSecondaryAction}
            >
              {secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

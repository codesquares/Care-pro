import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, onProceed, title, description, buttonText, buttonBgColor }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
            <path
              fill="#34A853"
              d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.09 18.18l-5.65-5.65 1.41-1.41 4.24 4.24 7.07-7.07 1.41 1.41-8.48 8.48z"
            />
          </svg>
        </div>
        <h2 className="title">{title}</h2>
        <p className="description">{description}</p>
        <button
          className="proceed-button"
          onClick={onProceed}
          style={{ backgroundColor: buttonBgColor }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Modal;

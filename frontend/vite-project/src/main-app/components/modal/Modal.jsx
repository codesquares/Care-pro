
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
  onSecondaryAction,
  isError = false
}) => {
  if (!isOpen) return null;

  // Function to format description with email highlighting
  const formatDescription = (text) => {
    // Replace **text** with <strong>text</strong> for email highlighting
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Determine icon type based on context
  const getIconType = () => {
    if (isError) return 'error';
    if (isEmailVerification) return 'email';
    return 'success';
  };

  const renderIcon = () => {
    const iconType = getIconType();
    
    if (iconType === 'error') {
      return (
        <div className="icon-container error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="56" height="56">
            <path
              fill="#ffffff"
              d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 13H6v-2h12v2z"
            />
          </svg>
        </div>
      );
    } else if (iconType === 'email') {
      return (
        <div className="icon-container email-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="56" height="56">
            <path
              fill="#ffffff"
              d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
            />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="icon-container success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="56" height="56">
            <path
              fill="#ffffff"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#999" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <div className="modal-content">
          {renderIcon()}
          <h2 className="modal-title">{title}</h2>
          <div 
            className="modal-description" 
            dangerouslySetInnerHTML={{ __html: formatDescription(description) }}
          />
          
          <div className="modal-actions">
            <button
              className="primary-button"
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
    </div>
  );
};

export default Modal;

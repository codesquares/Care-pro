
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
        <div className="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="35" fill="#FF4B4B"/>
            <path
              fill="#ffffff"
              d="M50 30 L30 50 M30 30 L50 50"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    } else if (iconType === 'email') {
      return (
        <div className="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="35" fill="#00B4A6"/>
            <path
              fill="#ffffff"
              d="M20 25h40c2 0 4 2 4 4v22c0 2-2 4-4 4H20c-2 0-4-2-4-4V29c0-2 2-4 4-4z M20 29l20 12 20-12"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
            <defs>
              <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#14b8a6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="55" fill="url(#checkGradient)"/>
            <path
              fill="none"
              d="M35 60 L52 77 L85 40"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
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


import './ServiceSelectionModal.css';
import Modal from '../modal/Modal';
import { useState } from 'react';

const ServiceSelectionModal = ({ 
  isOpen, 
  onClose, 
  services, 
  caregiverName, 
  onSelectService,
  isLoading 
}) => {
  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);
  const [secondaryButtonText, setSecondaryButtonText] = useState('');
  const [showSecondaryButton, setShowSecondaryButton] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectService = (service) => {
    try {
      onSelectService(service);
      
      // Show success modal
      setModalTitle('Service Selected!');
      setModalDescription(`You've selected "${service.title}" from ${caregiverName}. You will be redirected to the service page to complete your booking.`);
      setButtonText('Continue');
      setButtonBgColor('#00B4A6');
      setIsError(false);
      setShowSecondaryButton(false);
      setIsModalOpen(true);
      
      // Close the main modal after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Error selecting service:', error);
      
      // Show error modal
      setModalTitle('Selection Failed');
      setModalDescription('Failed to select the service. Please try again or contact support if the issue persists.');
      setButtonText('Try Again');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setShowSecondaryButton(false);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="service-selection-modal-backdrop" onClick={handleBackdropClick}>
      <div className="service-selection-modal">
        <div className="modal-header">
          <h3>Select a service from {caregiverName}</h3>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <h4>No services available</h4>
              <p>This caregiver doesn't have any published services at the moment.</p>
              <button 
                className="contact-caregiver-btn"
                onClick={() => {
                  setModalTitle('Contact Caregiver');
                  setModalDescription(`Since ${caregiverName} doesn't have published services, you can send them a direct message to discuss your care needs and potential services.`);
                  setButtonText('Send Message');
                  setButtonBgColor('#00B4A6');
                  setIsError(false);
                  setSecondaryButtonText('Close');
                  setShowSecondaryButton(true);
                  setIsModalOpen(true);
                }}
              >
                Contact {caregiverName}
              </button>
            </div>
          ) : (
            <div className="services-grid">
              {services.map((service) => (
                <div key={service.id} className="service-card" onClick={() => handleSelectService(service)}>
                  <div className="service-image">
                    {service.gigImage ? (
                      <img src={service.gigImage} alt={service.title} />
                    ) : (
                      <div className="service-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21,15 16,10 5,21"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="service-details">
                    <h4 className="service-title">{service.title}</h4>
                    <p className="service-description">{service.description}</p>
                    
                    <div className="service-meta">
                      <div className="service-price">
                        <span className="price-label">Price:</span>
                        <span className="price-value">₦{service.price?.toLocaleString()}</span>
                      </div>
                      
                      {service.caregiverRating > 0 && (
                        <div className="service-rating">
                          <div className="stars">
                            {Array.from({ length: 5 }, (_, i) => (
                              <svg
                                key={i}
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill={i < Math.floor(service.caregiverRating) ? "#ffd700" : "none"}
                                stroke="#ffd700"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                              </svg>
                            ))}
                          </div>
                          <span className="rating-text">
                            {service.caregiverRating.toFixed(1)} ({service.caregiverReviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button className="select-service-btn">
                      Choose This Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      {/* Standardized Modal Component for Success/Error Feedback */}
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isError={isError}
        secondaryButtonText={secondaryButtonText}
        showSecondaryButton={showSecondaryButton}
        onProceed={() => {
          setIsModalOpen(false);
          if (modalTitle === 'Contact Caregiver') {
            // Close the service selection modal and let user send message
            onClose();
          }
        }}
        onSecondary={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default ServiceSelectionModal;

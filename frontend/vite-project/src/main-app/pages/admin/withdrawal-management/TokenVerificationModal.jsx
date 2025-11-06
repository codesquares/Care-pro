import { useState } from 'react';
import './TokenVerificationModal.css';
import Modal from '../../../components/modal/Modal';

const TokenVerificationModal = ({ withdrawal, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  
  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);
  
  const getModalTitle = () => {
    switch (withdrawal.status.toLowerCase()) {
      case 'pending':
        return 'Verify Withdrawal Request';
      case 'verified':
        return 'Complete Withdrawal Request';
      default:
        return 'Withdrawal Request';
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleAction = (action) => {
    setActiveAction(action);
    
    if (action === 'complete' && withdrawal.status === 'Verified') {
      try {
        onSubmit('complete', {});
        
        // Show success modal for completion
        setModalTitle('Withdrawal Completed!');
        setModalDescription(`Withdrawal of ${formatCurrency(withdrawal.finalAmount)} for ${withdrawal.caregiverName} has been marked as completed successfully.`);
        setButtonText('Close');
        setButtonBgColor('#00B4A6');
        setIsError(false);
        setIsModalOpen(true);
        
      } catch (error) {
        console.error('Completion error:', error);
        
        // Show error modal
        setModalTitle('Completion Failed');
        setModalDescription('Failed to complete the withdrawal request. Please try again.');
        setButtonText('Try Again');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeAction === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    try {
      onSubmit(activeAction, { notes });
      
      // Show success modal based on action type
      if (activeAction === 'verify') {
        setModalTitle('Request Verified!');
        setModalDescription(`Withdrawal request for ${withdrawal.caregiverName} has been successfully verified. The request is now ready for completion.`);
        setButtonText('Close');
        setButtonBgColor('#00B4A6');
        setIsError(false);
        setIsModalOpen(true);
        
      } else if (activeAction === 'reject') {
        setModalTitle('Request Rejected');
        setModalDescription(`Withdrawal request for ${withdrawal.caregiverName} has been rejected. The caregiver will be notified.`);
        setButtonText('Close');
        setButtonBgColor('#FF4B4B');
        setIsError(false);
        setIsModalOpen(true);
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      
      // Show error modal
      setModalTitle('Action Failed');
      setModalDescription(`Failed to ${activeAction} the withdrawal request. Please try again.`);
      setButtonText('Try Again');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
    }
  };

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (!isError) {
      onClose(); // Close the verification modal on success
    }
    // Reset active action state
    setActiveAction(null);
    setError('');
  };

  return (
    <div className="token-verification-modal-overlay">
      <div className="token-verification-modal">
        <div className="modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="withdrawal-details">
          <div className="detail-row">
            <span className="label">Caregiver:</span>
            <span className="value">{withdrawal.caregiverName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Amount Requested:</span>
            <span className="value">{formatCurrency(withdrawal.amountRequested)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Service Charge:</span>
            <span className="value">{formatCurrency(withdrawal.serviceCharge)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Final Amount:</span>
            <span className="value final-amount">{formatCurrency(withdrawal.finalAmount)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Bank Name:</span>
            <span className="value">{withdrawal.bankName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Account Number:</span>
            <span className="value">{withdrawal.accountNumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Account Name:</span>
            <span className="value">{withdrawal.accountName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Verification Token:</span>
            <span className="value token">{withdrawal.token}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className={`value status status-${withdrawal.status.toLowerCase()}`}>{withdrawal.status}</span>
          </div>
        </div>
        
        {withdrawal.status === 'Pending' && (
          <div className="action-section">
            {!activeAction ? (
              <div className="action-buttons">
                <button 
                  className="btn verify-btn" 
                  onClick={() => setActiveAction('verify')}
                >
                  Verify Request
                </button>
                <button 
                  className="btn reject-btn" 
                  onClick={() => setActiveAction('reject')}
                >
                  Reject Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Admin Notes:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={activeAction === 'verify' ? 
                      'Optional: Add any notes about this verification' : 
                      'Please provide a reason for rejecting this request'
                    }
                    rows="3"
                  ></textarea>
                  {error && <span className="error">{error}</span>}
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn cancel-btn" 
                    onClick={() => setActiveAction(null)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={`btn ${activeAction === 'verify' ? 'confirm-verify-btn' : 'confirm-reject-btn'}`}
                  >
                    {activeAction === 'verify' ? 'Confirm Verification' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        
        {withdrawal.status === 'Verified' && (
          <div className="action-section">
            <div className="action-buttons">
              <button 
                className="btn complete-btn" 
                onClick={() => handleAction('complete')}
              >
                Mark as Completed
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Standardized Modal Component for Success/Error Feedback */}
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isError={isError}
        onProceed={handleModalProceed}
      />
    </div>
  );
};

export default TokenVerificationModal;

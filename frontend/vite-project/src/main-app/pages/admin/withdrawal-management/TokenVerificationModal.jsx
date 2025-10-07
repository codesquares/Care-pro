import { useState } from 'react';
import './TokenVerificationModal.css';

const TokenVerificationModal = ({ withdrawal, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  
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
      onSubmit('complete', {});
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (activeAction === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    onSubmit(activeAction, { notes });
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
    </div>
  );
};

export default TokenVerificationModal;

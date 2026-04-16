import { useState, useEffect } from 'react';
import './TokenVerificationModal.css';
import Modal from '../../../components/modal/Modal';
import caregiverBankAccountService from '../../../services/caregiverBankAccountService';

const TokenVerificationModal = ({ withdrawal, onClose, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch financial summary when modal opens
  useEffect(() => {
    const fetchSummary = async () => {
      const caregiverId = withdrawal?.caregiverId;
      if (!caregiverId) return;
      try {
        setSummaryLoading(true);
        const result = await caregiverBankAccountService.getFinancialSummary(caregiverId);
        if (result.success && result.data) {
          setFinancialSummary(result.data);
        }
      } catch (err) {
        console.error('Error fetching financial summary:', err);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [withdrawal?.caregiverId]);
  
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
  
  const handleAction = async (action) => {
    setActiveAction(action);
    
    if (action === 'complete' && withdrawal.status === 'Verified') {
      setIsSubmitting(true);
      try {
        await onSubmit('complete', {});
        
        // Show success modal for completion
        setModalTitle('Withdrawal Completed!');
        setModalDescription(`Withdrawal of ${formatCurrency(withdrawal.finalAmount)} for ${withdrawal.caregiverName} has been marked as completed successfully.`);
        setButtonText('Close');
        setButtonBgColor('#00B4A6');
        setIsError(false);
        setIsModalOpen(true);
        
      } catch (error) {
        console.error('Completion error:', error?.response?.status, error?.response?.data);
        
        const data = error?.response?.data;
        let msg = data?.errorMessage || data?.title || 'Failed to complete the withdrawal request. Please try again.';
        if (data?.errors) {
          const fieldErrors = Object.values(data.errors).flat().join(' | ');
          if (fieldErrors) msg = fieldErrors;
        }
        
        // Show error modal
        setModalTitle('Completion Failed');
        setModalDescription(msg);
        setButtonText('Try Again');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeAction === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(activeAction, { notes });
      
      // Show success modal based on action type — only reached if API call succeeded
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
      console.error('Submit error:', error?.response?.status, error?.response?.data);
      
      // Extract the most useful error message from .NET or custom backend responses
      const data = error?.response?.data;
      let msg = data?.errorMessage
        || data?.title
        || `Failed to ${activeAction} the withdrawal request. Please try again.`;
      // Append field-level .NET validation errors if present
      if (data?.errors) {
        const fieldErrors = Object.values(data.errors).flat().join(' | ');
        if (fieldErrors) msg = fieldErrors;
      }
      
      // Show error modal with backend message if available
      setModalTitle('Action Failed');
      setModalDescription(msg);
      setButtonText('Try Again');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
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

        {/* Financial Summary Section */}
        {summaryLoading ? (
          <div className="financial-summary-section" style={{ padding: '12px', fontSize: '0.9em', color: '#666' }}>Loading financial summary...</div>
        ) : financialSummary ? (
          <div className="financial-summary-section" style={{ margin: '16px 0', padding: '14px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #d0e3f7' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.95em', color: '#1a3d5c' }}>Caregiver Financial Summary</h4>
            <div className="detail-row">
              <span className="label">Total Earned:</span>
              <span className="value">{formatCurrency(financialSummary.totalEarned ?? 0)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Withdrawable Balance:</span>
              <span className="value" style={{ fontWeight: 600, color: '#27ae60' }}>{formatCurrency(financialSummary.withdrawableBalance ?? 0)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Pending Balance:</span>
              <span className="value">{formatCurrency(financialSummary.pendingBalance ?? 0)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Total Withdrawn:</span>
              <span className="value">{formatCurrency(financialSummary.totalWithdrawn ?? 0)}</span>
            </div>
            {financialSummary.bankAccount ? (
              <>
                <h4 style={{ margin: '10px 0 6px', fontSize: '0.9em', color: '#1a3d5c' }}>Saved Bank Account</h4>
                <div className="detail-row">
                  <span className="label">Bank:</span>
                  <span className="value">{financialSummary.bankAccount.bankName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Account No:</span>
                  <span className="value">{financialSummary.bankAccount.accountNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Account Name:</span>
                  <span className="value">{financialSummary.bankAccount.accountName}</span>
                </div>
              </>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: '0.85em', color: '#999' }}>No saved bank account on file.</p>
            )}
          </div>
        ) : null}
        
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (activeAction === 'verify' ? 'Verifying...' : 'Rejecting...')
                      : (activeAction === 'verify' ? 'Confirm Verification' : 'Confirm Rejection')}
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

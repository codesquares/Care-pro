import { useState } from 'react';
import './WithdrawalModal.css';
import { createNotification } from '../../../services/notificationService';
import Modal from '../../../components/modal/Modal';


const WithdrawalModal = ({ onClose, onSubmit, maxAmount }) => {
  const [formData, setFormData] = useState({
    amountRequested: '',
    accountNumber: '',
    bankName: '',
    accountName: '',
  });
  const userId = JSON.parse(localStorage.getItem('userDetails'))?.id || '';
  const [errors, setErrors] = useState({});

  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate amount
    if (!formData.amountRequested) {
      newErrors.amountRequested = 'Amount is required';
    } else if (isNaN(formData.amountRequested) || parseFloat(formData.amountRequested) <= 0) {
      newErrors.amountRequested = 'Amount must be a positive number';
    } else if (parseFloat(formData.amountRequested) > maxAmount) {
      newErrors.amountRequested = `Amount cannot exceed your withdrawable balance of ${maxAmount}`;
    }
    
    // Validate account number
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{10,}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be at least 10 digits';
    }
    
    // Validate bank name
    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    }
    
    // Validate account name
    if (!formData.accountName) {
      newErrors.accountName = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("withdrawal modal clicked");

    if (validateForm()) {
      try {
        onSubmit({
          ...formData,
          amountRequested: parseFloat(formData.amountRequested)
        });

        // Create notification for the caregiver
        createNotification({
          recipientId: userId,
          senderId: userId,
          type: "withdrawal",
          relatedEntityId: userId,
        }).then(() => {
          console.log("User notification created successfully"); 
        }).catch((error) => {
          console.error("Error creating user notification:", error);
        });

        // Show success modal
        setModalTitle('Withdrawal Request Submitted!');
        setModalDescription(`Your withdrawal request for ${formatCurrency(parseFloat(formData.amountRequested))} has been submitted successfully. Service charge will be calculated and deducted by the system.`);
        setButtonText('Close');
        setButtonBgColor('#00B4A6');
        setIsError(false);
        setIsModalOpen(true);

      } catch (error) {
        console.error('Withdrawal submission error:', error);
        
        // Show error modal
        setModalTitle('Submission Failed');
        setModalDescription('Failed to submit withdrawal request. Please check your details and try again.');
        setButtonText('Try Again');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (!isError) {
      onClose(); // Close the withdrawal modal on success
    }
  };

  return (
    <div className="withdrawal-modal-overlay">
      <div className="withdrawal-modal">
        <div className="modal-header">
          <h2>Request Withdrawal</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="withdrawal-form">
          <div className="form-group">
            <label htmlFor="amountRequested">Amount to Withdraw (₦)</label>
            <input
              type="number"
              id="amountRequested"
              name="amountRequested"
              value={formData.amountRequested}
              onChange={handleInputChange}
              placeholder="Enter amount"
              step="0.01"
              max={maxAmount}
            />
            {errors.amountRequested && <span className="error">{errors.amountRequested}</span>}
            <div className="available-amount">
              Available: {formatCurrency(maxAmount)}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="bankName">Bank Name</label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              placeholder="Enter bank name"
            />
            {errors.bankName && <span className="error">{errors.bankName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="accountNumber">Account Number</label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Enter account number"
            />
            {errors.accountNumber && <span className="error">{errors.accountNumber}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="accountName">Account Name</label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={formData.accountName}
              onChange={handleInputChange}
              placeholder="Enter account name"
            />
            {errors.accountName && <span className="error">{errors.accountName}</span>}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn">Submit Request</button>
          </div>
        </form>
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

export default WithdrawalModal;

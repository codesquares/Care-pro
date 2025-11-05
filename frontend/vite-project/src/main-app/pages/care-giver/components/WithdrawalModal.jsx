import { useState, useEffect } from 'react';
import './WithdrawalModal.css';
import { createNotification } from '../../../services/notificationService';
import config from '../../../config'; // Import centralized config for API URLs


const WithdrawalModal = ({ onClose, onSubmit, maxAmount }) => {
  const [formData, setFormData] = useState({
    amountRequested: '',
    accountNumber: '',
    bankName: '',
    accountName: '',
    token: '' // Assuming token is passed as a prop or set elsewhere
  });
  const userId = JSON.parse(localStorage.getItem('userDetails'))?.id || ''; // Get user ID from local storage
  const [errors, setErrors] = useState({});
  const [serviceCharge, setServiceCharge] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [adminData, setAdminData] = useState({});
  const [admin, setAdmin] = useState({
    id: "",
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  
 useEffect(() => {
   const token = localStorage.getItem('authToken'); // Get token from local storage
   setFormData((prevData) => ({
     ...prevData,
     token: token || ''
   }));
 }, []);

 useEffect(() => {
  //load admin id to send notification
  const getAdmin = async () => {
    try{
      // Use centralized config instead of hardcoded URL for consistent API routing
      const response = await fetch(`${config.BASE_URL}/Admins/AllAdminUsers`); // Assuming admin ID is 1
      if (!response.ok) {
        throw new Error('Failed to fetch admin ID');
      }
      const data = await response.json();
      setAdminData(data)
      return data; // Assuming the admin ID is in the 'id' field
    }
    catch (error) {
      console.error('Error fetching admin ID:', error);
      return null; // Return null or handle the error as needed
  }
  };
  getAdmin().then((data) => {
    if (data && data.length > 0) {
      const admin = data[0]; // Assuming the first admin is the one we want
      setAdmin({
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber
      });
    }
  });
 }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Calculate service charge and final amount when amount changes
    if (name === 'amountRequested' && !isNaN(value) && value > 0) {
      const amount = parseFloat(value);
      const charge = amount * 0.2; // 20% service charge
      setServiceCharge(charge);
      setFinalAmount(amount - charge);
    } else if (name === 'amountRequested') {
      setServiceCharge(0);
      setFinalAmount(0);
    }
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

    if (!formData.token) {
      newErrors.token = 'Token is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("withdrawal modal clicked");

    if (validateForm()) {
      onSubmit({
        ...formData,
        amountRequested: parseFloat(formData.amountRequested)
      });
      createNotification({
                recipientId: adminData?.id ? admin.id : null, // Assuming admin ID is available
            
                senderId: userId,
                type: "withdrawal",
                relatedEntityId: userId, // Assuming you have a withdrawal ID
              }).then(() => {
                console.log("Notification created successfully"); 
              }).catch((error) => {
                console.error("Error creating notification:", error);
              });
        createNotification({
                recipientId: userId, // Assuming user ID is available
                
                senderId: userId,
                type: "withdrawal",
                relatedEntityId: userId, // Assuming you have a withdrawal ID
              }).then(() => {
                console.log("Notification created successfully"); 
              })
              .catch((error) => {
                console.error("Error creating notification:", error);
              });
      
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
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
          
          {formData.amountRequested && !isNaN(formData.amountRequested) && formData.amountRequested > 0 && (
            <div className="fee-breakdown">
              <div className="breakdown-row">
                <span>Amount Requested:</span>
                <span>{formatCurrency(parseFloat(formData.amountRequested))}</span>
              </div>
              <div className="breakdown-row">
                <span>Service Charge (10%):</span>
                <span>-{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="breakdown-row total">
                <span>Final Amount:</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          )}
          
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
    </div>
  );
};

export default WithdrawalModal;

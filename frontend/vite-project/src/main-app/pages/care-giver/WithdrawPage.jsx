import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { withdrawalService } from '../../services/withdrawalService';
import walletService from '../../services/walletService';
import caregiverBankAccountService from '../../services/caregiverBankAccountService';
import { createNotification } from '../../services/notificationService';
import './withdraw-page.css';

const WithdrawPage = () => {
  const [wallet, setWallet] = useState({
    withdrawableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
  });
  const [formData, setFormData] = useState({
    caregiverId: '',
    amountRequested: '',
    accountNumber: '',
    bankName: '',
    accountName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('userDetails')) || {};

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      
      // Load wallet summary from the Wallet API (single source of truth)
      const walletResult = await walletService.getWalletSummary(currentUser.id);
      if (walletResult.success && walletResult.data) {
        setWallet({
          withdrawableBalance: walletResult.data.withdrawableBalance ?? 0,
          pendingBalance: walletResult.data.pendingBalance ?? 0,
          totalEarned: walletResult.data.totalEarned ?? 0,
          totalWithdrawn: walletResult.data.totalWithdrawn ?? 0,
        });
      }

      // Check for pending withdrawals via dedicated endpoint
      const hasPending = await withdrawalService.hasPendingWithdrawal(currentUser.id);
      setHasPendingWithdrawal(hasPending);

      // Pre-fill bank details from saved bank account
      try {
        const bankResult = await caregiverBankAccountService.getBankAccount(currentUser.id);
        if (bankResult.success && bankResult.data) {
          setFormData((prev) => ({
            ...prev,
            bankName: prev.bankName || bankResult.data.bankName || '',
            accountNumber: prev.accountNumber || bankResult.data.accountNumber || '',
            accountName: prev.accountName || bankResult.data.accountName || '',
          }));
        }
      } catch (bankErr) {
        console.error('Error fetching saved bank account:', bankErr);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchWalletData();
    }
  }, [currentUser.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear errors for the field being edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate amount
    if (!formData.amountRequested) {
      newErrors.amountRequested = 'Enter Withdrawal Amount';
    } else if (isNaN(formData.amountRequested) || parseFloat(formData.amountRequested) <= 0) {
      newErrors.amountRequested = 'Amount must be a positive number';
    } else if (parseFloat(formData.amountRequested) > wallet.withdrawableBalance) {
      newErrors.amountRequested = `Amount cannot exceed your withdrawable balance`;
    }
    
    // Validate bank name
    if (!formData.bankName) {
      newErrors.bankName = 'Select Bank';
    }
    
    // Validate account number
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Enter Account Number';
    } else if (!/^\d{10,}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be at least 10 digits';
    }
    
    // Validate account name
    if (!formData.accountName) {
      newErrors.accountName = 'Enter Account Name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (hasPendingWithdrawal) {
      alert("You already have a pending withdrawal request. Please wait for it to be processed before making another request.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const withdrawalRequestData = {
        caregiverId: currentUser.id,
        amountRequested: parseFloat(formData.amountRequested),
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        accountName: formData.accountName,
      };
      
      await withdrawalService.createWithdrawalRequest(withdrawalRequestData);

      // Refetch wallet data so balances update immediately
      await fetchWalletData();

      // Create notification for admin
      try {
        await createNotification({
          userId: currentUser.id, // Admin will be set on backend
          message: `New withdrawal request from ${currentUser.firstName} ${currentUser.lastName} for ${formatCurrency(formData.amountRequested)}`,
          type: 'withdrawal_request'
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
      }
      
      alert("Withdrawal request submitted successfully!");
      navigate('/app/caregiver/earnings');
      
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      alert(err.response?.data?.errorMessage || "Failed to submit withdrawal request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="withdraw-page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="withdraw-page-container">
      <div className="withdraw-header">
        <Link to="/app/caregiver/earnings" className="back-link">
          ← Back
        </Link>
        <h1 className="withdraw-title">Withdraw Earnings</h1>
      </div>

      <div className="withdraw-content">
        <form onSubmit={handleSubmit} className="withdraw-form">
          <div>
            <h4 className="form-title">Withdrawable Balance</h4>
            <p className="form-subtitle">{formatCurrency(wallet.withdrawableBalance)}</p>
            {wallet.pendingBalance > 0 && (
              <p className="form-pending-balance">
                Pending Balance: {formatCurrency(wallet.pendingBalance)}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="amountRequested" className="form-label">
              Enter Withdrawal Amount
            </label>
            <div className="input-wrapper">
              <input
                type="number"
                id="amountRequested"
                name="amountRequested"
                value={formData.amountRequested}
                onChange={handleInputChange}
                className={`form-input ${errors.amountRequested ? 'error' : ''}`}
                placeholder="Enter amount"
                step="0.01"
                max={wallet.withdrawableBalance}
              />
              {errors.amountRequested && (
                <span className="error-text">{errors.amountRequested}</span>
              )}
            </div>
          </div>

          <div className="recipient-section">
            <h3 className="section-title">Recipient Account</h3>
            
            <div className="withdraw-form-row">
              <div className="form-group">
                <label htmlFor="bankName" className="form-label">
                  Select Bank
                </label>
                <div className="input-wrapper">
                  <select
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className={`form-input form-select ${errors.bankName ? 'error' : ''}`}
                  >
                    <option value="">Select Bank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="Guaranty Trust Bank">Guaranty Trust Bank</option>
                    <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                    <option value="United Bank for Africa">United Bank for Africa</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="Fidelity Bank">Fidelity Bank</option>
                    <option value="Sterling Bank">Sterling Bank</option>
                    <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                    <option value="Union Bank of Nigeria">Union Bank of Nigeria</option>
                    <option value="Wema Bank">Wema Bank</option>
                    <option value="Ecobank Nigeria">Ecobank Nigeria</option>
                    <option value="Heritage Bank">Heritage Bank</option>
                    <option value="Keystone Bank">Keystone Bank</option>
                    <option value="Polaris Bank">Polaris Bank</option>
                    <option value="Unity Bank">Unity Bank</option>
                    <option value="Citibank Nigeria">Citibank Nigeria</option>
                    <option value="Standard Chartered Bank">Standard Chartered Bank</option>
                    <option value="Providus Bank">Providus Bank</option>
                    <option value="Kuda Bank">Kuda Bank</option>
                    <option value="Opay">Opay</option>
                    <option value="PalmPay">PalmPay</option>
                  </select>
                  {errors.bankName && (
                    <span className="error-text">{errors.bankName}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber" className="form-label">
                  Enter Account Number
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className={`form-input ${errors.accountNumber ? 'error' : ''}`}
                    placeholder="Account Number"
                  />
                  {errors.accountNumber && (
                    <span className="error-text">{errors.accountNumber}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="accountName" className="form-label">
                Enter Account Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.accountName ? 'error' : ''}`}
                  placeholder="Account Name"
                />
                {errors.accountName && (
                  <span className="error-text">{errors.accountName}</span>
                )}
              </div>
            </div>
          </div>

          {formData.amountRequested && parseFloat(formData.amountRequested) > 0 && (
            <div className="calculation-summary">
              <div className="calculation-row">
                <span>Amount Requested:</span>
                <span>{formatCurrency(parseFloat(formData.amountRequested))}</span>
              </div>
              <p className="charge-note">
                Service charge will be calculated and deducted by the system.
              </p>
            </div>
          )}

          <div className="processing-info">
            <div className="info-icon">⚠️</div>
            <p>Kindly note that withdrawals from carepro would be processed by the 15th and 30th of each month.</p>
          </div>

          <button 
            type="submit" 
            className="withdraw-submit-btn"
            disabled={isSubmitting || hasPendingWithdrawal}
          >
            {isSubmitting ? 'Processing...' : 'Withdraw Earnings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WithdrawPage;

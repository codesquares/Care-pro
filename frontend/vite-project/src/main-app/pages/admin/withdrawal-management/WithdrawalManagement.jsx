import React, { useState, useEffect } from 'react';
import { adminWithdrawalService } from '../../../services/withdrawalService';
import TokenVerificationModal from './TokenVerificationModal';
import './WithdrawalManagement.css';

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await adminWithdrawalService.getAllWithdrawalRequests();
        if (!data || !Array.isArray(data) || data.length === 0) {
          setWithdrawals([]);
          setFilteredWithdrawals([]);
          return;
        }
        setWithdrawals(data);
        setFilteredWithdrawals(data);
      } catch (err) {
        console.error('Error fetching withdrawal requests:', err);
        setError('Failed to load withdrawal requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWithdrawals();
  }, []);
  console.log("withdrawal requests===>", withdrawals);
  useEffect(() => {
    if (!Array.isArray(withdrawals)) {
      setFilteredWithdrawals([]);
      return;
    }
    
    if (filter === 'all') {
      setFilteredWithdrawals(withdrawals);
    } else {
      setFilteredWithdrawals(withdrawals.filter(w => w.status.toLowerCase() === filter.toLowerCase()));
    }
  }, [filter, withdrawals]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const handleActionClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowVerificationModal(true);
  };
  
  const handleVerificationSubmit = async (action, data) => {
    try {
      let updatedWithdrawal;
      
      switch (action) {
        case 'verify':
          updatedWithdrawal = await adminWithdrawalService.verifyWithdrawalRequest({
            token: selectedWithdrawal.token,
            adminNotes: data.notes
          });
          break;
        case 'complete':
          updatedWithdrawal = await adminWithdrawalService.completeWithdrawalRequest(selectedWithdrawal.token);
          break;
        case 'reject':
          updatedWithdrawal = await adminWithdrawalService.rejectWithdrawalRequest({
            token: selectedWithdrawal.token,
            adminNotes: data.notes
          });
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // Update the withdrawal list with the updated item
      const updatedWithdrawals = withdrawals.map(w => 
        w.id === updatedWithdrawal.id ? updatedWithdrawal : w
      );
      setWithdrawals(updatedWithdrawals);
      setShowVerificationModal(false);
      
    } catch (err) {
      console.error(`Error ${action}ing withdrawal:`, err);
      alert(err.response?.data?.errorMessage || `Failed to ${action} withdrawal. Please try again.`);
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-badge pending';
      case 'verified':
        return 'status-badge verified';
      case 'completed':
        return 'status-badge completed';
      case 'rejected':
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };
  
  const renderActionButton = (withdrawal) => {
    switch (withdrawal.status.toLowerCase()) {
      case 'pending':
        return (
          <button 
            className="action-btn verify" 
            onClick={() => handleActionClick(withdrawal)}
          >
            Verify
          </button>
        );
      case 'verified':
        return (
          <button 
            className="action-btn complete" 
            onClick={() => handleActionClick(withdrawal)}
          >
            Complete
          </button>
        );
      case 'completed':
        return <span className="action-complete">Processed</span>;
      case 'rejected':
        return <span className="action-rejected">Rejected</span>;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="withdrawal-management">
        <h2 className="page-title">Withdrawal Management</h2>
        <div className="loading-spinner">Loading withdrawal requests...</div>
      </div>
    );
  }
  
  return (
    <div className="withdrawal-management">
      <h2 className="page-title">Withdrawal Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filter-container">
        <label htmlFor="status-filter">Filter by status:</label>
        <select 
          id="status-filter" 
          value={filter} 
          onChange={handleFilterChange}
          className="status-filter"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {filteredWithdrawals?.length === 0 ? (
        <div className="no-withdrawals">No withdrawal requests found.</div>
      ) : (
        <div className="withdrawals-table-container">
          <table className="withdrawals-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Caregiver</th>
                <th>Amount</th>
                <th>Service Fee</th>
                <th>Final Amount</th>
                <th>Bank Info</th>
                <th>Token</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredWithdrawals) && filteredWithdrawals.map(withdrawal => (
                <tr key={withdrawal.id}>
                  <td>{formatDateTime(withdrawal.createdAt)}</td>
                  <td>{withdrawal.caregiverName}</td>
                  <td>{formatCurrency(withdrawal.amountRequested)}</td>
                  <td>{formatCurrency(withdrawal.serviceCharge)}</td>
                  <td>{formatCurrency(withdrawal.finalAmount)}</td>
                  <td>
                    <div className="bank-info">
                      <div>{withdrawal.bankName}</div>
                      <div>{withdrawal.accountNumber}</div>
                      <div>{withdrawal.accountName}</div>
                    </div>
                  </td>
                  <td>
                    <span className="token">{withdrawal.token}</span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(withdrawal.status)}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td>
                    {renderActionButton(withdrawal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showVerificationModal && selectedWithdrawal && (
        <TokenVerificationModal
          withdrawal={selectedWithdrawal}
          onClose={() => setShowVerificationModal(false)}
          onSubmit={handleVerificationSubmit}
        />
      )}
    </div>
  );
};

export default WithdrawalManagement;

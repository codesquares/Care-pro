import { useState, useEffect } from 'react';
import { withdrawalService } from '../../services/withdrawalService';
import walletService from '../../services/walletService';
import './earnings.css';
import WithdrawalModal from './components/WithdrawalModal';

const Earnings = () => {
  const [wallet, setWallet] = useState({
    totalEarned: 0,
    withdrawableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
  });
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [error, setError] = useState(null);
  

  // Get the current user from local storage
  const currentUser = JSON.parse(localStorage.getItem('userDetails')) || {};

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load wallet summary (single source of truth)
        const walletResult = await walletService.getWalletSummary(currentUser.id);
        if (walletResult.success && walletResult.data) {
          setWallet({
            totalEarned: walletResult.data.totalEarned ?? 0,
            withdrawableBalance: walletResult.data.withdrawableBalance ?? 0,
            pendingBalance: walletResult.data.pendingBalance ?? 0,
            totalWithdrawn: walletResult.data.totalWithdrawn ?? 0,
          });
        }

        // Check if there's a pending withdrawal
        const hasPending = await withdrawalService.hasPendingWithdrawal(currentUser.id);
        setHasPendingWithdrawal(hasPending);
        
        // Load withdrawal history
        try {
          const history = await withdrawalService.getWithdrawalHistory(currentUser.id);
          setWithdrawalHistory(Array.isArray(history) ? history : []);
        } catch (historyError) {
          console.error("Error fetching withdrawal history:", historyError);
          setWithdrawalHistory([]);
        }
      } catch (err) {
        console.error("Error fetching earnings data:", err);
        setError("Failed to load earnings data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchEarningsData();
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleWithdrawalClick = () => {
    if (hasPendingWithdrawal) {
      alert("You already have a pending withdrawal request. Please wait for it to be processed before making another request.");
      return;
    }
    
    if (wallet.withdrawableBalance <= 0) {
      alert("You don't have any withdrawable funds available.");
      return;
    }
    
    setShowWithdrawalModal(true);
  };

  const handleWithdrawalSubmit = async (withdrawalData) => {
    try {
      await withdrawalService.createWithdrawalRequest({
        ...withdrawalData,
        caregiverId: currentUser.id
      });
      
      setShowWithdrawalModal(false);
      setHasPendingWithdrawal(true);
      
     // Refresh withdrawal history
      try {
        const history = await withdrawalService.getWithdrawalHistory(currentUser.id);
        setWithdrawalHistory(Array.isArray(history) ? history : []);
      } catch (historyError) {
        console.error("Error refreshing withdrawal history:", historyError);
        setWithdrawalHistory([]);
      }
      
      alert("Withdrawal request submitted successfully!");
    } catch (err) {
      console.error("Error creating withdrawal request:", err);
      alert(err.response?.data?.errorMessage || "Failed to submit withdrawal request. Please try again.");
    }
  };
  if (isLoading) {
    return (
      <div className="earnings-container">
        <div className="loading-spinner">Loading earnings data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="earnings-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="earnings-container">
      <h2 className="earnings-title">Earnings</h2>

      <div className="earnings-summary">
        <div className="funds-card">
          <p>Withdrawable Balance:</p>
          <h3>{formatCurrency(wallet.withdrawableBalance)}</h3>
          {wallet.pendingBalance > 0 && (
            <p className="pending-balance">Pending: {formatCurrency(wallet.pendingBalance)}</p>
          )}
          <div className="card-buttons">
            <button className="btn withdraw" onClick={handleWithdrawalClick} disabled={hasPendingWithdrawal || wallet.withdrawableBalance <= 0}>
              {hasPendingWithdrawal ? 'Withdrawal Pending' : 'Withdraw'}
            </button>
          </div>
        </div>
        <div className="total-card">
          <p>All Earnings</p>
          <h3>{formatCurrency(wallet.totalEarned)}</h3>
          <p className="withdrawn-amount">Withdrawn: {formatCurrency(wallet.totalWithdrawn)}</p>
        </div>
      </div>

      <h3 className="transactions-title">Withdrawal History</h3>
      {withdrawalHistory?.length > 0 ? (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount Requested</th>
              <th>Service Charge</th>
              <th>Final Amount</th>
              <th>Status</th>
              {/* <th>Token</th> */}
            </tr>
          </thead>
          <tbody>
            {withdrawalHistory.map((withdrawal) => (
              <tr key={withdrawal.id}>
                <td>{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                <td>{formatCurrency(withdrawal.amountRequested)}</td>
                <td>{formatCurrency(withdrawal.serviceCharge)}</td>
                <td>{formatCurrency(withdrawal.finalAmount)}</td>
                <td className={`withdrawal-status status-${withdrawal.status.toLowerCase()}`}>
                  {withdrawal.status}
                </td>
                <td>{withdrawal.token}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-transactions">No withdrawal history available.</p>
      )}
      
      {showWithdrawalModal && (
        <WithdrawalModal
          onClose={() => setShowWithdrawalModal(false)}
          onSubmit={handleWithdrawalSubmit}
          maxAmount={wallet.withdrawableBalance}
        />
      )}
    </div>
  );
};

export default Earnings;

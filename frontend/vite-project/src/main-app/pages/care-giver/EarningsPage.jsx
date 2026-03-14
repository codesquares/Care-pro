import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaDollarSign, FaClipboardList, FaChartLine, FaCreditCard, FaInfoCircle, FaClock } from 'react-icons/fa';
import walletService from '../../services/walletService';
import { withdrawalService } from '../../services/withdrawalService';
import './earnings-page.css';

const EarningsPage = () => {
  const [wallet, setWallet] = useState({
    totalEarned: 0,
    withdrawableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    totalOrders: 0,
  });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
          setWallet(prev => ({
            ...prev,
            totalEarned: walletResult.data.totalEarned ?? 0,
            withdrawableBalance: walletResult.data.withdrawableBalance ?? 0,
            pendingBalance: walletResult.data.pendingBalance ?? 0,
            totalWithdrawn: walletResult.data.totalWithdrawn ?? 0,
          }));
        }

        // Load ledger history for chart data (OrderReceived entries = actual earnings)
        const ledgerResult = await walletService.getLedgerHistory(currentUser.id, 200);
        if (ledgerResult.success && Array.isArray(ledgerResult.data)) {
          setLedgerEntries(ledgerResult.data);
          // Count unique orders from ledger
          const orderEntries = ledgerResult.data.filter(e => e.type === 'OrderReceived');
          setWallet(prev => ({ ...prev, totalOrders: orderEntries.length }));
        }

        // Load withdrawal history for the transactions table
        try {
          const history = await withdrawalService.getCaregiverWithdrawalHistory(currentUser.id);
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
  }, [currentUser.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  // Get current year
  const currentYear = new Date().getFullYear();

  // Process ledger entries for chart data (only OrderReceived = actual earnings)
  const getMonthlyData = () => {
    if (!ledgerEntries || ledgerEntries.length === 0) {
      return Array(12).fill(0);
    }

    const monthlyEarnings = Array(12).fill(0);
    
    ledgerEntries.forEach(entry => {
      // Count OrderReceived, FundsReleased, and VisitApproved as positive earnings on chart
      if (entry.type === 'OrderReceived' || entry.type === 'FundsReleased' || entry.type === 'VisitApproved') {
        const date = new Date(entry.createdAt);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          monthlyEarnings[month] += Math.abs(entry.amount) || 0;
        }
      }
    });

    return monthlyEarnings;
  };

  const monthlyData = getMonthlyData();
  const hasData = monthlyData.some(value => value > 0);
  const maxValue = Math.max(...monthlyData);

  // Build a unified list of all transactions from ledger entries + withdrawal history
  const allTransactions = (() => {
    const transactions = [];

    // Add ledger entries (orders received, funds released, refunds, adjustments, etc.)
    if (Array.isArray(ledgerEntries)) {
      ledgerEntries.forEach(entry => {
        const typeInfo = walletService.getLedgerEntryTypeInfo(entry.type);
        transactions.push({
          id: entry.id || `ledger-${entry.createdAt}`,
          date: entry.createdAt,
          activity: typeInfo.label,
          icon: typeInfo.icon,
          description: entry.description || typeInfo.label,
          order: entry.orderId || null,
          amount: entry.amount || 0,
          isCredit: typeInfo.isCredit,
          source: 'ledger',
        });
      });
    }

    // Add withdrawal history entries (only if not already represented in ledger as WithdrawalCompleted)
    if (Array.isArray(withdrawalHistory)) {
      withdrawalHistory.forEach(withdrawal => {
        // Avoid duplicates: skip if there's a matching ledger WithdrawalCompleted entry
        const alreadyInLedger = ledgerEntries.some(
          e => e.type === 'WithdrawalCompleted' && e.withdrawalRequestId === withdrawal.id
        );
        if (!alreadyInLedger) {
          transactions.push({
            id: withdrawal.id || `wd-${withdrawal.createdAt}`,
            date: withdrawal.withdrawalRequestDate || withdrawal.createdAt,
            activity: withdrawal.activity || 'Withdrawal',
            icon: '🏦',
            description: withdrawal.description || 'Withdrawal request',
            order: withdrawal.completedAt ? new Date(withdrawal.completedAt).toLocaleDateString() : 'Pending',
            amount: -(withdrawal.amountRequested || 0),
            isCredit: false,
            source: 'withdrawal',
          });
        }
      });
    }

    // Sort by date descending (most recent first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  })();

  // Filter transactions for current year
  const currentYearTransactions = allTransactions.filter(tx => {
    const date = new Date(tx.date);
    return date.getFullYear() === currentYear;
  });

  if (isLoading) {
    return (
      <div className="earnings-page-container">
        <div className="loading-spinner">Loading earnings data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="earnings-page-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="earnings-page-container">
      <div className="earnings-header">
        <h1 className="earnings-title">Earnings</h1>
        <Link to="/app/caregiver/withdraw" className="withdraw-earnings-btn">
          Withdraw Earnings →
        </Link>
      </div>

      <div className="earnings-stats-grid">
        <div className="earnings-stat-card balance-card">
          <div className="earnings-icon-wrap">
            <FaDollarSign className="earnings-stat-icon" />
          </div>
          <div className="earnings-stat-content">
            <p className="earnings-stat-label">Withdrawable Balance</p>
            <h2 className="earnings-stat-value">{formatCurrency(wallet.withdrawableBalance)}</h2>
          </div>
        </div>

        <div className="earnings-stat-card orders-card">
          <div className="earnings-icon-wrap">
            <FaClock className="earnings-stat-icon" />
          </div>
          <div className="earnings-stat-content">
            <p className="earnings-stat-label">Pending Balance</p>
            <h2 className="earnings-stat-value">{formatCurrency(wallet.pendingBalance)}</h2>
          </div>
        </div>

        <div className="earnings-stat-card earnings-card">
          <div className="earnings-icon-wrap">
            <FaChartLine className="earnings-stat-icon" />
          </div>
          <div className="earnings-stat-content">
            <p className="earnings-stat-label">Total Earnings</p>
            <h2 className="earnings-stat-value">{formatCurrency(wallet.totalEarned)}</h2>
          </div>
        </div>

        <div className="earnings-stat-card payout-card">
          <div className="earnings-icon-wrap">
            <FaCreditCard className="earnings-stat-icon" />
          </div>
          <div className="earnings-stat-content">
            <p className="earnings-stat-label">Total Paid Out</p>
            <h2 className="earnings-stat-value">{formatCurrency(wallet.totalWithdrawn)}</h2>
          </div>
        </div>

        <div className="earnings-stat-card orders-card">
          <div className="earnings-icon-wrap">
            <FaClipboardList className="earnings-stat-icon" />
          </div>
          <div className="earnings-stat-content">
            <p className="earnings-stat-label">Total Orders</p>
            <h2 className="earnings-stat-value">{formatNumber(wallet.totalOrders)}</h2>
          </div>
        </div>
      </div>

      <div className="earnings-chart-section">
        <div className="chart-header">
          <h3>Total Earnings</h3>
          <div className="chart-controls">
            <span className="chart-year">{currentYear}</span>
            <button className="chart-info-btn">
              <FaInfoCircle className="chart-info-icon" />
            </button>
          </div>
        </div>
        
        <div className="earnings-amount">
          <span className="amount-value">{formatCurrency(wallet.totalEarned)}</span>
        </div>

        {hasData ? (
          <div className="earnings-chart">
            <div className="chart-bars">
              {monthlyData.map((value, index) => (
                <div 
                  key={index}
                  className="chart-bar" 
                  style={{
                    height: maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%',
                    minHeight: value > 0 ? '8px' : '0px'
                  }}
                  title={`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}: ${formatCurrency(value)}`}
                ></div>
              ))}
            </div>
            <div className="chart-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>
        ) : (
          <div className="no-chart-data">
            <p>No earnings data available for {currentYear}</p>
          </div>
        )}
      </div>

      <div className="transactions-section">
        <h3 className="transactions-title">All Transactions ({currentYear})</h3>
        {currentYearTransactions?.length > 0 ? (
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Description</th>
                  <th>Order</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentYearTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="date-cell">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="activity-cell-container">
                      <div className="activity-cell">
                        <span className="activity-icon-emoji">{tx.icon}</span>
                        <span>{tx.activity}</span>
                      </div>
                    </td>
                    <td className="description-cell">{tx.description || 'N/A'}</td>
                    <td className="order-cell">{tx.order || '—'}</td>
                    <td className={`amount-cell amount ${tx.isCredit ? 'positive' : 'negative'}`}>
                      {tx.isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-transactions">No transactions available for {currentYear}.</p>
        )}
      </div>
    </div>
  );
};

export default EarningsPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { earningService } from '../../services/earningsService';
import { withdrawalService } from '../../services/withdrawalService';
import './earnings-page.css';

const EarningsPage = () => {
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    withdrawableAmount: 0,
    withdrawnAmount: 0,
    totalOrders: 0,
    totalEarnings: 0,
    totalPaidOut: 0,
  });
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
        
        // Load earnings data
        const earningsData = await earningService.getUpdatedEarnings(currentUser.id);
        const orders = await earningService.getCareGiverOrderDetails(currentUser.id);
        console.log("Earnings Data:", earningsData);
        console.log("Order Details:", orders);
        if (!earningsData || !orders) {
          setEarnings({
            totalEarned: 0,
            withdrawableAmount: 0,
            withdrawnAmount: 0,
            totalOrders: 0,
            totalEarnings: 0,
            totalPaidOut: 0,
          });
        } else {
          setEarnings({
            totalEarned: earningsData.totalAmountEarned,
            withdrawableAmount: earningsData.withdrawableAmount,
            withdrawnAmount: earningsData.totalAmountWithdrawn,
            // totalOrders: earningsData.totalOrders || 1250, // Placeholder if not available
            totalEarnings: earningsData.totalAmountEarned,
            totalPaidOut: earningsData.totalAmountWithdrawn,
          });
          setEarnings(prev => ({ ...prev, totalOrders: orders.length || 0 }));
        }

        // Load withdrawal history
        try {
          const history = await withdrawalService.getWithdrawalHistory(currentUser.id);
          console.log("Withdrawal History before filtering:", history);
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

  // Process withdrawal history for chart data
  const getMonthlyData = () => {
    if (!withdrawalHistory || withdrawalHistory.length === 0) {
      return Array(12).fill(0);
    }

    const monthlyEarnings = Array(12).fill(0);
    
    withdrawalHistory.forEach(withdrawal => {
      const date = new Date(withdrawal.createdAt);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        // Add withdrawal amounts as earnings data for the chart
        monthlyEarnings[month] += withdrawal.amountRequested || 0;
      }
    });

    return monthlyEarnings;
  };

  const monthlyData = getMonthlyData();
  const hasData = monthlyData.some(value => value > 0);
  const maxValue = Math.max(...monthlyData);

  // Filter transactions for current year
  const currentYearTransactions = withdrawalHistory.filter(withdrawal => {
    const date = new Date(withdrawal.createdAt);
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
        <div className="stat-card balance-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Your Balance</p>
            <h2 className="stat-value">{formatCurrency(earnings.withdrawableAmount)}</h2>
          </div>
        </div>

        <div className="stat-card orders-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h2 className="stat-value">{formatNumber(earnings.totalOrders)}</h2>
          </div>
        </div>

        <div className="stat-card earnings-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <p className="stat-label">Total Earnings</p>
            <h2 className="stat-value">{formatCurrency(earnings.totalEarnings)}</h2>
          </div>
        </div>

        <div className="stat-card payout-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <p className="stat-label">Total Paid Out</p>
            <h2 className="stat-value">{formatCurrency(earnings.totalPaidOut)}</h2>
          </div>
        </div>
      </div>

      <div className="earnings-chart-section">
        <div className="chart-header">
          <h3>Total Earnings</h3>
          <div className="chart-controls">
            <span className="chart-year">{currentYear}</span>
            <button className="chart-info-btn">ℹ️</button>
          </div>
        </div>
        
        <div className="earnings-amount">
          <span className="amount-value">{formatCurrency(earnings.totalEarnings)}</span>
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
                {currentYearTransactions.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="date-cell">{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                    <td className="activity-cell-container">
                      <div className="activity-cell">
                        <span className="activity-icon withdrawal">💸</span>
                        <span>Withdrawal</span>
                      </div>
                    </td>
                    <td className="description-cell">{withdrawal.status === 'Completed' ? 'Transferred successfully' : withdrawal.status === null ? 'N/A' : withdrawal.status}</td>
                    <td className="order-cell">{withdrawal.token || 'N/A'}</td>
                    <td className="amount-cell amount negative">-{formatCurrency(withdrawal.amountRequested || 0)}</td>
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

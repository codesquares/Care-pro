import { useState, useEffect } from 'react';
import walletService from '../../../services/walletService';
import './TransactionHistory.css';
import { useAuth } from '../../../hooks/useAuth';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(20);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use wallet ledger as single source of truth
      const result = await walletService.getLedgerHistory(user.id, 200);
      if (result.success && Array.isArray(result.data)) {
        setTransactions(result.data);
      } else {
        setTransactions([]);
        if (!result.success) {
          setError(result.error || 'Failed to load transaction history.');
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(Math.abs(amount));
  };
  
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const getTypeInfo = (type) => {
    return walletService.getLedgerEntryTypeInfo(type);
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  const visibleTransactions = transactions.slice(0, displayCount);
  const hasMore = displayCount < transactions.length;
  
  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-history">
        <h2 className="section-title">Transaction History</h2>
        <div className="loading-spinner">Loading your transaction history...</div>
      </div>
    );
  }
  
  return (
    <div className="transaction-history">
      <h2 className="section-title">Transaction History</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {transactions.length === 0 ? (
        <div className="no-transactions">
          <p>You don't have any transactions yet.</p>
        </div>
      ) : (
        <>
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map(entry => {
                  const typeInfo = getTypeInfo(entry.type);
                  const isCredit = entry.amount > 0;
                  return (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>
                        <span 
                          className="transaction-type-badge"
                          style={{ backgroundColor: typeInfo.color, color: '#fff' }}
                        >
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </td>
                      <td className="description">
                        {entry.description}
                        {entry.serviceType && (
                          <span className="service-type-tag"> ({entry.serviceType})</span>
                        )}
                        {entry.billingCycleNumber && (
                          <span className="cycle-tag"> Cycle #{entry.billingCycleNumber}</span>
                        )}
                      </td>
                      <td className={`amount ${isCredit ? 'positive' : 'negative'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(entry.amount)}
                      </td>
                      <td className="balance-after">{formatCurrency(entry.balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {hasMore && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore}>
                Load More ({transactions.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;

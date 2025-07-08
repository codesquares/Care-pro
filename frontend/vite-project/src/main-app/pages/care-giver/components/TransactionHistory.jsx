import React, { useState, useEffect } from 'react';
import { transactionService } from '../../../services/transactionService';
import './TransactionHistory.css';
import { useAuth } from '../../../hooks/useAuth';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await transactionService.getCaregiverTransactions(user.id, currentPage, pageSize);
      setTransactions(data);
      
      // Assuming backend returns total count or pages information
      // This would need to be adjusted based on actual API response
      if (data.length < pageSize && currentPage === 1) {
        setTotalPages(1);
      } else if (data.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (data.length === pageSize) {
        // This is a simple approach - in a real app, get total count from API
        setTotalPages(currentPage + 1);
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
    }).format(amount);
  };
  
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const getTransactionTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case 'earning':
        return 'transaction-type earning';
      case 'withdrawal':
        return 'transaction-type withdrawal';
      case 'fee':
        return 'transaction-type fee';
      default:
        return 'transaction-type';
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
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
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                    <td>
                      <span className={getTransactionTypeClass(transaction.transactionType)}>
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="description">{transaction.description}</td>
                    <td className={`amount ${transaction.transactionType.toLowerCase() === 'earning' ? 'positive' : 'negative'}`}>
                      {transaction.transactionType.toLowerCase() === 'earning' ? '+' : '-'} 
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td className="reference">{transaction.referenceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(totalPages > 1) && (
            <div className="pagination">
              <button 
                className="pagination-btn prev" 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button 
                className="pagination-btn next" 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;

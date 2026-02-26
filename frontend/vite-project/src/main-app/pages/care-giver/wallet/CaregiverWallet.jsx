import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWallet, FaClock, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import walletService from '../../../services/walletService';
import './CaregiverWallet.css';

const CaregiverWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerLimit, setLedgerLimit] = useState(20);
  const [ledgerFilter, setLedgerFilter] = useState('All'); // All | Credits | Debits
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPendingTooltip, setShowPendingTooltip] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('userDetails')) || {};

  const fetchData = async (limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const [walletResult, ledgerResult] = await Promise.all([
        walletService.getWalletSummary(currentUser.id),
        walletService.getLedgerHistory(currentUser.id, limit),
      ]);

      if (walletResult.success) {
        setWallet(walletResult.data);
      } else {
        // Only show error for real failures, not "wallet not found" situations
        setError(walletResult.error || 'Failed to load wallet data.');
      }

      if (ledgerResult.success && Array.isArray(ledgerResult.data)) {
        setLedger(ledgerResult.data);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchData(ledgerLimit);
    }
  }, [currentUser.id]);

  const handleLoadMore = async () => {
    const newLimit = ledgerLimit + 20;
    setLedgerLimit(newLimit);
    const result = await walletService.getLedgerHistory(currentUser.id, newLimit);
    if (result.success && Array.isArray(result.data)) {
      setLedger(result.data);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeInfo = (type) => walletService.getLedgerEntryTypeInfo(type);

  // Filter ledger entries
  const filteredLedger = ledger.filter((entry) => {
    if (ledgerFilter === 'Credits') return entry.amount > 0;
    if (ledgerFilter === 'Debits') return entry.amount < 0;
    return true;
  });

  if (isLoading) {
    return (
      <div className="cg-wallet-page">
        <div className="cg-wallet-container">
          <div className="cg-wallet__loading">Loading wallet…</div>
        </div>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="cg-wallet-page">
        <div className="cg-wallet-container">
          <div className="cg-wallet__error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cg-wallet-page">
      <div className="cg-wallet-container">
        <h1 className="cg-wallet__title">My Wallet</h1>

        {/* Total Earned Banner */}
        <div className="cg-wallet__total-banner">
          <span className="cg-wallet__total-label">Total Earned (Lifetime)</span>
          <span className="cg-wallet__total-value">
            {formatCurrency(wallet?.totalEarned ?? 0)}
          </span>
        </div>

        {/* Balance Cards */}
        <div className="cg-wallet__balances">
          <div className="cg-wallet__balance-card cg-wallet__balance-card--available">
            <div className="cg-wallet__balance-icon">
              <FaWallet />
            </div>
            <div className="cg-wallet__balance-info">
              <span className="cg-wallet__balance-label">Available</span>
              <span className="cg-wallet__balance-value">
                {formatCurrency(wallet?.withdrawableBalance ?? 0)}
              </span>
            </div>
            <Link to="/app/caregiver/withdraw" className="cg-wallet__withdraw-btn">
              Withdraw →
            </Link>
          </div>

          <div className="cg-wallet__balance-card cg-wallet__balance-card--pending">
            <div className="cg-wallet__balance-icon">
              <FaClock />
            </div>
            <div className="cg-wallet__balance-info">
              <span className="cg-wallet__balance-label">
                Pending
                <button
                  className="cg-wallet__info-btn"
                  onClick={() => setShowPendingTooltip(!showPendingTooltip)}
                  aria-label="Info about pending balance"
                >
                  <FaInfoCircle />
                </button>
              </span>
              <span className="cg-wallet__balance-value">
                {formatCurrency(wallet?.pendingBalance ?? 0)}
              </span>
              {showPendingTooltip && (
                <div className="cg-wallet__tooltip">
                  These are funds from orders that are waiting for client approval
                  or the 7-day automatic release period.
                </div>
              )}
            </div>
          </div>

          <div className="cg-wallet__balance-card cg-wallet__balance-card--withdrawn">
            <div className="cg-wallet__balance-icon">
              <FaMoneyBillWave />
            </div>
            <div className="cg-wallet__balance-info">
              <span className="cg-wallet__balance-label">Withdrawn</span>
              <span className="cg-wallet__balance-value">
                {formatCurrency(wallet?.totalWithdrawn ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Section */}
        <div className="cg-wallet__ledger-section">
          <div className="cg-wallet__ledger-header">
            <h2 className="cg-wallet__ledger-title">Financial Activity</h2>
            <div className="cg-wallet__ledger-filters">
              {['All', 'Credits', 'Debits'].map((f) => (
                <button
                  key={f}
                  className={`cg-wallet__ledger-filter ${ledgerFilter === f ? 'cg-wallet__ledger-filter--active' : ''}`}
                  onClick={() => setLedgerFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredLedger.length === 0 ? (
            <div className="cg-wallet__ledger-empty">
              <p>No {ledgerFilter !== 'All' ? ledgerFilter.toLowerCase() : 'transactions'} yet.</p>
            </div>
          ) : (
            <>
              <div className="cg-wallet__ledger-table-wrap">
                <table className="cg-wallet__ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((entry) => {
                      const typeInfo = getTypeInfo(entry.type);
                      const isCredit = entry.amount > 0;
                      return (
                        <tr key={entry.id}>
                          <td className="cg-wallet__ledger-date">
                            {formatDateTime(entry.createdAt)}
                          </td>
                          <td>
                            <span
                              className="cg-wallet__type-badge"
                              style={{ backgroundColor: typeInfo.color, color: '#fff' }}
                            >
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                          </td>
                          <td className="cg-wallet__ledger-desc">
                            {entry.description}
                            {entry.serviceType && (
                              <span className="cg-wallet__service-tag"> ({entry.serviceType})</span>
                            )}
                            {entry.billingCycleNumber > 0 && (
                              <span className="cg-wallet__cycle-tag"> Cycle #{entry.billingCycleNumber}</span>
                            )}
                          </td>
                          <td className={`cg-wallet__ledger-amount ${isCredit ? 'cg-wallet__ledger-amount--credit' : 'cg-wallet__ledger-amount--debit'}`}>
                            {isCredit ? '+' : '-'}
                            {formatCurrency(Math.abs(entry.amount))}
                          </td>
                          <td className="cg-wallet__ledger-balance">
                            {formatCurrency(entry.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {ledger.length >= ledgerLimit && (
                <div className="cg-wallet__load-more">
                  <button className="cg-wallet__load-more-btn" onClick={handleLoadMore}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaregiverWallet;

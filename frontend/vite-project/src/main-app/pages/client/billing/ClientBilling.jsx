import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billingRecordService from '../../../services/billingRecordService';
import InvoiceCard from '../../../components/billing/InvoiceCard';
import './ClientBilling.css';

const STATUS_FILTERS = ['All', 'Paid', 'Refunded', 'Disputed'];

/**
 * ClientBilling — lists all billing records (invoices/receipts) for the
 * logged-in client with status filtering.
 */
const ClientBilling = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      try {
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        if (!userDetails.id) {
          setError('Unable to identify your account. Please log in again.');
          setLoading(false);
          return;
        }
        const result = await billingRecordService.getClientBillingRecords(userDetails.id);
        if (result.success) {
          const list = Array.isArray(result.data) ? result.data : [];
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setRecords(list);
        } else {
          setError(result.error || 'Failed to load billing records.');
        }
      } catch (err) {
        setError('Unexpected error loading billing records.');
      }
      setLoading(false);
    };
    fetchBilling();
  }, []);

  const filtered = filter === 'All' ? records : records.filter((r) => r.status === filter);

  // Summary metrics
  const totalPaid = records
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  if (loading) {
    return (
      <div className="client-billing-page">
        <div className="client-billing-container">
          <div className="client-billing__loading">Loading billing records…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-billing-page">
      <div className="client-billing-container">
        <h1 className="client-billing__title">Billing &amp; Invoices</h1>

        {/* Summary */}
        <div className="client-billing__summary">
          <div className="client-billing__stat-card">
            <span className="client-billing__stat-label">Total Invoices</span>
            <span className="client-billing__stat-value">{records.length}</span>
          </div>
          <div className="client-billing__stat-card">
            <span className="client-billing__stat-label">Total Paid</span>
            <span className="client-billing__stat-value">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="client-billing__stat-card">
            <span className="client-billing__stat-label">Refunded</span>
            <span className="client-billing__stat-value">
              {records.filter((r) => r.status === 'Refunded').length}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="client-billing__filters">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`client-billing__filter-btn ${filter === s ? 'client-billing__filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="client-billing__error">{error}</div>}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="client-billing__empty">
            <p>
              No invoices found
              {filter !== 'All' ? ` with status "${filter}"` : ''}.
            </p>
          </div>
        ) : (
          <div className="client-billing__list">
            {filtered.map((record) => (
              <InvoiceCard key={record.id} record={record} basePath="/app/client" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBilling;

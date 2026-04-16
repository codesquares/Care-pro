import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import billingRecordService from '../../../services/billingRecordService';
import './InvoiceDetail.css';

/**
 * InvoiceDetail — displays a full itemized receipt / invoice for a
 * single billing record. Supports printing via window.print().
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      const result = await billingRecordService.getBillingRecordById(id);
      if (result.success) {
        setRecord(result.data);
      } else {
        setError(result.error || 'Failed to load invoice.');
      }
      setLoading(false);
    };
    if (id) fetchRecord();
  }, [id]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="invoice-detail-page">
        <div className="invoice-detail-container">
          <div className="invoice-detail__loading">Loading invoice…</div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="invoice-detail-page">
        <div className="invoice-detail-container">
          <div className="invoice-detail__error">{error || 'Invoice not found.'}</div>
          <button
            className="invoice-detail__back-btn"
            onClick={() => navigate('/app/client/billing')}
          >
            ← Back to Billing
          </button>
        </div>
      </div>
    );
  }

  const badge = billingRecordService.getStatusBadgeInfo(record.status);
  const shortId = record.id ? record.id.substring(0, 8) : '—';
  const isRecurring =
    record.serviceType !== 'OneTime' && record.billingCycleNumber > 1;

  return (
    <div className="invoice-detail-page">
      <div className="invoice-detail-container">
        {/* Header bar */}
        <div className="invoice-detail__header no-print">
          <button
            className="invoice-detail__back-btn"
            onClick={() => navigate('/app/client/billing')}
          >
            ← Back to Billing
          </button>
          <button className="invoice-detail__print-btn" onClick={handlePrint}>
            🖨 Print
          </button>
        </div>

        {/* Invoice Card */}
        <div className="invoice-detail__card">
          <h2 className="invoice-detail__card-title">INVOICE</h2>

          {/* Meta */}
          <div className="invoice-detail__meta">
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Invoice ID</span>
              <span className="invoice-detail__meta-value">#{shortId}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Date</span>
              <span className="invoice-detail__meta-value">{formatDate(record.createdAt)}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Status</span>
              <span className={`invoice-detail__badge ${badge.className}`}>{badge.label}</span>
            </div>
          </div>

          <hr className="invoice-detail__divider" />

          {/* Service Info */}
          <div className="invoice-detail__section">
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Service</span>
              <span className="invoice-detail__meta-value">{record.gigTitle || 'Care Service'}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Caregiver</span>
              <span className="invoice-detail__meta-value">{record.caregiverName || '—'}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Client</span>
              <span className="invoice-detail__meta-value">{record.clientName || '—'}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Service Type</span>
              <span className="invoice-detail__meta-value">{record.serviceType || '—'}</span>
            </div>
            {record.frequencyPerWeek > 0 && (
              <div className="invoice-detail__meta-row">
                <span className="invoice-detail__meta-label">Frequency</span>
                <span className="invoice-detail__meta-value">
                  {record.frequencyPerWeek}x per week
                </span>
              </div>
            )}
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Billing Cycle</span>
              <span className="invoice-detail__meta-value">
                #{record.billingCycleNumber || 1}
                {isRecurring ? ` of ${record.serviceType} Service` : ''}
              </span>
            </div>
          </div>

          <hr className="invoice-detail__divider" />

          {/* Period */}
          <div className="invoice-detail__section">
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Period Start</span>
              <span className="invoice-detail__meta-value">{formatDate(record.periodStart)}</span>
            </div>
            <div className="invoice-detail__meta-row">
              <span className="invoice-detail__meta-label">Period End</span>
              <span className="invoice-detail__meta-value">{formatDate(record.periodEnd)}</span>
            </div>
            {record.paymentTransactionId && (
              <div className="invoice-detail__meta-row">
                <span className="invoice-detail__meta-label">Transaction</span>
                <span className="invoice-detail__meta-value invoice-detail__mono">
                  {record.paymentTransactionId}
                </span>
              </div>
            )}
          </div>

          <hr className="invoice-detail__divider" />

          {/* Breakdown */}
          <div className="invoice-detail__breakdown">
            <h3 className="invoice-detail__breakdown-title">BREAKDOWN</h3>
            <div className="invoice-detail__line-item">
              <span>Order Fee</span>
              <span>{formatCurrency(record.orderFee)}</span>
            </div>
            <div className="invoice-detail__line-item">
              <span>Service Charge</span>
              <span>{formatCurrency(record.serviceCharge)}</span>
            </div>
            <div className="invoice-detail__line-item">
              <span>Gateway Fees</span>
              <span>{formatCurrency(record.gatewayFees)}</span>
            </div>
            <div className="invoice-detail__line-total">
              <span>TOTAL PAID</span>
              <span>{formatCurrency(record.amountPaid)}</span>
            </div>
          </div>

          {/* Next charge */}
          {record.nextChargeDate && (
            <>
              <hr className="invoice-detail__divider" />
              <div className="invoice-detail__next-charge">
                <span className="invoice-detail__meta-label">Next Charge</span>
                <span className="invoice-detail__meta-value">
                  {formatDate(record.nextChargeDate)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;

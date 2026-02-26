import { useNavigate } from 'react-router-dom';
import billingRecordService from '../../services/billingRecordService';
import './InvoiceCard.css';

/**
 * InvoiceCard — displays a single billing record summary in a list.
 * Reusable by any page that renders an array of billing records.
 *
 * @param {{ record: Object, basePath?: string }} props
 *   record  — BillingRecordResponse from the API
 *   basePath — route prefix, defaults to '/app/client'
 */
const InvoiceCard = ({ record, basePath = '/app/client' }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const badge = billingRecordService.getStatusBadgeInfo(record.status);
  const shortId = record.id ? record.id.substring(0, 8) : '—';
  const cycleLabel =
    record.serviceType === 'OneTime' || record.billingCycleNumber <= 1
      ? record.serviceType || 'One-time'
      : `Monthly #${record.billingCycleNumber}`;

  return (
    <div
      className="invoice-card"
      onClick={() => navigate(`${basePath}/billing/${record.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`${basePath}/billing/${record.id}`)}
    >
      <div className="invoice-card__left">
        <span className="invoice-card__id">INV #{shortId}</span>
        <span className="invoice-card__gig">{record.gigTitle || 'Care Service'}</span>
        <span className="invoice-card__caregiver">Caregiver: {record.caregiverName || '—'}</span>
      </div>
      <div className="invoice-card__center">
        <span className="invoice-card__date">{formatDate(record.createdAt)}</span>
        <span className="invoice-card__cycle">{cycleLabel}</span>
      </div>
      <div className="invoice-card__right">
        <span className="invoice-card__amount">{formatCurrency(record.amountPaid)}</span>
        <span className={`invoice-card__badge ${badge.className}`}>{badge.label}</span>
        <span className="invoice-card__arrow">View →</span>
      </div>
    </div>
  );
};

export default InvoiceCard;

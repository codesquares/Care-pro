import { useNavigate } from 'react-router-dom';
import './assignments.css';

// Compact assignments list for the dashboard and profile. Pending offers first,
// then accepted/active. Only shows fields from the caregiver-scoped DTO
// (client name, package, status, date) — never phone or street address.
const AssignmentsSummaryList = ({ pending, active, loading, error, onRetry }) => {
  const navigate = useNavigate();
  const rows = [...pending, ...active];

  if (loading) return <p className="asn-summary-note">Loading your assignments…</p>;
  if (error) {
    return (
      <p className="asn-summary-note">
        We couldn't load your assignments.{' '}
        {onRetry && <button type="button" className="asn-summary-link" onClick={onRetry}>Try again</button>}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="asn-summary-note" data-testid="assignments-empty">
        No assignments yet. When CarePro matches you to a client, it will show up here.
      </p>
    );
  }

  return (
    <ul className="asn-list asn-list--compact">
      {rows.map((a) => {
        const isOffer = a.status === 'PendingAcceptance';
        return (
          <li
            key={a.id}
            data-assignment-id={a.id}
            className={`asn-list-item${isOffer ? ' asn-list-item--offer' : ''}`}
            onClick={() => navigate(`/app/caregiver/assignments/${a.id}`)}
          >
            <div className="asn-list-item-main">
              {isOffer && <span className="asn-offer-label">Offer awaiting your response</span>}
              <strong>{a.clientName}</strong>
              <span className="asn-list-item-tier">{a.packageCategory} · {a.packageTierLabel}</span>
            </div>
            <div className="asn-list-item-meta">
              <span className={`asn-status-badge asn-status-badge--${a.status}`}>
                {isOffer ? 'Awaiting your response' : 'Active'}
              </span>
              <span className="asn-list-item-date">
                {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : ''}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default AssignmentsSummaryList;

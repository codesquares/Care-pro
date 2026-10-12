import { useNavigate } from 'react-router-dom';
import { groupAssignmentsByClient } from '../../../utils/groupAssignmentsByClient';
import './assignments.css';

// Compact assignments list for the dashboard and profile. ONE ROW PER CLIENT: pending offers first (each its own row,
// never hidden), then active clients by latest assignment, capped (see utils/groupAssignmentsByClient). A client with
// several active assignments shows a "N active" count; the row opens the most relevant (latest) one. Only shows fields
// from the caregiver-scoped DTO (client name, package, status, date) — never phone or street address.
// `grouped` is the hook's result; the pending/active props remain as a fallback for older callers.
// `showSummaryLine={false}` lets the dashboard put the "Showing 10 of N clients" line next to its own button instead.
const AssignmentsSummaryList = ({ grouped, pending = [], active = [], loading, error, onRetry, showSummaryLine = true }) => {
  const navigate = useNavigate();
  // Previously: const rows = [...pending, ...active];   // every assignment, one row each — ran down the page for long-running clients
  const view = grouped || groupAssignmentsByClient([...pending, ...active]);
  const rows = view.rows;

  if (loading) return <p className="asn-summary-note">Loading your assignments…</p>;
  if (error) {
    return (
      <p className="asn-summary-note">
        We couldn't load your assignments.{' '}
        {onRetry && <button type="button" className="asn-summary-link" onClick={onRetry}>Try again</button>}
      </p>
    );
  }
  if (rows.length === 0 && view.totals.pendingCount === 0 && view.totals.activeCount === 0) {
    return (
      <p className="asn-summary-note" data-testid="assignments-empty">
        No assignments yet. When CarePro matches you to a client, it will show up here.
      </p>
    );
  }

  return (
    <>
    <ul className="asn-list asn-list--compact">
      {rows.map((row) => {
        const a = row.assignment;
        const isOffer = a.status === 'PendingAcceptance';
        return (
          <li
            key={row.key}
            data-assignment-id={a.id}
            className={`asn-list-item${isOffer ? ' asn-list-item--offer' : ''}`}
            onClick={() => navigate(`/app/caregiver/assignments/${a.id}`)}
          >
            <div className="asn-list-item-main">
              {isOffer && <span className="asn-offer-label">Offer awaiting your response</span>}
              {/* clientName is the first name only until the caregiver accepts (enforced by the API) */}
              <strong>{a.clientName}</strong>
              <span className="asn-list-item-tier">{a.packageCategory} · {a.packageTierLabel}</span>
            </div>
            <div className="asn-list-item-meta">
              <span className={`asn-status-badge asn-status-badge--${a.status}`}>
                {isOffer ? 'Awaiting your response' : 'Active'}
              </span>
              {row.activeCount > 1 && (
                <span className="asn-count-badge" data-testid="asn-active-count" title="Open the latest one; see All Assignments for the rest">
                  {row.activeCount} active
                </span>
              )}
              <span className="asn-list-item-date">
                {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : ''}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
    {showSummaryLine && view.label && (
      <p className="asn-summary-note asn-summary-cap" data-testid="assignments-cap-label">{view.label}</p>
    )}
    </>
  );
};

export default AssignmentsSummaryList;

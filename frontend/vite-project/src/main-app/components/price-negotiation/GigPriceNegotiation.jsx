import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import GigPriceNegotiationService from '../../services/gigPriceNegotiationService';
import './GigPriceNegotiation.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** All prices in the negotiation UI must carry a per-visit label. */
const formatPerVisitPrice = (amount) => {
  if (amount == null) return '—';
  return `₦${Number(amount).toLocaleString()} / visit`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const TERMINAL_STATUSES = ['Agreed', 'Rejected', 'Expired'];

// ─── Component ────────────────────────────────────────────────────────────────

const GigPriceNegotiation = () => {
  const { negotiationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Role detection — same localStorage pattern as the rest of the app
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const isClient = (userDetails.role || '').toLowerCase() === 'client';

  // ── State ──
  const [negotiation, setNegotiation] = useState(null);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [fatalError, setFatalError] = useState(null);

  // Input panels
  const [proposeInput, setProposeInput] = useState('');
  const [proposeNote, setProposeNote] = useState('');
  const [counterInput, setCounterInput] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [showProposePanel, setShowProposePanel] = useState(false);
  const [showCounterPanel, setShowCounterPanel] = useState(false);

  // Reject flow
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Countdown
  const [countdown, setCountdown] = useState('');

  // CareRequest re-initiation metadata — stored in sessionStorage so it
  // survives page refreshes when the user navigates here from a notification.
  const [careRequestMeta, setCareRequestMeta] = useState(null);
  // Original gig ID for RegularGig "Pay original price" fallback
  const [originalGigId, setOriginalGigId] = useState(null);

  // ── Load negotiation ──
  const loadNegotiation = useCallback(async () => {
    try {
      const data = await GigPriceNegotiationService.getById(negotiationId);
      setNegotiation(data);
      setVersion(data.version);
    } catch (err) {
      if (err.response?.status === 403) {
        setFatalError('You are not a participant in this negotiation.');
      } else {
        setFatalError(err.response?.data?.message || 'Failed to load negotiation.');
      }
    } finally {
      setLoading(false);
    }
  }, [negotiationId]);

  // ── Real-time: re-fetch when a price negotiation notification arrives via SignalR ──
  const latestNotification = useSelector((state) => state.notifications.notifications[0]);
  useEffect(() => {
    if (!latestNotification) return;
    const t = (latestNotification.type || latestNotification.notificationType || '')
      .toLowerCase().replace(/[\s-]+/g, '_');
    if (
      t.startsWith('price_negotiation_') &&
      (
        latestNotification.relatedEntityId === negotiationId ||
        !latestNotification.relatedEntityId
      )
    ) {
      loadNegotiation();
    }
  }, [latestNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount: load + restore session metadata ──
  useEffect(() => {
    loadNegotiation();

    // Restore careRequestMeta from navigation state or sessionStorage
    const metaFromState = location.state?.careRequestMeta;
    const metaFromStorage = JSON.parse(
      sessionStorage.getItem(`neg_meta_${negotiationId}`) || 'null'
    );
    const meta = metaFromState || metaFromStorage;
    if (meta) {
      setCareRequestMeta(meta);
      sessionStorage.setItem(`neg_meta_${negotiationId}`, JSON.stringify(meta));
    }

    // Restore original gig ID (RegularGig path)
    const gigFromState = location.state?.gigId;
    const gigFromStorage = sessionStorage.getItem(`neg_gig_${negotiationId}`);
    const gig = gigFromState || gigFromStorage;
    if (gig) {
      setOriginalGigId(gig);
      sessionStorage.setItem(`neg_gig_${negotiationId}`, gig);
    }
  }, [loadNegotiation, negotiationId, location.state]);

  // ── Countdown timer ──
  useEffect(() => {
    if (!negotiation?.expiresAt || TERMINAL_STATUSES.includes(negotiation.status)) {
      setCountdown('');
      return;
    }
    const update = () => {
      const diff = new Date(negotiation.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Expiring soon');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [negotiation?.expiresAt, negotiation?.status]);

  // ── Write error handler ──
  const handleWriteError = useCallback((err) => {
    if (err.isConflict) {
      toast.info('The negotiation was just updated. Refreshing now.');
      loadNegotiation();
      return;
    }
    if (err.isTerminal) {
      setFatalError(null); // clear any prior fatal
      toast.warning('This negotiation has already been closed.');
      loadNegotiation();
      return;
    }
    if (err.response?.status === 403) {
      setFatalError('You are not a participant in this negotiation.');
      return;
    }
    toast.error(err.response?.data?.message || 'An error occurred. Please try again.');
  }, [loadNegotiation]);

  // ── Actions ──

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      const result = await GigPriceNegotiationService.accept(negotiationId, { version });
      toast.success('Price accepted!');
      if (isClient && result.gigIdForPayment) {
        navigate(`/app/client/cart/${result.gigIdForPayment}`);
      } else {
        await loadNegotiation();
      }
    } catch (err) {
      handleWriteError(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePropose = async () => {
    const price = Number(proposeInput);
    if (!price || price < 10000) {
      toast.error('Proposed price must be at least ₦10,000.');
      return;
    }
    setActionLoading('propose');
    try {
      const data = await GigPriceNegotiationService.propose(negotiationId, {
        proposedPrice: price,
        ...(proposeNote.trim() && { note: proposeNote.trim() }),
        version,
      });
      setNegotiation(data);
      setVersion(data.version);
      setProposeInput('');
      setProposeNote('');
      setShowProposePanel(false);
      toast.success('Proposal submitted.');
    } catch (err) {
      handleWriteError(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespond = async (accept) => {
    if (!accept) {
      const price = Number(counterInput);
      if (!price || price < 10000) {
        toast.error('Counter price must be at least ₦10,000.');
        return;
      }
    }
    setActionLoading('respond');
    try {
      const data = await GigPriceNegotiationService.respond(negotiationId, {
        accept,
        ...(!accept && { counterPrice: Number(counterInput) }),
        ...(!accept && counterNote.trim() && { note: counterNote.trim() }),
        version,
      });
      setNegotiation(data);
      setVersion(data.version);
      setCounterInput('');
      setCounterNote('');
      setShowCounterPanel(false);
      if (accept) {
        toast.success('Price accepted! Awaiting client payment.');
      } else {
        toast.success('Counter-proposal submitted.');
      }
    } catch (err) {
      handleWriteError(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      const data = await GigPriceNegotiationService.reject(negotiationId, {
        ...(rejectReason.trim() && { reason: rejectReason.trim() }),
        version,
      });
      setNegotiation(data);
      setVersion(data.version);
      setShowRejectConfirm(false);
      setRejectReason('');
      toast.info('Negotiation rejected.');
    } catch (err) {
      handleWriteError(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinit = async () => {
    if (!careRequestMeta?.careRequestId || !careRequestMeta?.responseId) {
      toast.error(
        'Unable to start a new negotiation — required information is missing. ' +
        'Please go back to your care request and hire again.'
      );
      return;
    }
    setActionLoading('reinit');
    try {
      const data = await GigPriceNegotiationService.reinitiateForCareRequest({
        careRequestId: careRequestMeta.careRequestId,
        responseId: careRequestMeta.responseId,
      });
      toast.success('New negotiation started.');
      navigate(`/app/client/price-negotiation/${data.negotiationId}`, {
        state: { careRequestMeta },
        replace: true,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start new negotiation.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading / error screens ──

  if (loading) {
    return (
      <div className="gpn-page">
        <div className="gpn-loading">Loading negotiation…</div>
      </div>
    );
  }

  if (fatalError) {
    return (
      <div className="gpn-page">
        <div className="gpn-fatal-error">
          <p>{fatalError}</p>
          <button className="gpn-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    );
  }

  if (!negotiation) return null;

  // ── Destructure fields (camelCase — ASP.NET Core default JSON serialisation) ——
  const {
    status, entrySource,
    gigDetails, caregiverInfo, clientInfo,
    originalPrice, currentProposedPrice, proposedBy,
    agreedPrice, gigIdForPayment,
    clientProposalCount, clientMaxProposals, canClientPropose,
    caregiverCounterCount, caregiverMaxCounters, canCaregiverCounter,
    commitmentFeeReminderMessage,
    history,
    rejectedBy, rejectionReason,
  } = negotiation;

  // Block the entire negotiation flow if the gig is already at minimum price.
  // The negotiation record may have been created before this guard existed, so
  // check here as a safety net in addition to the initiation-side guard.
  if (isClient && originalPrice <= 10000) {
    return (
      <div className="gpn-page">
        <div className="gpn-fatal-error">
          <p>
            ⚠️ This gig’s price is already at the minimum of
            {' '}<strong>{formatPerVisitPrice(originalPrice)}</strong>.
            Negotiation is not available — the listed price is the lowest possible rate.
          </p>
          {originalGigId && (
            <button
              className="gpn-btn gpn-btn--primary"
              onClick={() => navigate(`/app/client/cart/${originalGigId}`)}
              style={{ marginTop: '16px' }}
            >
              Pay Listed Price
            </button>
          )}
          <button className="gpn-back-btn" onClick={() => navigate(-1)} style={{ marginTop: '8px' }}>← Go Back</button>
        </div>
      </div>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isCareRequestHire = entrySource === 'CareRequestHire';
  const clientRemainingProposals = clientMaxProposals - clientProposalCount;
  const caregiverRemainingCounters = caregiverMaxCounters - caregiverCounterCount;

  // ── Sub-renders ──

  const renderStatusBadge = () => {
    const map = {
      Initiated:          { label: 'Open',                cls: 'gpn-badge--initiated' },
      ClientProposed:     { label: 'Awaiting Caregiver',  cls: 'gpn-badge--proposed' },
      CaregiverCountered: { label: 'Awaiting Your Response', cls: 'gpn-badge--countered' },
      Agreed:             { label: 'Agreed',              cls: 'gpn-badge--agreed' },
      Rejected:           { label: 'Rejected',            cls: 'gpn-badge--rejected' },
      Expired:            { label: 'Expired',             cls: 'gpn-badge--expired' },
    };
    const { label, cls } = map[status] || { label: status, cls: '' };
    return <span className={`gpn-badge ${cls}`}>{label}</span>;
  };

  const renderParticipantAvatar = (info, fallbackChar) => {
    if (info?.profileImage) {
      return (
        <img
          src={info.profileImage}
          alt={info.name || fallbackChar}
          className="gpn-participant-avatar gpn-participant-avatar--img"
        />
      );
    }
    return (
      <div className="gpn-participant-avatar gpn-participant-avatar--initials">
        {(info?.name || fallbackChar || '?').slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const renderHistory = () => {
    if (!history || history.length === 0) return null;
    return (
      <div className="gpn-history">
        <h3 className="gpn-section-title">Negotiation History</h3>
        <div className="gpn-history-list">
          {[...history].reverse().map((entry, i) => (
            <div key={i} className="gpn-history-entry">
              <div className="gpn-history-round-badge">R{entry.roundNumber}</div>
              <div className="gpn-history-body">
                <div className="gpn-history-row">
                  <span className="gpn-history-who">{entry.proposedBy}</span>
                  <span className="gpn-history-action">{entry.actionType}</span>
                  <span className="gpn-history-price">{formatPerVisitPrice(entry.price)}</span>
                </div>
                {entry.note && <p className="gpn-history-note">"{entry.note}"</p>}
                <span className="gpn-history-time">{formatDate(entry.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Client action area (changes based on status) ──
  const renderClientActions = () => {
    // ── Agreed ──
    if (status === 'Agreed') {
      return (
        <div className="gpn-agreed-section">
          <div className="gpn-agreed-price-block">
            <span className="gpn-agreed-label">Agreed price</span>
            <span className="gpn-agreed-value">{formatPerVisitPrice(agreedPrice)}</span>
          </div>
          {commitmentFeeReminderMessage && (
            <div className="gpn-commitment-notice">{commitmentFeeReminderMessage}</div>
          )}
          <button
            className="gpn-btn gpn-btn--primary gpn-btn--wide"
            onClick={() => navigate(`/app/client/cart/${gigIdForPayment}`)}
          >
            Proceed to Payment →
          </button>
        </div>
      );
    }

    // ── Rejected ──
    if (status === 'Rejected') {
      return (
        <div className="gpn-terminal-section">
          <div className="gpn-terminal-icon">✕</div>
          <p className="gpn-terminal-title">Negotiation Rejected</p>
          <p className="gpn-terminal-sub">
            Rejected by: <strong>{rejectedBy}</strong>
            {rejectionReason ? ` — "${rejectionReason}"` : ''}
          </p>
          {isCareRequestHire ? (
            <>
              <p className="gpn-terminal-hint">
                This negotiation has ended. You can start a fresh negotiation with the same caregiver.
              </p>
              {careRequestMeta && (
                <button
                  className="gpn-btn gpn-btn--secondary"
                  onClick={handleReinit}
                  disabled={actionLoading === 'reinit'}
                >
                  {actionLoading === 'reinit' ? 'Starting…' : 'Start New Negotiation'}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="gpn-terminal-hint">
                You can pay the original listed price without negotiating, or start a new negotiation.
              </p>
              {originalGigId && (
                <button
                  className="gpn-btn gpn-btn--secondary"
                  onClick={() => navigate(`/app/client/cart/${originalGigId}`)}
                >
                  Pay Original Price
                </button>
              )}
            </>
          )}
        </div>
      );
    }

    // ── Expired ──
    if (status === 'Expired') {
      return (
        <div className="gpn-terminal-section">
          <div className="gpn-terminal-icon">⏰</div>
          <p className="gpn-terminal-title">Negotiation Expired</p>
          <p className="gpn-terminal-sub">This negotiation expired after 48 hours of inactivity.</p>
          {isCareRequestHire && careRequestMeta ? (
            <button
              className="gpn-btn gpn-btn--secondary"
              onClick={handleReinit}
              disabled={actionLoading === 'reinit'}
            >
              {actionLoading === 'reinit' ? 'Starting…' : 'Start New Negotiation'}
            </button>
          ) : !isCareRequestHire && originalGigId ? (
            <button
              className="gpn-btn gpn-btn--secondary"
              onClick={() => navigate(`/app/client/cart/${originalGigId}`)}
            >
              Pay Original Price
            </button>
          ) : null}
        </div>
      );
    }

    // ── ClientProposed — waiting for caregiver ──
    if (status === 'ClientProposed') {
      return (
        <div className="gpn-waiting-section">
          <div className="gpn-waiting-spinner" aria-hidden="true" />
          <p className="gpn-waiting-msg">Awaiting caregiver's response…</p>
          <div className="gpn-current-price-pill">
            Your proposal: <strong>{formatPerVisitPrice(currentProposedPrice)}</strong>
          </div>
          <button
            className="gpn-btn gpn-btn--danger-outline"
            onClick={() => setShowRejectConfirm(true)}
            disabled={!!actionLoading}
          >
            Withdraw / Reject
          </button>
        </div>
      );
    }

    // ── Initiated or CaregiverCountered — client's turn ──
    const priceLabel = status === 'CaregiverCountered'
      ? "Caregiver's counter-offer (per visit)"
      : isCareRequestHire
        ? "Caregiver's proposed rate (per visit)"
        : "Original listed price (per visit)";

    const displayPrice = currentProposedPrice ?? originalPrice;

    return (
      <div className="gpn-client-turn">
        <div className="gpn-price-display">
          <span className="gpn-price-label">{priceLabel}</span>
          <span className="gpn-price-value">{formatPerVisitPrice(displayPrice)}</span>
        </div>

        <button
          className="gpn-btn gpn-btn--primary"
          onClick={handleAccept}
          disabled={!!actionLoading}
        >
          {actionLoading === 'accept' ? 'Accepting…' : 'Accept this price'}
        </button>

        {canClientPropose && (
          <>
            <button
              className="gpn-btn gpn-btn--secondary"
              onClick={() => setShowProposePanel(!showProposePanel)}
              disabled={!!actionLoading}
            >
              {showProposePanel
                ? 'Cancel'
                : `Propose a lower price (${clientRemainingProposals} proposal${clientRemainingProposals !== 1 ? 's' : ''} left)`}
            </button>
            {showProposePanel && (
              <div className="gpn-input-panel">
                <label className="gpn-input-label">
                  Your proposed per-visit price (₦)
                  <span className="gpn-input-hint"> — must be lower than {formatPerVisitPrice(originalPrice)}</span>
                </label>
                <input
                  type="number"
                  className={`gpn-input${proposeInput && Number(proposeInput) <= 10000 ? ' gpn-input--error' : ''}`}
                  value={proposeInput}
                  onChange={(e) => setProposeInput(e.target.value)}
                  placeholder="e.g. 20000"
                  min="10001"
                />
                {proposeInput && Number(proposeInput) <= 10000 && (
                  <p className="gpn-input-error-msg">
                    ⚠️ Minimum gig price is ₦10,000. Your proposal must be above this amount.
                  </p>
                )}
                <label className="gpn-input-label">Note (optional)</label>
                <input
                  type="text"
                  className="gpn-input"
                  value={proposeNote}
                  onChange={(e) => setProposeNote(e.target.value)}
                  placeholder="Add a message to the caregiver"
                />
                <button
                  className="gpn-btn gpn-btn--primary"
                  onClick={handlePropose}
                  disabled={actionLoading === 'propose'}
                >
                  {actionLoading === 'propose' ? 'Submitting…' : 'Submit Proposal'}
                </button>
              </div>
            )}
          </>
        )}

        {!canClientPropose && clientProposalCount >= clientMaxProposals && (
          <p className="gpn-rounds-exhausted">
            You have used all {clientMaxProposals} proposals. You can accept or reject.
          </p>
        )}

        <button
          className="gpn-btn gpn-btn--danger-outline"
          onClick={() => setShowRejectConfirm(true)}
          disabled={!!actionLoading}
        >
          Reject Negotiation
        </button>
      </div>
    );
  };

  // ── Caregiver action area ──
  const renderCaregiverActions = () => {
    // ── Agreed ──
    if (status === 'Agreed') {
      return (
        <div className="gpn-agreed-section">
          <div className="gpn-agreed-price-block">
            <span className="gpn-agreed-label">Agreed price</span>
            <span className="gpn-agreed-value">{formatPerVisitPrice(agreedPrice)}</span>
          </div>
          <p className="gpn-agreed-sub">Awaiting client payment.</p>
        </div>
      );
    }

    // ── Rejected ──
    if (status === 'Rejected') {
      return (
        <div className="gpn-terminal-section">
          <div className="gpn-terminal-icon">✕</div>
          <p className="gpn-terminal-title">Negotiation Rejected</p>
          <p className="gpn-terminal-sub">
            Rejected by: <strong>{rejectedBy}</strong>
            {rejectionReason ? ` — "${rejectionReason}"` : ''}
          </p>
          <p className="gpn-terminal-hint">This negotiation has ended.</p>
        </div>
      );
    }

    // ── Expired ──
    if (status === 'Expired') {
      return (
        <div className="gpn-terminal-section">
          <div className="gpn-terminal-icon">⏰</div>
          <p className="gpn-terminal-title">Negotiation Expired</p>
          <p className="gpn-terminal-sub">This negotiation expired after 48 hours of inactivity.</p>
          <p className="gpn-terminal-hint">The client may start a new negotiation.</p>
        </div>
      );
    }

    // ── Initiated or CaregiverCountered — waiting for client ──
    if (status === 'Initiated' || status === 'CaregiverCountered') {
      return (
        <div className="gpn-waiting-section">
          <div className="gpn-waiting-spinner" aria-hidden="true" />
          <p className="gpn-waiting-msg">Awaiting client's response…</p>
          {status === 'CaregiverCountered' && (
            <div className="gpn-current-price-pill">
              Your counter-offer: <strong>{formatPerVisitPrice(currentProposedPrice)}</strong>
            </div>
          )}
          <button
            className="gpn-btn gpn-btn--danger-outline"
            onClick={() => setShowRejectConfirm(true)}
            disabled={!!actionLoading}
          >
            Reject Negotiation
          </button>
        </div>
      );
    }

    // ── ClientProposed — caregiver's turn ──
    return (
      <div className="gpn-caregiver-turn">
        <div className="gpn-price-display">
          <span className="gpn-price-label">Client's proposed price (per visit)</span>
          <span className="gpn-price-value">{formatPerVisitPrice(currentProposedPrice)}</span>
        </div>

        <button
          className="gpn-btn gpn-btn--primary"
          onClick={() => handleRespond(true)}
          disabled={!!actionLoading}
        >
          {actionLoading === 'respond' ? 'Processing…' : 'Accept this price'}
        </button>

        {canCaregiverCounter && (
          <>
            <button
              className="gpn-btn gpn-btn--secondary"
              onClick={() => setShowCounterPanel(!showCounterPanel)}
              disabled={!!actionLoading}
            >
              {showCounterPanel
                ? 'Cancel'
                : `Counter-propose (${caregiverRemainingCounters} counter${caregiverRemainingCounters !== 1 ? 's' : ''} left)`}
            </button>
            {showCounterPanel && (
              <div className="gpn-input-panel">
                <label className="gpn-input-label">
                  Your counter per-visit price (₦)
                  <span className="gpn-input-hint"> — must be above client's proposal but not above {formatPerVisitPrice(originalPrice)}</span>
                </label>
                <input
                  type="number"
                  className="gpn-input"
                  value={counterInput}
                  onChange={(e) => setCounterInput(e.target.value)}
                  placeholder="e.g. 28000"
                  min="10000"
                />
                <label className="gpn-input-label">Note (optional)</label>
                <input
                  type="text"
                  className="gpn-input"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Add a message to the client"
                />
                <button
                  className="gpn-btn gpn-btn--primary"
                  onClick={() => handleRespond(false)}
                  disabled={actionLoading === 'respond'}
                >
                  {actionLoading === 'respond' ? 'Submitting…' : 'Submit Counter'}
                </button>
              </div>
            )}
          </>
        )}

        {!canCaregiverCounter && caregiverCounterCount >= caregiverMaxCounters && (
          <p className="gpn-rounds-exhausted">
            You have used all {caregiverMaxCounters} counter-proposals. You can accept or reject.
          </p>
        )}

        <button
          className="gpn-btn gpn-btn--danger-outline"
          onClick={() => setShowRejectConfirm(true)}
          disabled={!!actionLoading}
        >
          Reject Negotiation
        </button>
      </div>
    );
  };

  // ── Main render ──
  return (
    <div className="gpn-page">
      <div className="gpn-container">

        {/* ── Header ── */}
        <div className="gpn-header">
          <button className="gpn-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="gpn-header-info">
            <h1 className="gpn-title">Price Negotiation</h1>
            {gigDetails?.title && <p className="gpn-gig-subtitle">{gigDetails.title}</p>}
          </div>
          {renderStatusBadge()}
        </div>

        {/* ── Countdown (non-terminal only) ── */}
        {countdown && (
          <div className={`gpn-countdown${countdown === 'Expiring soon' ? ' gpn-countdown--urgent' : ''}`}>
            ⏱ {countdown} before this negotiation expires
          </div>
        )}

        {/* ── Per-visit notice (always visible) ── */}
        <div className="gpn-per-visit-notice">
          All prices are <strong>per-visit rates</strong>. Total checkout amount depends on service type and visit frequency.
        </div>

        {/* ── Participants ── */}
        <div className="gpn-participants">
          <div className="gpn-participant">
            {renderParticipantAvatar(clientInfo, 'C')}
            <div>
              <div className="gpn-participant-name">{clientInfo?.name || 'Client'}</div>
              <div className="gpn-participant-role">Client</div>
            </div>
          </div>
          <div className="gpn-participant-sep">⇄</div>
          <div className="gpn-participant">
            {renderParticipantAvatar(caregiverInfo, 'G')}
            <div>
              <div className="gpn-participant-name">{caregiverInfo?.name || 'Caregiver'}</div>
              <div className="gpn-participant-role">Caregiver</div>
            </div>
          </div>
        </div>

        {/* ── Price summary card ── */}
        <div className="gpn-price-summary-card">
          <div className="gpn-price-summary-row">
            <span>Original / opening price</span>
            <strong>{formatPerVisitPrice(originalPrice)}</strong>
          </div>
          {currentProposedPrice != null && proposedBy !== 'None' && (
            <div className="gpn-price-summary-row">
              <span>Current proposed price ({proposedBy})</span>
              <strong>{formatPerVisitPrice(currentProposedPrice)}</strong>
            </div>
          )}
          {agreedPrice != null && (
            <div className="gpn-price-summary-row gpn-price-summary-row--agreed">
              <span>Agreed price</span>
              <strong>{formatPerVisitPrice(agreedPrice)}</strong>
            </div>
          )}
        </div>

        {/* ── Action area ── */}
        <div className="gpn-action-area">
          {isClient ? renderClientActions() : renderCaregiverActions()}
        </div>

        {/* ── Reject confirmation modal ── */}
        {showRejectConfirm && (
          <div
            className="gpn-modal-overlay"
            onClick={() => !actionLoading && setShowRejectConfirm(false)}
          >
            <div className="gpn-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="gpn-modal-title">Reject this negotiation?</h3>
              <p className="gpn-modal-body">
                This cannot be undone. The negotiation will be permanently closed.
              </p>
              <label className="gpn-input-label">Reason (optional)</label>
              <input
                type="text"
                className="gpn-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why are you rejecting?"
              />
              <div className="gpn-modal-actions">
                <button
                  className="gpn-btn gpn-btn--secondary"
                  onClick={() => setShowRejectConfirm(false)}
                  disabled={!!actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="gpn-btn gpn-btn--danger"
                  onClick={handleReject}
                  disabled={actionLoading === 'reject'}
                >
                  {actionLoading === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {renderHistory()}

      </div>
    </div>
  );
};

export default GigPriceNegotiation;

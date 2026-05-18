import { useState } from 'react';
import { toast } from 'react-toastify';
import bookingCommitmentService from '../../../services/bookingCommitmentService';
import './booking-commitments.css';

const BookingCommitments = () => {
  const currentAdmin = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const adminId = currentAdmin.id || currentAdmin.Id || '';

  const [gigId, setGigId]           = useState('');
  const [clientId, setClientId]     = useState('');
  const [reason, setReason]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gigId.trim() || !clientId.trim() || !reason.trim()) {
      toast.error('All fields are required');
      return;
    }
    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    setLoading(true);
    setLastResult(null);

    const result = await bookingCommitmentService.adminManualComplete(
      gigId.trim(),
      clientId.trim(),
      adminId,
      reason.trim()
    );

    setLoading(false);

    if (result.success) {
      toast.success('Booking commitment manually completed');
      setLastResult({ success: true, data: result.data });
      setGigId('');
      setClientId('');
      setReason('');
    } else {
      toast.error(result.error || 'Operation failed');
      setLastResult({ success: false, error: result.error });
    }
  };

  const handleReset = () => {
    setGigId('');
    setClientId('');
    setReason('');
    setLastResult(null);
  };

  return (
    <div className="bc-page">
      {/* Header */}
      <div className="bc-header">
        <div className="bc-header-icon">
          <i className="fas fa-handshake"></i>
        </div>
        <div>
          <h1>Booking Commitment Override</h1>
          <p>Manually mark a booking commitment as completed on behalf of a client</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bc-warning">
        <i className="fas fa-exclamation-triangle"></i>
        <div>
          <strong>Admin Action — Use with caution</strong>
          <p>This operation marks a booking commitment as paid/complete without collecting payment. Ensure you have proper authorisation and a valid reason before proceeding. All overrides are logged to the admin audit trail.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bc-card">
        <div className="bc-card-header">
          <i className="fas fa-tools"></i>
          <h2>Manual Completion Form</h2>
        </div>

        <form className="bc-form" onSubmit={handleSubmit}>
          <div className="bc-form-row">
            <div className="bc-form-group">
              <label htmlFor="bc-gig-id">
                Gig ID <span className="required">*</span>
              </label>
              <input
                id="bc-gig-id"
                type="text"
                value={gigId}
                onChange={(e) => setGigId(e.target.value)}
                placeholder="Enter the Gig ID…"
                disabled={loading}
                autoComplete="off"
              />
              <small>The unique identifier of the gig/booking in question</small>
            </div>

            <div className="bc-form-group">
              <label htmlFor="bc-client-id">
                Client ID <span className="required">*</span>
              </label>
              <input
                id="bc-client-id"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter the Client ID…"
                disabled={loading}
                autoComplete="off"
              />
              <small>The unique identifier of the client who should have paid</small>
            </div>
          </div>

          <div className="bc-form-group">
            <label htmlFor="bc-reason">
              Reason <span className="required">*</span>
            </label>
            <textarea
              id="bc-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear and specific reason for this manual override (min 10 characters)…"
              rows={4}
              disabled={loading}
            />
            <small className="char-hint">{reason.length} characters {reason.length < 10 && reason.length > 0 ? '— needs at least 10' : ''}</small>
          </div>

          {adminId && (
            <div className="bc-admin-info">
              <i className="fas fa-user-shield"></i>
              <span>Executing as admin: <strong>{currentAdmin.firstName || currentAdmin.email || adminId}</strong></span>
            </div>
          )}

          <div className="bc-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !gigId.trim() || !clientId.trim() || !reason.trim()}
            >
              {loading
                ? <><i className="fas fa-spinner fa-spin"></i> Processing…</>
                : <><i className="fas fa-check-circle"></i> Complete Commitment</>
              }
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <i className="fas fa-undo"></i> Reset
            </button>
          </div>
        </form>

        {/* Result */}
        {lastResult && (
          <div className={`bc-result ${lastResult.success ? 'bc-result--ok' : 'bc-result--err'}`}>
            {lastResult.success ? (
              <>
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Operation successful</strong>
                  {lastResult.data?.message && <p>{lastResult.data.message}</p>}
                </div>
              </>
            ) : (
              <>
                <i className="fas fa-times-circle"></i>
                <div>
                  <strong>Operation failed</strong>
                  {lastResult.error && <p>{lastResult.error}</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCommitments;

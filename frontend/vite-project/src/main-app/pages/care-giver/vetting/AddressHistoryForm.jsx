import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService from '../../../services/caregiverVettingService';
import './vetting.css';

const EMPTY_FORM = { address: '', movedIn: '', movedOut: '', isCurrent: false };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

const AddressHistoryForm = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const [records, setRecords] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [recResult, covResult] = await Promise.all([
      caregiverVettingService.getAddressHistory(),
      caregiverVettingService.getAddressHistoryCoverage(),
    ]);
    if (recResult.success) setRecords(recResult.data || []);
    else showToast('error', recResult.error);
    if (covResult.success) setCoverage(covResult.data);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ── Add / edit modal ──────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | record
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget('new');
  };

  const openEdit = (r) => {
    setForm({
      address: r.address || '',
      movedIn: r.movedIn ? r.movedIn.slice(0, 10) : '',
      movedOut: r.movedOut ? r.movedOut.slice(0, 10) : '',
      isCurrent: !r.movedOut,
    });
    setFormError(null);
    setEditTarget(r);
  };

  const closeModal = () => {
    if (saving) return;
    setEditTarget(null);
  };

  const today = new Date().toISOString().slice(0, 10);
  const dateOrderInvalid = !form.isCurrent && form.movedOut && form.movedIn && form.movedOut < form.movedIn;
  const canSubmitForm = form.address.trim().length >= 2 && !!form.movedIn && !dateOrderInvalid;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      address: form.address.trim(),
      movedIn: form.movedIn,
      movedOut: form.isCurrent ? null : (form.movedOut || null),
    };
    const result = editTarget === 'new'
      ? await caregiverVettingService.addAddressHistory(payload)
      : await caregiverVettingService.updateAddressHistory(editTarget.id, payload);

    if (result.success) {
      showToast('success', editTarget === 'new' ? 'Address added.' : 'Address updated.');
      setEditTarget(null);
      loadAll();
    } else {
      setFormError(result.error);
    }
    setSaving(false);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (r) => {
    if (!window.confirm('Remove this address entry?')) return;
    setDeletingId(r.id);
    const result = await caregiverVettingService.deleteAddressHistory(r.id);
    if (result.success) {
      showToast('success', 'Address removed.');
      loadAll();
    } else {
      showToast('error', result.error);
    }
    setDeletingId(null);
  };

  const isComplete = !!coverage?.isComplete;
  const requiredCount = coverage?.requiredCount ?? 2;
  const requiredYears = coverage?.requiredYears ?? 5;
  const recordCount = coverage?.recordCount ?? records.length;
  const progressPct = Math.min(100, Math.round((recordCount / requiredCount) * 100));

  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-home"></i> Address History</h1>
        <p>Submit where you've lived, covering the last {requiredYears} years.</p>
      </div>

      {toast && (
        <div className={`vet-alert vet-alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="vet-alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {!loading && coverage && (
        <div className="vet-panel">
          <div className="vet-panel-header">
            <h2>
              Coverage status:{' '}
              <span className={`vet-pkg-badge ${isComplete ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
                {isComplete ? 'Complete' : 'Incomplete'}
              </span>
            </h2>
          </div>
          <div className="vet-progress-track">
            <div className={`vet-progress-fill${isComplete ? ' vet-progress-fill--complete' : ''}`} style={{ width: `${progressPct}%` }}></div>
          </div>
          <div className="vet-explainer">
            {isComplete ? (
              <>
                <i className="fas fa-check-circle" style={{ color: '#2e7d32' }}></i>{' '}
                Your {recordCount} address record{recordCount === 1 ? '' : 's'} give{recordCount === 1 ? 's' : ''} contiguous coverage
                for the last {requiredYears} years. Nothing more needed here.
              </>
            ) : (
              <>
                <i className="fas fa-info-circle"></i>{' '}
                We need at least {requiredCount} address records that together cover the last {requiredYears} years
                with no gaps longer than about a month between one address ending and the next starting, right up
                to today. You currently have {recordCount} record{recordCount === 1 ? '' : 's'}
                {recordCount > 0 ? ' — check the dates below line up with no gaps, and that your most recent entry has no "moved out" date if you still live there.' : '.'}
              </>
            )}
          </div>
        </div>
      )}

      <div className="vet-panel">
        <div className="vet-panel-header">
          <h2>Your addresses</h2>
          <button className="vet-btn-primary vet-btn-sm" onClick={openAdd}>
            <i className="fas fa-plus"></i> Add Address
          </button>
        </div>

        {loading ? (
          <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>
        ) : records.length === 0 ? (
          <div className="vet-pkg-empty"><i className="fas fa-map-marker-alt"></i><p>No address history yet.</p></div>
        ) : (
          <ul className="vet-list">
            {records
              .slice()
              .sort((a, b) => new Date(b.movedIn) - new Date(a.movedIn))
              .map((r) => (
                <li key={r.id} className="vet-item">
                  <div className="vet-item-top">
                    <div>
                      <strong>{r.address}</strong>
                      <span className="vet-item-sub">
                        {fmtDate(r.movedIn)} — {r.movedOut ? fmtDate(r.movedOut) : 'Present'}
                      </span>
                    </div>
                    {!r.movedOut && <span className="vet-pkg-badge vet-pkg-badge--active">Current</span>}
                  </div>
                  <div className="vet-item-actions">
                    <button className="vet-btn-secondary vet-btn-sm" onClick={() => openEdit(r)}>
                      <i className="fas fa-pen"></i> Edit
                    </button>
                    <button
                      className="vet-btn-danger vet-btn-sm"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id
                        ? <><i className="fas fa-vet-spinner fa-spin"></i> Removing…</>
                        : <><i className="fas fa-trash"></i> Remove</>}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {editTarget && (
        <div className="vet-pkg-modal-overlay" onClick={closeModal}>
          <div className="vet-pkg-modal vet-pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="vet-pkg-modal-header">
              <h2><i className="fas fa-home"></i> {editTarget === 'new' ? 'Add Address' : 'Edit Address'}</h2>
              <button className="vet-pkg-modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="vet-pkg-modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="vet-form-group">
                  <label htmlFor="a-address">Address <span className="vet-required">*</span></label>
                  <textarea id="a-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="vet-form-row">
                  <div className="vet-form-group">
                    <label htmlFor="a-moved-in">Moved In <span className="vet-required">*</span></label>
                    <input id="a-moved-in" type="date" max={today} value={form.movedIn} onChange={(e) => setForm({ ...form, movedIn: e.target.value })} required />
                  </div>
                  <div className="vet-form-group">
                    <label htmlFor="a-moved-out">Moved Out</label>
                    <input
                      id="a-moved-out"
                      type="date"
                      max={today}
                      value={form.movedOut}
                      disabled={form.isCurrent}
                      onChange={(e) => setForm({ ...form, movedOut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="vet-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, movedOut: e.target.checked ? '' : form.movedOut })}
                      style={{ width: 'auto', marginRight: '0.5rem' }}
                    />
                    I currently live here
                  </label>
                </div>
                {dateOrderInvalid && (
                  <p className="vet-field-error">Move-out date can't be before the move-in date.</p>
                )}

                {formError && (
                  <div className="vet-alert vet-alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <div><p>{formError}</p></div>
                  </div>
                )}

                <div className="vet-form-actions">
                  <button type="button" className="vet-btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="vet-btn-primary" disabled={!canSubmitForm || saving}>
                    {saving
                      ? <><i className="fas fa-vet-spinner fa-spin"></i> Saving…</>
                      : <><i className="fas fa-check"></i> {editTarget === 'new' ? 'Add Address' : 'Save Changes'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressHistoryForm;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, {
  REQUIRED_GUARANTOR_COUNT,
  MIN_GUARANTOR_YEARS_KNOWN,
  GUARANTOR_RELATIONSHIP_CATEGORIES,
} from '../../../services/caregiverVettingService';
import './vetting.css';

const EMPTY_FORM = {
  name: '', relationshipCategory: '', relationshipToCaregiver: '', yearsKnown: '', phoneNo: '', email: '', address: '',
};

// pending: waiting on the guarantor. needs_review: they answered and staff are checking. rejected: staff declined.
const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'vet-pkg-badge--inactive' },
  needs_review: { label: 'Under review', cls: 'vet-pkg-badge--inactive' },
  confirmed: { label: 'Confirmed', cls: 'vet-pkg-badge--active' },
  rejected: { label: 'Not accepted', cls: 'vet-pkg-badge--inactive' },
};

const CONFIRMATION_METHOD_LABEL = {
  staff_override: 'Staff override',
  staff_review: 'Approved by staff',
};
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const GuarantorsForm = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGuarantors = async () => {
    setLoading(true);
    const result = await caregiverVettingService.getGuarantors();
    if (result.success) {
      setGuarantors(result.data || []);
    } else {
      showToast('error', result.error);
    }
    setLoading(false);
  };

  useEffect(() => { loadGuarantors(); }, []);

  // ── Add / edit modal ──────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // null = closed, 'new' = adding, object = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const atLimit = guarantors.length >= REQUIRED_GUARANTOR_COUNT;

  const openAdd = () => {
    if (atLimit) return;
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget('new');
  };

  const openEdit = (g) => {
    if (g.status !== 'pending') return;
    setForm({
      name: g.name || '',
      relationshipCategory: g.relationshipCategory || '',
      relationshipToCaregiver: g.relationshipToCaregiver || '',
      yearsKnown: g.yearsKnown != null ? String(g.yearsKnown) : '',
      phoneNo: g.phoneNo || '',
      email: g.email || '',
      address: g.address || '',
    });
    setFormError(null);
    setEditTarget(g);
  };

  const closeModal = () => {
    if (saving) return;
    setEditTarget(null);
  };

  const yearsKnownNumber = Number(form.yearsKnown);
  const yearsKnownValid = Number.isInteger(yearsKnownNumber) && yearsKnownNumber >= MIN_GUARANTOR_YEARS_KNOWN && yearsKnownNumber <= 80;
  const canSubmitForm = Object.values(form).every((v) => v.trim().length > 0) && yearsKnownValid;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      relationshipCategory: form.relationshipCategory,
      relationshipToCaregiver: form.relationshipToCaregiver.trim(),
      yearsKnown: yearsKnownNumber,
      phoneNo: form.phoneNo.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    const result = editTarget === 'new'
      ? await caregiverVettingService.addGuarantor(payload)
      : await caregiverVettingService.updateGuarantor(editTarget.id, payload);

    if (result.success) {
      showToast('success', editTarget === 'new' ? 'Guarantor added.' : 'Guarantor updated.');
      setEditTarget(null);
      loadGuarantors();
    } else {
      setFormError(result.error);
    }
    setSaving(false);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (g) => {
    if (!window.confirm(`Remove ${g.name} as a guarantor?`)) return;
    setDeletingId(g.id);
    const result = await caregiverVettingService.deleteGuarantor(g.id);
    if (result.success) {
      showToast('success', `${g.name} removed.`);
      loadGuarantors();
    } else {
      showToast('error', result.error);
    }
    setDeletingId(null);
  };

  // ── Send / resend confirmation ────────────────────────────────
  const [sendingId, setSendingId] = useState(null);
  const handleSendConfirmation = async (g) => {
    setSendingId(g.id);
    const result = await caregiverVettingService.sendGuarantorConfirmation(g.id);
    if (result.success) {
      showToast('success', `Confirmation email sent to ${g.name}.`);
      loadGuarantors();
    } else {
      showToast('error', result.error);
    }
    setSendingId(null);
  };

  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-user-shield"></i> Guarantors</h1>
        <p>
          Add exactly {REQUIRED_GUARANTOR_COUNT} guarantors who can vouch for you. They must have known you for at
          least {MIN_GUARANTOR_YEARS_KNOWN} years. Each one gets an email with a link where they answer a few short
          questions about you (how they know you, how long, and so on). Their answers are compared with what you
          enter here, so please be accurate — if anything does not match, our team will review it before the
          guarantor counts toward your vetting. Send or resend that email from here.
        </p>
      </div>

      {toast && (
        <div className={`vet-alert vet-alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="vet-alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="vet-panel">
        <div className="vet-panel-header">
          <h2>{guarantors.length} of {REQUIRED_GUARANTOR_COUNT} guarantors</h2>
          <button className="vet-btn-primary vet-btn-sm" onClick={openAdd} disabled={atLimit}>
            <i className="fas fa-plus"></i> Add Guarantor
          </button>
        </div>

        {atLimit && (
          <p className="vet-cap-note">
            <i className="fas fa-info-circle"></i> You've reached the limit of {REQUIRED_GUARANTOR_COUNT} guarantors.
            Remove one before adding another.
          </p>
        )}

        {loading ? (
          <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>
        ) : guarantors.length === 0 ? (
          <div className="vet-pkg-empty"><i className="fas fa-user-slash"></i><p>You haven't added any guarantors yet.</p></div>
        ) : (
          <ul className="vet-list">
            {guarantors.map((g) => {
              const isConfirmed = g.status === 'confirmed';
              const isPending = g.status === 'pending';
              const badge = STATUS_BADGE[g.status] || STATUS_BADGE.pending;
              return (
                <li key={g.id} className="vet-item">
                  <div className="vet-item-top">
                    <div>
                      <strong>{g.name}</strong>
                      <span className="vet-item-sub">
                        {g.relationshipToCaregiver}{g.yearsKnown != null ? ` · known ${g.yearsKnown} yr${g.yearsKnown === 1 ? '' : 's'}` : ''}
                      </span>
                    </div>
                    <span className={`vet-pkg-badge ${badge.cls}`}>{badge.label}</span>
                  </div>

                  <div className="vet-item-detail">
                    <span><i className="fas fa-phone"></i> {g.phoneNo}</span>
                    <span><i className="fas fa-envelope"></i> {g.email}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {g.address}</span>
                  </div>

                  {isConfirmed ? (
                    <div className="vet-item-meta">
                      <span>Confirmed {fmtDate(g.verifiedAt)}</span>
                      {g.confirmationMethod && <span className="vet-pkg-badge vet-pkg-badge--type">{CONFIRMATION_METHOD_LABEL[g.confirmationMethod] || 'Self-confirmed'}</span>}
                    </div>
                  ) : g.status === 'needs_review' ? (
                    <div className="vet-item-meta">
                      <span>Your guarantor has answered. Our team is reviewing their answers — nothing more for you to do.</span>
                    </div>
                  ) : g.status === 'rejected' ? (
                    <div className="vet-item-meta">
                      <span>We couldn't accept this guarantor. Remove them and add someone else who knows you well.</span>
                    </div>
                  ) : (
                    <div className="vet-item-meta">
                      <span>Attempts sent: {g.attemptCount ?? 0}</span>
                      {g.lastAttemptAt && <span>Last sent: {fmtDate(g.lastAttemptAt)}</span>}
                    </div>
                  )}

                  <div className="vet-item-actions">
                    {isPending && (
                      <>
                        <button
                          className="vet-btn-secondary vet-btn-sm"
                          onClick={() => handleSendConfirmation(g)}
                          disabled={sendingId === g.id}
                        >
                          {sendingId === g.id
                            ? <><i className="fas fa-vet-spinner fa-spin"></i> Sending…</>
                            : <><i className="fas fa-paper-plane"></i> {(g.attemptCount ?? 0) > 0 ? 'Resend' : 'Send'} Confirmation</>}
                        </button>
                        <button className="vet-btn-secondary vet-btn-sm" onClick={() => openEdit(g)}>
                          <i className="fas fa-pen"></i> Edit
                        </button>
                      </>
                    )}
                    <button
                      className="vet-btn-danger vet-btn-sm"
                      onClick={() => handleDelete(g)}
                      disabled={deletingId === g.id}
                    >
                      {deletingId === g.id
                        ? <><i className="fas fa-vet-spinner fa-spin"></i> Removing…</>
                        : <><i className="fas fa-trash"></i> Remove</>}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editTarget && (
        <div className="vet-pkg-modal-overlay" onClick={closeModal}>
          <div className="vet-pkg-modal vet-pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="vet-pkg-modal-header">
              <h2><i className="fas fa-user-shield"></i> {editTarget === 'new' ? 'Add Guarantor' : 'Edit Guarantor'}</h2>
              <button className="vet-pkg-modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="vet-pkg-modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="vet-form-group">
                  <label htmlFor="g-name">Full Name <span className="vet-required">*</span></label>
                  <input id="g-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="vet-form-group">
                  <label htmlFor="g-category">How do they know you? <span className="vet-required">*</span></label>
                  <select id="g-category" value={form.relationshipCategory} onChange={(e) => setForm({ ...form, relationshipCategory: e.target.value })} required>
                    <option value="">Select…</option>
                    {GUARANTOR_RELATIONSHIP_CATEGORIES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="vet-form-row">
                  <div className="vet-form-group">
                    <label htmlFor="g-relationship">Relationship to You <span className="vet-required">*</span></label>
                    <input id="g-relationship" type="text" placeholder="e.g. Uncle, Employer, Pastor" value={form.relationshipToCaregiver} onChange={(e) => setForm({ ...form, relationshipToCaregiver: e.target.value })} required />
                  </div>
                  <div className="vet-form-group">
                    <label htmlFor="g-years">Years they've known you <span className="vet-required">*</span></label>
                    <input id="g-years" type="number" min={MIN_GUARANTOR_YEARS_KNOWN} max="80" step="1" value={form.yearsKnown} onChange={(e) => setForm({ ...form, yearsKnown: e.target.value })} required />
                    {form.yearsKnown !== '' && !yearsKnownValid && (
                      <small className="vet-field-error">At least {MIN_GUARANTOR_YEARS_KNOWN} years.</small>
                    )}
                  </div>
                </div>
                <div className="vet-form-row">
                  <div className="vet-form-group">
                    <label htmlFor="g-phone">Phone Number <span className="vet-required">*</span></label>
                    <input id="g-phone" type="tel" value={form.phoneNo} onChange={(e) => setForm({ ...form, phoneNo: e.target.value })} required />
                  </div>
                  <div className="vet-form-group">
                    <label htmlFor="g-email">Email <span className="vet-required">*</span></label>
                    <input id="g-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="vet-form-group">
                  <label htmlFor="g-address">Address <span className="vet-required">*</span></label>
                  <textarea id="g-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>

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
                      : <><i className="fas fa-check"></i> {editTarget === 'new' ? 'Add Guarantor' : 'Save Changes'}</>}
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

export default GuarantorsForm;

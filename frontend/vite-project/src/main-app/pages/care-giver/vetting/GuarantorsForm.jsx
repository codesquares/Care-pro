import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, { REQUIRED_GUARANTOR_COUNT } from '../../../services/caregiverVettingService';
import './vetting.css';

const EMPTY_FORM = { name: '', relationshipToCaregiver: '', phoneNo: '', email: '', address: '' };
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
      relationshipToCaregiver: g.relationshipToCaregiver || '',
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

  const canSubmitForm = Object.values(form).every((v) => v.trim().length > 0);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      relationshipToCaregiver: form.relationshipToCaregiver.trim(),
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
          Add exactly {REQUIRED_GUARANTOR_COUNT} guarantors who can vouch for you. Each one gets a confirmation
          email with a link they must click before they count toward your vetting — trigger or resend that
          email from here.
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
              return (
                <li key={g.id} className="vet-item">
                  <div className="vet-item-top">
                    <div>
                      <strong>{g.name}</strong>
                      <span className="vet-item-sub">{g.relationshipToCaregiver}</span>
                    </div>
                    <span className={`vet-pkg-badge ${isConfirmed ? 'vet-pkg-badge--active' : 'vet-pkg-badge--inactive'}`}>
                      {isConfirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>

                  <div className="vet-item-detail">
                    <span><i className="fas fa-phone"></i> {g.phoneNo}</span>
                    <span><i className="fas fa-envelope"></i> {g.email}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {g.address}</span>
                  </div>

                  {isConfirmed ? (
                    <div className="vet-item-meta">
                      <span>Confirmed {fmtDate(g.verifiedAt)}</span>
                      {g.confirmationMethod && <span className="vet-pkg-badge vet-pkg-badge--type">{g.confirmationMethod === 'staff_override' ? 'Staff override' : 'Self-confirmed'}</span>}
                    </div>
                  ) : (
                    <div className="vet-item-meta">
                      <span>Attempts sent: {g.attemptCount ?? 0}</span>
                      {g.lastAttemptAt && <span>Last sent: {fmtDate(g.lastAttemptAt)}</span>}
                    </div>
                  )}

                  <div className="vet-item-actions">
                    {!isConfirmed && (
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
                  <label htmlFor="g-relationship">Relationship to You <span className="vet-required">*</span></label>
                  <input id="g-relationship" type="text" placeholder="e.g. Uncle, Employer, Pastor" value={form.relationshipToCaregiver} onChange={(e) => setForm({ ...form, relationshipToCaregiver: e.target.value })} required />
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

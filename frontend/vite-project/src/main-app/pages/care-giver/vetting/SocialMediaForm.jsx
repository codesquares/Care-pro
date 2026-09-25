import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, { SOCIAL_MEDIA_PLATFORMS } from '../../../services/caregiverVettingService';
import './vetting.css';

const EMPTY_FORM = { platform: SOCIAL_MEDIA_PLATFORMS[0], handle: '' };

const SocialMediaForm = () => {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  const [handles, setHandles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHandles = async () => {
    setLoading(true);
    const result = await caregiverVettingService.getSocialMediaHandles();
    if (result.success) setHandles(result.data || []);
    else showToast('error', result.error);
    setLoading(false);
  };

  useEffect(() => { loadHandles(); }, []);

  // ── Add / edit modal ──────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | handle
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditTarget('new');
  };

  const openEdit = (h) => {
    setForm({
      platform: SOCIAL_MEDIA_PLATFORMS.includes(h.platform) ? h.platform : SOCIAL_MEDIA_PLATFORMS[0],
      handle: h.handle || '',
    });
    setFormError(null);
    setEditTarget(h);
  };

  const closeModal = () => {
    if (saving) return;
    setEditTarget(null);
  };

  const canSubmitForm = form.handle.trim().length > 0;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitForm) return;
    setSaving(true);
    setFormError(null);
    const payload = { platform: form.platform, handle: form.handle.trim() };
    const result = editTarget === 'new'
      ? await caregiverVettingService.addSocialMediaHandle(payload)
      : await caregiverVettingService.updateSocialMediaHandle(editTarget.id, payload);

    if (result.success) {
      showToast('success', editTarget === 'new' ? 'Social media handle added.' : 'Handle updated.');
      setEditTarget(null);
      loadHandles();
    } else {
      setFormError(result.error);
    }
    setSaving(false);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const handleDelete = async (h) => {
    if (!window.confirm(`Remove your ${h.platform} handle?`)) return;
    setDeletingId(h.id);
    const result = await caregiverVettingService.deleteSocialMediaHandle(h.id);
    if (result.success) {
      showToast('success', 'Handle removed.');
      loadHandles();
    } else {
      showToast('error', result.error);
    }
    setDeletingId(null);
  };

  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-share-alt"></i> Social Media</h1>
        <p>Add your social media handles so we can verify your public presence.</p>
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
          <h2>{handles.length} handle{handles.length === 1 ? '' : 's'}</h2>
          <button className="vet-btn-primary vet-btn-sm" onClick={openAdd}>
            <i className="fas fa-plus"></i> Add Handle
          </button>
        </div>

        {loading ? (
          <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>
        ) : handles.length === 0 ? (
          <div className="vet-pkg-empty"><i className="fas fa-share-alt"></i><p>No social media handles added yet.</p></div>
        ) : (
          <ul className="vet-list">
            {handles.map((h) => (
              <li key={h.id} className="vet-item">
                <div className="vet-item-top">
                  <div>
                    <strong>{h.platform}</strong>
                    <span className="vet-item-sub">{h.handle}</span>
                  </div>
                </div>
                <div className="vet-item-actions">
                  <button className="vet-btn-secondary vet-btn-sm" onClick={() => openEdit(h)}>
                    <i className="fas fa-pen"></i> Edit
                  </button>
                  <button
                    className="vet-btn-danger vet-btn-sm"
                    onClick={() => handleDelete(h)}
                    disabled={deletingId === h.id}
                  >
                    {deletingId === h.id
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
              <h2><i className="fas fa-share-alt"></i> {editTarget === 'new' ? 'Add Handle' : 'Edit Handle'}</h2>
              <button className="vet-pkg-modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="vet-pkg-modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="vet-form-group">
                  <label htmlFor="s-platform">Platform <span className="vet-required">*</span></label>
                  <select id="s-platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    {SOCIAL_MEDIA_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="vet-form-group">
                  <label htmlFor="s-handle">Handle / Username <span className="vet-required">*</span></label>
                  <input id="s-handle" type="text" placeholder="e.g. @yourname" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} required />
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
                      : <><i className="fas fa-check"></i> {editTarget === 'new' ? 'Add Handle' : 'Save Changes'}</>}
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

export default SocialMediaForm;

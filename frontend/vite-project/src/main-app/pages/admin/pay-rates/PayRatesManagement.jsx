import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminPayRateService from '../../../services/adminPayRateService';
import './pay-rates-management.css';

// ─── constants (mirror the backend's fixed value sets exactly) ─────
const CAREGIVER_TYPES = ['AuxiliaryNurse', 'CHEW', 'RegisteredNurse'];
const EXPERIENCE_TIERS = ['Junior', 'Mid', 'Senior'];

const emptyForm = {
  caregiverType: CAREGIVER_TYPES[0],
  experienceTier: EXPERIENCE_TIERS[0],
  hourlyRate: '',
};

const fmtNaira = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `₦${Number(value).toLocaleString('en-NG')}`;

/** Client-side mirror of the backend's validation rules, for immediate feedback. */
const validateForm = (form) => {
  const errors = [];
  if (!CAREGIVER_TYPES.includes(form.caregiverType)) errors.push('Choose a valid caregiver type.');
  if (!EXPERIENCE_TIERS.includes(form.experienceTier)) errors.push('Choose a valid experience tier.');
  const rate = Number(form.hourlyRate);
  if (form.hourlyRate === '' || Number.isNaN(rate) || rate < 0) {
    errors.push('Hourly rate must be a non-negative number.');
  }
  return errors;
};

const PayRatesManagement = () => {
  const [rates, setRates] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('All');
  const [showInactive, setShowInactive] = useState(true);

  const [toast, setToast] = useState(null); // { type, msg }

  // create/edit modal — editingId === null means "create"; a truthy id means "edit"
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRates = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const result = await AdminPayRateService.getAllPayRates();
    if (result.success) {
      setRates(result.data || []);
    } else {
      setListError(result.error || 'Failed to load pay rates');
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const visibleRates = useMemo(() => {
    return rates.filter((r) => {
      if (typeFilter !== 'All' && r.caregiverType !== typeFilter) return false;
      if (!showInactive && !r.isActive) return false;
      return true;
    });
  }, [rates, typeFilter, showInactive]);

  // ─── create/edit modal ──────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (rate) => {
    setEditingId(rate.id);
    setForm({
      caregiverType: rate.caregiverType,
      experienceTier: rate.experienceTier,
      hourlyRate: String(rate.hourlyRate ?? ''),
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const handleFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (errors.length > 0) return;

    setSaving(true);
    const payload = {
      caregiverType: form.caregiverType,
      experienceTier: form.experienceTier,
      hourlyRate: Number(form.hourlyRate),
    };
    const result = editingId
      ? await AdminPayRateService.updatePayRate(editingId, payload)
      : await AdminPayRateService.createPayRate(payload);

    if (result.success) {
      showToast('success', result.message || (editingId ? 'Pay rate updated' : 'Pay rate created'));
      setFormOpen(false);
      loadRates();
    } else {
      setFormErrors([result.error || 'Failed to save pay rate']);
    }
    setSaving(false);
  };

  // ─── toggle active ──────────────────────────────────────
  const handleToggleActive = async (rate) => {
    setTogglingId(rate.id);
    const nextActive = !rate.isActive;
    const result = await AdminPayRateService.toggleActiveStatus(rate.id, nextActive);
    if (result.success) {
      showToast('success', result.message || `Pay rate ${nextActive ? 'activated' : 'deactivated'}`);
      loadRates();
    } else {
      showToast('error', result.error || 'Failed to toggle pay rate status');
    }
    setTogglingId(null);
  };

  // ─── delete ─────────────────────────────────────────────
  const confirmDelete = (rate) => setDeleteTarget(rate);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await AdminPayRateService.deletePayRate(deleteTarget.id);
    if (result.success) {
      showToast('success', result.message || 'Pay rate deleted');
      setDeleteTarget(null);
      loadRates();
    } else {
      showToast('error', result.error || 'Failed to delete pay rate');
      setDeleteTarget(null);
    }
    setDeleteLoading(false);
  };

  return (
    <div className="pay-rates-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-money-check-alt"></i>
          </div>
          <div>
            <h1>Caregiver Pay Rates</h1>
            <p>Manage the hourly rate table used to calculate payroll for hourly-pay packages</p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Controls */}
      <div className="rate-controls">
        <label className="rate-inactive-toggle">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
        <button className="payrate-btn-secondary btn-sm" onClick={loadRates} disabled={loadingList}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
        <button className="payrate-btn-primary btn-sm" onClick={openCreate}>
          <i className="fas fa-plus"></i> Add Pay Rate
        </button>
      </div>

      {/* Caregiver type filter pills */}
      <div className="rate-type-filters">
        {['All', ...CAREGIVER_TYPES].map((t) => (
          <button
            key={t}
            className={`pkg-pill${typeFilter === t ? ' pkg-pill--active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {listError && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <div><p>{listError}</p></div>
        </div>
      )}

      {loadingList ? (
        <div className="pkg-loading"><div className="spinner"></div><p>Loading…</p></div>
      ) : visibleRates.length === 0 ? (
        <div className="pkg-empty">
          <i className="fas fa-inbox"></i>
          <p>{rates.length === 0 ? 'No pay rates yet' : 'No pay rates match your filters'}</p>
          {rates.length === 0 && (
            <button className="payrate-btn-primary" onClick={openCreate}>
              <i className="fas fa-plus"></i> Add First Pay Rate
            </button>
          )}
        </div>
      ) : (
        <div className="pkg-table-wrap">
          <table className="pkg-table">
            <thead>
              <tr>
                <th>Caregiver Type</th>
                <th>Experience Tier</th>
                <th>Hourly Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRates.map((r) => (
                <tr key={r.id} className={r.isActive ? '' : 'pkg-row--inactive'}>
                  <td><span className="pkg-badge pkg-badge--type">{r.caregiverType}</span></td>
                  <td>{r.experienceTier}</td>
                  <td className="pkg-price-cell">{fmtNaira(r.hourlyRate)}/hr</td>
                  <td>
                    <span className={`pkg-badge ${r.isActive ? 'pkg-badge--active' : 'pkg-badge--inactive'}`}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="pkg-actions">
                    <button className="btn-icon btn-icon--edit" title="Edit" onClick={() => openEdit(r)}>
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className={`btn-icon ${r.isActive ? 'btn-icon--toggle-off' : 'btn-icon--toggle-on'}`}
                      title={r.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() => handleToggleActive(r)}
                      disabled={togglingId === r.id}
                    >
                      <i className={`fas ${r.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    <button className="btn-icon btn-icon--delete" title="Delete" onClick={() => confirmDelete(r)}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pkg-count">
            {visibleRates.length} of {rates.length} pay rate{rates.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {formOpen && (
        <div className="pkg-modal-overlay" onClick={closeForm}>
          <div className="pkg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <h2>
                <i className={`fas ${editingId ? 'fa-pencil-alt' : 'fa-plus'}`}></i>
                {editingId ? 'Edit Pay Rate' : 'Add Pay Rate'}
              </h2>
              <button className="pkg-modal-close" onClick={closeForm}><i className="fas fa-times"></i></button>
            </div>
            <div className="pkg-modal-body">
              {formErrors.length > 0 && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <div>{formErrors.map((err) => <p key={err}>{err}</p>)}</div>
                </div>
              )}
              <form onSubmit={handleFormSubmit} className="pkg-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rate-caregiver-type">Caregiver Type <span className="required">*</span></label>
                    <select
                      id="rate-caregiver-type"
                      value={form.caregiverType}
                      onChange={(e) => handleFormField('caregiverType', e.target.value)}
                    >
                      {CAREGIVER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="rate-experience-tier">Experience Tier <span className="required">*</span></label>
                    <select
                      id="rate-experience-tier"
                      value={form.experienceTier}
                      onChange={(e) => handleFormField('experienceTier', e.target.value)}
                    >
                      {EXPERIENCE_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rate-hourly">Hourly Rate (₦) <span className="required">*</span></label>
                  <input
                    id="rate-hourly"
                    type="number"
                    min="0"
                    step="1"
                    value={form.hourlyRate}
                    onChange={(e) => handleFormField('hourlyRate', e.target.value)}
                    required
                  />
                </div>

                <p className="form-hint">
                  Only one active rate is allowed per (Caregiver Type, Experience Tier) pair — creating a new
                  active rate for a pair that already has one will be rejected; deactivate the old one first.
                </p>

                <div className="form-actions">
                  <button type="button" className="payrate-btn-secondary" onClick={closeForm} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="payrate-btn-primary" disabled={saving}>
                    {saving
                      ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                      : <><i className="fas fa-save"></i> {editingId ? 'Save Changes' : 'Create Pay Rate'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <div className="pkg-modal-overlay" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="pkg-modal pkg-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header pkg-modal-header--danger">
              <h2><i className="fas fa-exclamation-triangle"></i> Confirm Delete</h2>
            </div>
            <div className="pkg-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to permanently delete the rate for{' '}
                <strong>{deleteTarget.caregiverType} — {deleteTarget.experienceTier}</strong>?
                <br /><small style={{ color: '#999' }}>This cannot be undone.</small>
              </p>
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button className="payrate-btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                  Cancel
                </button>
                <button className="payrate-btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                  {deleteLoading
                    ? <><i className="fas fa-spinner fa-spin"></i> Deleting…</>
                    : <><i className="fas fa-trash-alt"></i> Delete</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayRatesManagement;

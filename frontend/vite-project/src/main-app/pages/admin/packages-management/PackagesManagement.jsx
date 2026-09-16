import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminPackageService from '../../../services/adminPackageService';
import './packages-management.css';

// ─── constants (mirror the backend's fixed value sets exactly) ─────
const CATEGORIES = ['Adult/Elder Care', 'Post-Partum Care', 'Post Surgery Care', 'Live-in Package'];
const CAREGIVER_TYPES = ['AuxiliaryNurse', 'CHEW', 'RegisteredNurse'];
const PAY_CALCULATION_TYPES = ['Hourly', 'Fixed'];
// TierLabel is free text on the backend (Post-Partum Care only uses 2 of the
// usual 3 tiers), so this is a suggestion list, not an enforced set.
const TIER_LABEL_SUGGESTIONS = ['Essential', 'Standard', 'Premium'];

const emptyForm = {
  category: CATEGORIES[0],
  tierLabel: '',
  requiredCaregiverType: CAREGIVER_TYPES[0],
  requiredSpecialty: '',
  basePrice: '',
  additionalDayPrice: '',
  payCalculationType: 'Hourly',
  fixedCaregiverPay: '',
  description: '',
};

const fmtNaira = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `₦${Number(value).toLocaleString('en-NG')}`;

/** Client-side mirror of the backend's validation rules, for immediate feedback. */
const validateForm = (form) => {
  const errors = [];
  if (!CATEGORIES.includes(form.category)) errors.push('Choose a valid category.');
  if (!form.tierLabel.trim() || form.tierLabel.trim().length > 80) {
    errors.push('Tier label is required (max 80 characters).');
  }
  if (!CAREGIVER_TYPES.includes(form.requiredCaregiverType)) {
    errors.push('Choose a valid required caregiver type.');
  }
  if (form.requiredSpecialty && form.requiredSpecialty.length > 120) {
    errors.push('Required specialty must be 120 characters or fewer.');
  }
  const basePrice = Number(form.basePrice);
  if (form.basePrice === '' || Number.isNaN(basePrice) || basePrice < 0) {
    errors.push('Base price must be a non-negative number.');
  }
  if (form.additionalDayPrice !== '' && form.additionalDayPrice !== null) {
    const extra = Number(form.additionalDayPrice);
    if (Number.isNaN(extra) || extra < 0) errors.push('Additional day price must be a non-negative number.');
  }
  if (!PAY_CALCULATION_TYPES.includes(form.payCalculationType)) {
    errors.push('Choose a valid pay calculation type.');
  }
  if (form.payCalculationType === 'Fixed') {
    const fixedPay = Number(form.fixedCaregiverPay);
    if (form.fixedCaregiverPay === '' || Number.isNaN(fixedPay) || fixedPay <= 0) {
      errors.push('Fixed caregiver pay is required and must be greater than 0 when pay type is Fixed.');
    }
  }
  if (form.description && form.description.length > 2000) {
    errors.push('Description must be 2000 characters or fewer.');
  }
  return errors;
};

const buildPayload = (form) => {
  const payload = {
    category: form.category,
    tierLabel: form.tierLabel.trim(),
    requiredCaregiverType: form.requiredCaregiverType,
    requiredSpecialty: form.requiredSpecialty.trim(), // '' explicitly clears it on update
    basePrice: Number(form.basePrice),
    payCalculationType: form.payCalculationType,
    description: form.description.trim(),
  };
  payload.additionalDayPrice =
    form.additionalDayPrice === '' || form.additionalDayPrice === null
      ? null
      : Number(form.additionalDayPrice);
  if (form.payCalculationType === 'Fixed') {
    payload.fixedCaregiverPay = Number(form.fixedCaregiverPay);
  }
  return payload;
};

const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
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

  const loadPackages = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const result = await AdminPackageService.getAllPackages();
    if (result.success) {
      setPackages(result.data || []);
    } else {
      setListError(result.error || 'Failed to load packages');
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const visiblePackages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return packages.filter((p) => {
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (!showInactive && !p.isActive) return false;
      if (term) {
        const haystack = `${p.tierLabel} ${p.requiredSpecialty || ''} ${p.description || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [packages, categoryFilter, searchTerm, showInactive]);

  // ─── create/edit modal ──────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (pkg) => {
    setEditingId(pkg.id);
    setForm({
      category: pkg.category,
      tierLabel: pkg.tierLabel,
      requiredCaregiverType: pkg.requiredCaregiverType,
      requiredSpecialty: pkg.requiredSpecialty || '',
      basePrice: String(pkg.basePrice ?? ''),
      additionalDayPrice: pkg.additionalDayPrice === null || pkg.additionalDayPrice === undefined ? '' : String(pkg.additionalDayPrice),
      payCalculationType: pkg.payCalculationType || 'Hourly',
      fixedCaregiverPay: pkg.fixedCaregiverPay === null || pkg.fixedCaregiverPay === undefined ? '' : String(pkg.fixedCaregiverPay),
      description: pkg.description || '',
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const handleFormField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Switching to Hourly clears the now-irrelevant fixed pay, mirroring the backend.
      if (field === 'payCalculationType' && value === 'Hourly') {
        next.fixedCaregiverPay = '';
      }
      return next;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(form);
    setFormErrors(errors);
    if (errors.length > 0) return;

    setSaving(true);
    const payload = buildPayload(form);
    const result = editingId
      ? await AdminPackageService.updatePackage(editingId, payload)
      : await AdminPackageService.createPackage(payload);

    if (result.success) {
      showToast('success', result.message || (editingId ? 'Package updated' : 'Package created'));
      setFormOpen(false);
      loadPackages();
    } else {
      setFormErrors([result.error || 'Failed to save package']);
    }
    setSaving(false);
  };

  // ─── toggle active ──────────────────────────────────────
  const handleToggleActive = async (pkg) => {
    setTogglingId(pkg.id);
    const nextActive = !pkg.isActive;
    const result = await AdminPackageService.toggleActiveStatus(pkg.id, nextActive);
    if (result.success) {
      showToast('success', result.message || `Package ${nextActive ? 'activated' : 'deactivated'}`);
      loadPackages();
    } else {
      showToast('error', result.error || 'Failed to toggle package status');
    }
    setTogglingId(null);
  };

  // ─── delete ─────────────────────────────────────────────
  const confirmDelete = (pkg) => setDeleteTarget(pkg);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await AdminPackageService.deletePackage(deleteTarget.id);
    if (result.success) {
      showToast('success', result.message || 'Package deleted');
      setDeleteTarget(null);
      loadPackages();
    } else {
      showToast('error', result.error || 'Failed to delete package');
      setDeleteTarget(null);
    }
    setDeleteLoading(false);
  };

  return (
    <div className="packages-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-box-open"></i>
          </div>
          <div>
            <h1>Care Packages</h1>
            <p>Manage the pre-priced care package catalog clients browse and buy from</p>
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
      <div className="pkg-controls">
        <div className="pkg-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by tier, specialty, or description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="pkg-inactive-toggle">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
        <button className="btn-secondary btn-sm" onClick={loadPackages} disabled={loadingList}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
        <button className="btn-primary btn-sm" onClick={openCreate}>
          <i className="fas fa-plus"></i> Add Package
        </button>
      </div>

      {/* Category filter pills */}
      <div className="pkg-category-filters">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={`pkg-pill${categoryFilter === c ? ' pkg-pill--active' : ''}`}
            onClick={() => setCategoryFilter(c)}
          >
            {c}
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
      ) : visiblePackages.length === 0 ? (
        <div className="pkg-empty">
          <i className="fas fa-inbox"></i>
          <p>{packages.length === 0 ? 'No packages yet' : 'No packages match your filters'}</p>
          {packages.length === 0 && (
            <button className="btn-primary" onClick={openCreate}>
              <i className="fas fa-plus"></i> Add First Package
            </button>
          )}
        </div>
      ) : (
        <div className="pkg-table-wrap">
          <table className="pkg-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Tier</th>
                <th>Caregiver Type</th>
                <th>Base Price</th>
                <th>Extra Day</th>
                <th>Pay Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePackages.map((p) => (
                <tr key={p.id} className={p.isActive ? '' : 'pkg-row--inactive'}>
                  <td>{p.category}</td>
                  <td className="pkg-tier-cell">
                    {p.tierLabel}
                    {p.requiredSpecialty && <small>{p.requiredSpecialty}</small>}
                  </td>
                  <td><span className="pkg-badge pkg-badge--type">{p.requiredCaregiverType}</span></td>
                  <td className="pkg-price-cell">{fmtNaira(p.basePrice)}</td>
                  <td className="pkg-price-cell">{fmtNaira(p.additionalDayPrice)}</td>
                  <td>
                    <span className="pkg-badge pkg-badge--pay">
                      {p.payCalculationType || '—'}
                      {p.payCalculationType === 'Fixed' && p.fixedCaregiverPay != null
                        ? ` (${fmtNaira(p.fixedCaregiverPay)})`
                        : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`pkg-badge ${p.isActive ? 'pkg-badge--active' : 'pkg-badge--inactive'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="pkg-actions">
                    <button className="btn-icon btn-icon--edit" title="Edit" onClick={() => openEdit(p)}>
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button
                      className={`btn-icon ${p.isActive ? 'btn-icon--toggle-off' : 'btn-icon--toggle-on'}`}
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() => handleToggleActive(p)}
                      disabled={togglingId === p.id}
                    >
                      <i className={`fas ${p.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                    <button className="btn-icon btn-icon--delete" title="Delete" onClick={() => confirmDelete(p)}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pkg-count">
            {visiblePackages.length} of {packages.length} package{packages.length !== 1 ? 's' : ''}
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
                {editingId ? 'Edit Package' : 'Add Package'}
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
                    <label htmlFor="pkg-category">Category <span className="required">*</span></label>
                    <select
                      id="pkg-category"
                      value={form.category}
                      onChange={(e) => handleFormField('category', e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pkg-tier">Tier Label <span className="required">*</span></label>
                    <input
                      id="pkg-tier"
                      type="text"
                      list="pkg-tier-suggestions"
                      value={form.tierLabel}
                      onChange={(e) => handleFormField('tierLabel', e.target.value)}
                      placeholder="e.g. Essential"
                      maxLength={80}
                      required
                    />
                    <datalist id="pkg-tier-suggestions">
                      {TIER_LABEL_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pkg-caregiver-type">Required Caregiver Type <span className="required">*</span></label>
                    <select
                      id="pkg-caregiver-type"
                      value={form.requiredCaregiverType}
                      onChange={(e) => handleFormField('requiredCaregiverType', e.target.value)}
                    >
                      {CAREGIVER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pkg-specialty">Required Specialty <span className="optional">(Optional)</span></label>
                    <input
                      id="pkg-specialty"
                      type="text"
                      value={form.requiredSpecialty}
                      onChange={(e) => handleFormField('requiredSpecialty', e.target.value)}
                      placeholder="e.g. Midwifery"
                      maxLength={120}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pkg-base-price">Base Price (₦) <span className="required">*</span></label>
                    <input
                      id="pkg-base-price"
                      type="number"
                      min="0"
                      step="1"
                      value={form.basePrice}
                      onChange={(e) => handleFormField('basePrice', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pkg-extra-day">Additional Day Price (₦) <span className="optional">(Optional)</span></label>
                    <input
                      id="pkg-extra-day"
                      type="number"
                      min="0"
                      step="1"
                      value={form.additionalDayPrice}
                      onChange={(e) => handleFormField('additionalDayPrice', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pkg-pay-type">Pay Calculation Type <span className="required">*</span></label>
                    <select
                      id="pkg-pay-type"
                      value={form.payCalculationType}
                      onChange={(e) => handleFormField('payCalculationType', e.target.value)}
                    >
                      {PAY_CALCULATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pkg-fixed-pay">
                      Fixed Caregiver Pay (₦) {form.payCalculationType === 'Fixed' ? <span className="required">*</span> : <span className="optional">(Hourly — n/a)</span>}
                    </label>
                    <input
                      id="pkg-fixed-pay"
                      type="number"
                      min="0"
                      step="1"
                      value={form.fixedCaregiverPay}
                      onChange={(e) => handleFormField('fixedCaregiverPay', e.target.value)}
                      disabled={form.payCalculationType !== 'Fixed'}
                      required={form.payCalculationType === 'Fixed'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="pkg-description">Description <span className="optional">(Optional)</span></label>
                  <textarea
                    id="pkg-description"
                    value={form.description}
                    onChange={(e) => handleFormField('description', e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                </div>

                {!editingId && (
                  <p className="form-hint">
                    New packages are created active. Use the toggle in the list to deactivate one later.
                  </p>
                )}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeForm} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving
                      ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                      : <><i className="fas fa-save"></i> {editingId ? 'Save Changes' : 'Create Package'}</>}
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
                Are you sure you want to permanently delete <strong>{deleteTarget.category} — {deleteTarget.tierLabel}</strong>?
                <br /><small style={{ color: '#999' }}>This cannot be undone.</small>
              </p>
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
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

export default PackagesManagement;

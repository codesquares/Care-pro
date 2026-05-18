import { useState, useEffect, useCallback } from 'react';
import adminService from '../../../services/adminService';
import './training-materials.css';

// ─── helpers ──────────────────────────────────────────────
const USER_TYPES = ['Caregiver', 'Cleaner', 'Both'];
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.mp4,.mov,.avi,.wmv,.ppt,.pptx';

const fileIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf'))  return 'fa-file-pdf';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return 'fa-file-word';
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return 'fa-file-powerpoint';
  if (n.match(/\.(mp4|mov|avi|wmv)$/)) return 'fa-file-video';
  return 'fa-file';
};

const fmtSize = (bytes) =>
  bytes ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── main component ───────────────────────────────────────
const TrainingMaterials = () => {
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const adminId = userDetails.id;

  // ── tabs
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'upload'

  // ── manage tab state
  const [materials, setMaterials]         = useState([]);
  const [loadingList, setLoadingList]     = useState(false);
  const [listError, setListError]         = useState(null);
  const [typeFilter, setTypeFilter]       = useState('All');
  const [searchTerm, setSearchTerm]       = useState('');
  const [searchInput, setSearchInput]     = useState('');

  // ── detail modal
  const [detailItem, setDetailItem]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── edit modal
  const [editItem, setEditItem]           = useState(null);
  const [editForm, setEditForm]           = useState({ title: '', description: '', userType: 'Caregiver', file: null });
  const [editFileInfo, setEditFileInfo]   = useState(null);
  const [editLoading, setEditLoading]     = useState(false);
  const [editError, setEditError]         = useState(null);
  const [editSuccess, setEditSuccess]     = useState(null);

  // ── delete confirm
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── global toast
  const [toast, setToast]                 = useState(null); // {type, msg}

  // ── upload tab state (original)
  const [uploadForm, setUploadForm]       = useState({ title: '', userType: 'Caregiver', description: '', file: null });
  const [uploadFileInfo, setUploadFileInfo] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult]   = useState(null);
  const [uploadError, setUploadError]     = useState(null);

  // ─── helpers ─────────────────────────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── load materials ──────────────────────────────────────
  const loadMaterials = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    let result;
    if (searchTerm.trim()) {
      result = await adminService.searchTrainingMaterials(searchTerm.trim());
    } else if (typeFilter !== 'All') {
      result = await adminService.getTrainingMaterialsByUserType(typeFilter, false);
    } else {
      result = await adminService.getAllTrainingMaterials();
    }
    if (result.success) {
      setMaterials(result.data || []);
    } else {
      setListError(result.error || 'Failed to load training materials');
    }
    setLoadingList(false);
  }, [typeFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'manage') loadMaterials();
  }, [activeTab, loadMaterials]);

  // ─── search (submit) ─────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setTypeFilter('All');
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  // ─── type filter ─────────────────────────────────────────
  const handleTypeFilter = (t) => {
    setTypeFilter(t);
    setSearchTerm('');
    setSearchInput('');
  };

  // ─── detail modal ─────────────────────────────────────────
  const openDetail = async (material) => {
    setLoadingDetail(true);
    const result = await adminService.getTrainingMaterial(material.id || material.Id);
    if (result.success) {
      setDetailItem(result.data);
    } else {
      showToast('error', result.error || 'Failed to load material details');
    }
    setLoadingDetail(false);
  };

  // ─── edit modal ───────────────────────────────────────────
  const openEdit = (material) => {
    setEditItem(material);
    setEditForm({
      title: material.title || material.Title || '',
      description: material.description || material.Description || '',
      userType: material.userType || material.UserType || 'Caregiver',
      file: null,
    });
    setEditFileInfo(null);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleEditFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setEditForm(p => ({ ...p, file: f }));
      setEditFileInfo({ name: f.name, size: fmtSize(f.size) });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) { setEditError('Title is required'); return; }
    setEditLoading(true);
    setEditError(null);
    const id = editItem.id || editItem.Id;
    const result = await adminService.updateTrainingMaterial(id, {
      title: editForm.title,
      description: editForm.description,
      userType: editForm.userType,
      file: editForm.file || undefined,
    });
    if (result.success) {
      setEditSuccess(result.message);
      showToast('success', result.message);
      setEditItem(null);
      loadMaterials();
    } else {
      setEditError(result.error);
    }
    setEditLoading(false);
  };

  // ─── delete ───────────────────────────────────────────────
  const confirmDelete = (material) => setDeleteTarget(material);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const id = deleteTarget.id || deleteTarget.Id;
    const result = await adminService.deleteTrainingMaterial(id);
    if (result.success) {
      showToast('success', result.message);
      setDeleteTarget(null);
      loadMaterials();
    } else {
      showToast('error', result.error || 'Failed to delete');
      setDeleteTarget(null);
    }
    setDeleteLoading(false);
  };

  // ─── upload tab handlers (original logic) ─────────────────
  const handleUploadInputChange = (e) => {
    const { name, value } = e.target;
    setUploadForm(p => ({ ...p, [name]: value }));
  };

  const handleUploadFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setUploadForm(p => ({ ...p, file: f }));
      setUploadFileInfo({ name: f.name, size: fmtSize(f.size), type: f.type });
    } else {
      setUploadForm(p => ({ ...p, file: null }));
      setUploadFileInfo(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);

    const validation = adminService.validateTrainingMaterialData({ ...uploadForm, uploadedBy: adminId });
    if (!validation.isValid) {
      setUploadError(validation.errors.join(', '));
      setUploadLoading(false);
      return;
    }

    const result = await adminService.uploadTrainingMaterial({ ...uploadForm, uploadedBy: adminId });
    if (result.success) {
      setUploadResult({ success: true, message: result.message, data: result.data });
      setUploadForm({ title: '', userType: 'Caregiver', description: '', file: null });
      setUploadFileInfo(null);
      const fi = document.getElementById('upload-file-input');
      if (fi) fi.value = '';
      showToast('success', result.message || 'Uploaded successfully');
    } else {
      setUploadError(result.error || 'Failed to upload training material');
    }
    setUploadLoading(false);
  };

  const handleClearUpload = () => {
    setUploadForm({ title: '', userType: 'Caregiver', description: '', file: null });
    setUploadFileInfo(null);
    setUploadError(null);
    setUploadResult(null);
    const fi = document.getElementById('upload-file-input');
    if (fi) fi.value = '';
  };

  // ─── render ───────────────────────────────────────────────
  return (
    <div className="training-materials-upload">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <div>
            <h1>Training Materials</h1>
            <p>Manage and upload training materials for caregivers and cleaners</p>
          </div>
        </div>
      </div>

      {/* Global toast */}
      {toast && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tm-tabs">
        <button
          className={`tm-tab${activeTab === 'manage' ? ' tm-tab--active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          <i className="fas fa-list"></i> Manage Materials
        </button>
        <button
          className={`tm-tab${activeTab === 'upload' ? ' tm-tab--active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <i className="fas fa-cloud-upload-alt"></i> Upload New
        </button>
      </div>

      {/* ── MANAGE TAB ── */}
      {activeTab === 'manage' && (
        <div className="tm-manage">
          {/* Controls row */}
          <div className="tm-controls">
            <form className="tm-search-form" onSubmit={handleSearch}>
              <div className="tm-search-wrap">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by title, description or filename…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button type="button" className="tm-clear-btn" onClick={handleClearSearch}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary btn-sm">Search</button>
            </form>

            <button className="btn-secondary btn-sm" onClick={loadMaterials} disabled={loadingList}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          {/* Type filter pills */}
          <div className="tm-type-filters">
            {['All', ...USER_TYPES].map(t => (
              <button
                key={t}
                className={`tm-pill${typeFilter === t ? ' tm-pill--active' : ''}`}
                onClick={() => handleTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* List */}
          {listError && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <div><p>{listError}</p></div>
            </div>
          )}

          {loadingList ? (
            <div className="tm-loading"><div className="spinner"></div><p>Loading…</p></div>
          ) : materials.length === 0 ? (
            <div className="tm-empty">
              <i className="fas fa-inbox"></i>
              <p>{searchTerm ? `No results for "${searchTerm}"` : 'No training materials found'}</p>
              <button className="btn-primary" onClick={() => setActiveTab('upload')}>
                <i className="fas fa-plus"></i> Upload First Material
              </button>
            </div>
          ) : (
            <div className="tm-table-wrap">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Audience</th>
                    <th>File</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => {
                    const id   = m.id || m.Id;
                    const title = m.title || m.Title || '—';
                    const ut   = m.userType || m.UserType || '—';
                    const fn   = m.fileName || m.FileName || '—';
                    const fs   = m.fileSize || m.FileSize;
                    const cd   = m.createdAt || m.CreatedAt || m.uploadedAt;
                    return (
                      <tr key={id}>
                        <td className="tm-title-cell">
                          <i className={`fas ${fileIcon(fn)}`}></i>
                          <span>{title}</span>
                        </td>
                        <td><span className="tm-badge tm-badge--type">{ut}</span></td>
                        <td className="tm-file-cell">{fn}</td>
                        <td>{fs ? fmtSize(fs) : '—'}</td>
                        <td>{fmtDate(cd)}</td>
                        <td className="tm-actions">
                          <button
                            className="btn-icon btn-icon--view"
                            title="View details"
                            onClick={() => openDetail(m)}
                            disabled={loadingDetail}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-icon btn-icon--edit"
                            title="Edit"
                            onClick={() => openEdit(m)}
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button
                            className="btn-icon btn-icon--delete"
                            title="Delete"
                            onClick={() => confirmDelete(m)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="tm-count">{materials.length} material{materials.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* ── UPLOAD TAB ── */}
      {activeTab === 'upload' && (
        <div>
          {uploadError && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <div><strong>Error</strong><p>{uploadError}</p></div>
              <button onClick={() => setUploadError(null)} className="alert-close">×</button>
            </div>
          )}
          {uploadResult && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>Success!</strong>
                <p>{uploadResult.message}</p>
                {uploadResult.data?.cloudinaryUrl && (
                  <a href={uploadResult.data.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                    <i className="fas fa-external-link-alt"></i> View Uploaded File
                  </a>
                )}
              </div>
              <button onClick={() => setUploadResult(null)} className="alert-close">×</button>
            </div>
          )}

          <div className="upload-container">
            <div className="info-section">
              <h3><i className="fas fa-info-circle"></i> Upload Guidelines</h3>
              <div className="info-content">
                <div className="info-item">
                  <h4>Accepted File Types</h4>
                  <div className="file-types">
                    <span className="file-type-badge"><i className="fas fa-file-pdf"></i> PDF</span>
                    <span className="file-type-badge"><i className="fas fa-file-word"></i> Word</span>
                    <span className="file-type-badge"><i className="fas fa-file-powerpoint"></i> PowerPoint</span>
                    <span className="file-type-badge"><i className="fas fa-file-video"></i> Videos</span>
                  </div>
                </div>
                <div className="info-item">
                  <h4>Requirements</h4>
                  <ul>
                    <li><i className="fas fa-check"></i> Title: 3–200 characters</li>
                    <li><i className="fas fa-check"></i> Description: Max 500 characters (optional)</li>
                    <li><i className="fas fa-check"></i> Select target audience</li>
                  </ul>
                </div>
                <div className="info-item">
                  <h4>User Types</h4>
                  <ul>
                    <li><strong>Caregiver:</strong> Only caregivers can access</li>
                    <li><strong>Cleaner:</strong> Only cleaners can access</li>
                    <li><strong>Both:</strong> All users can access</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="form-section">
              <form onSubmit={handleUploadSubmit} className="upload-form">
                <div className="form-group">
                  <label htmlFor="upload-title">Title <span className="required">*</span></label>
                  <input
                    type="text" id="upload-title" name="title"
                    value={uploadForm.title} onChange={handleUploadInputChange}
                    placeholder="e.g., Introduction to Elder Care"
                    required minLength={3} maxLength={200}
                  />
                  <small className="char-count">{uploadForm.title.length}/200</small>
                </div>

                <div className="form-group">
                  <label htmlFor="upload-userType">Target Audience <span className="required">*</span></label>
                  <select id="upload-userType" name="userType" value={uploadForm.userType} onChange={handleUploadInputChange} required>
                    {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="upload-description">Description <span className="optional">(Optional)</span></label>
                  <textarea
                    id="upload-description" name="description"
                    value={uploadForm.description} onChange={handleUploadInputChange}
                    placeholder="Describe the training content…" rows="4" maxLength={500}
                  />
                  <small className="char-count">{uploadForm.description.length}/500</small>
                </div>

                <div className="form-group">
                  <label htmlFor="upload-file-input">File <span className="required">*</span></label>
                  <div className="file-input-wrapper">
                    <input
                      type="file" id="upload-file-input"
                      accept={ACCEPTED_FILE_TYPES} onChange={handleUploadFileChange} required
                    />
                    <div className="file-input-display">
                      {uploadFileInfo ? (
                        <div className="file-selected">
                          <i className={`fas ${fileIcon(uploadFileInfo.name)}`}></i>
                          <div className="file-details">
                            <span className="file-name">{uploadFileInfo.name}</span>
                            <span className="file-size">{uploadFileInfo.size}</span>
                          </div>
                          <button type="button" className="btn-remove-file" onClick={() => {
                            setUploadForm(p => ({ ...p, file: null }));
                            setUploadFileInfo(null);
                            document.getElementById('upload-file-input').value = '';
                          }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="file-placeholder">
                          <i className="fas fa-cloud-upload-alt"></i>
                          <p>Click to select or drag and drop</p>
                          <small>PDF, Documents, or Videos</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={handleClearUpload} disabled={uploadLoading}>
                    <i className="fas fa-redo"></i> Clear
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploadLoading || !uploadForm.file}>
                    {uploadLoading
                      ? <><i className="fas fa-spinner fa-spin"></i> Uploading…</>
                      : <><i className="fas fa-cloud-upload-alt"></i> Upload Material</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailItem && (
        <div className="tm-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-header">
              <h2><i className="fas fa-file-alt"></i> Material Details</h2>
              <button className="tm-modal-close" onClick={() => setDetailItem(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="tm-modal-body">
              <div className="tm-detail-grid">
                <div className="tm-detail-row">
                  <span className="tm-detail-label">Title</span>
                  <span>{detailItem.title || detailItem.Title}</span>
                </div>
                <div className="tm-detail-row">
                  <span className="tm-detail-label">Audience</span>
                  <span className="tm-badge tm-badge--type">{detailItem.userType || detailItem.UserType}</span>
                </div>
                <div className="tm-detail-row">
                  <span className="tm-detail-label">Description</span>
                  <span>{detailItem.description || detailItem.Description || '—'}</span>
                </div>
                <div className="tm-detail-row">
                  <span className="tm-detail-label">File Name</span>
                  <span>{detailItem.fileName || detailItem.FileName || '—'}</span>
                </div>
                <div className="tm-detail-row">
                  <span className="tm-detail-label">File Size</span>
                  <span>{fmtSize(detailItem.fileSize || detailItem.FileSize)}</span>
                </div>
                <div className="tm-detail-row">
                  <span className="tm-detail-label">Uploaded</span>
                  <span>{fmtDate(detailItem.createdAt || detailItem.CreatedAt || detailItem.uploadedAt)}</span>
                </div>
                {(detailItem.cloudinaryUrl || detailItem.CloudinaryUrl || detailItem.fileUrl) && (
                  <div className="tm-detail-row">
                    <span className="tm-detail-label">File URL</span>
                    <a
                      href={detailItem.cloudinaryUrl || detailItem.CloudinaryUrl || detailItem.fileUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="file-link"
                    >
                      <i className="fas fa-external-link-alt"></i> Open File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editItem && (
        <div className="tm-modal-overlay" onClick={() => !editLoading && setEditItem(null)}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-header">
              <h2><i className="fas fa-pencil-alt"></i> Edit Material</h2>
              <button className="tm-modal-close" onClick={() => !editLoading && setEditItem(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="tm-modal-body">
              {editError && <div className="alert alert-error" style={{marginBottom:'1rem'}}><i className="fas fa-exclamation-circle"></i><div><p>{editError}</p></div></div>}
              <form onSubmit={handleEditSubmit} className="upload-form">
                <div className="form-group">
                  <label>Title <span className="required">*</span></label>
                  <input
                    type="text" value={editForm.title}
                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                    required minLength={3} maxLength={200}
                  />
                  <small className="char-count">{editForm.title.length}/200</small>
                </div>
                <div className="form-group">
                  <label>Target Audience <span className="required">*</span></label>
                  <select value={editForm.userType} onChange={e => setEditForm(p => ({ ...p, userType: e.target.value }))}>
                    {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description <span className="optional">(Optional)</span></label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    rows="3" maxLength={500}
                  />
                  <small className="char-count">{editForm.description.length}/500</small>
                </div>
                <div className="form-group">
                  <label>Replace File <span className="optional">(Optional — leave blank to keep current)</span></label>
                  <div className="file-input-wrapper">
                    <input type="file" id="edit-file-input" accept={ACCEPTED_FILE_TYPES} onChange={handleEditFileChange} />
                    <div className="file-input-display">
                      {editFileInfo ? (
                        <div className="file-selected">
                          <i className={`fas ${fileIcon(editFileInfo.name)}`}></i>
                          <div className="file-details">
                            <span className="file-name">{editFileInfo.name}</span>
                            <span className="file-size">{editFileInfo.size}</span>
                          </div>
                          <button type="button" className="btn-remove-file" onClick={() => {
                            setEditForm(p => ({ ...p, file: null }));
                            setEditFileInfo(null);
                            document.getElementById('edit-file-input').value = '';
                          }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="file-placeholder">
                          <i className="fas fa-exchange-alt"></i>
                          <p>Click to select a replacement file</p>
                          <small>Leave blank to keep existing file</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditItem(null)} disabled={editLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={editLoading}>
                    {editLoading
                      ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                      : <><i className="fas fa-save"></i> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <div className="tm-modal-overlay" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="tm-modal tm-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="tm-modal-header tm-modal-header--danger">
              <h2><i className="fas fa-exclamation-triangle"></i> Confirm Delete</h2>
            </div>
            <div className="tm-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to permanently delete <strong>{deleteTarget.title || deleteTarget.Title}</strong>?
                <br /><small style={{ color: '#999' }}>This will also remove the file from Cloudinary and cannot be undone.</small>
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

export default TrainingMaterials;

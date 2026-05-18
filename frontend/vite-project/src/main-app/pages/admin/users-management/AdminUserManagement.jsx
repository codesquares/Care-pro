import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../../services/adminService';
import './admin-user-management.css';

const ROLES = ['Admin', 'SuperAdmin'];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'aum-badge aum-badge--active';
  if (s === 'inactive' || s === 'disabled') return 'aum-badge aum-badge--inactive';
  return 'aum-badge aum-badge--default';
};

const emptyCreateForm = {
  FirstName: '',
  LastName: '',
  MiddleName: '',
  Email: '',
  Password: '',
  Role: 'Admin',
  Department: '',
  PhoneNo: '',
  Status: '',
};

const AdminUserManagement = () => {
  const userDetails  = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const currentRole  = userDetails.role || '';
  const isSuperAdmin = currentRole === 'SuperAdmin';

  // ── list state
  const [admins, setAdmins]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── profile modal
  const [profileItem, setProfileItem]         = useState(null);
  const [profileLoading, setProfileLoading]   = useState(false);

  // ── create modal
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState(emptyCreateForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError]   = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── load
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminService.getAllAdminUsers();
    if (result.success) {
      setAdmins(result.data || []);
    } else {
      setError(result.error || 'Failed to load admin users');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  // ── filtered list
  const filtered = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (a.firstName || a.FirstName || '').toLowerCase().includes(q) ||
      (a.lastName  || a.LastName  || '').toLowerCase().includes(q) ||
      (a.email     || a.Email     || '').toLowerCase().includes(q) ||
      (a.department || a.Department || '').toLowerCase().includes(q)
    );
  });

  // ── profile modal
  const openProfile = async (admin) => {
    setProfileLoading(true);
    const id = admin.id || admin.Id;
    const result = await adminService.getAdminUser(id);
    if (result.success) {
      setProfileItem(result.data);
    } else {
      toast.error(result.error || 'Failed to load profile');
    }
    setProfileLoading(false);
  };

  // ── create form handlers
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm(p => ({ ...p, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.FirstName.trim() || !createForm.LastName.trim()) {
      setCreateError('First name and last name are required');
      return;
    }
    if (!createForm.Email.trim()) {
      setCreateError('Email is required');
      return;
    }
    if (!createForm.Password || createForm.Password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }

    setCreateLoading(true);
    const payload = {
      FirstName:  createForm.FirstName.trim(),
      LastName:   createForm.LastName.trim(),
      Email:      createForm.Email.trim(),
      Password:   createForm.Password,
      Role:       createForm.Role,
    };
    if (createForm.MiddleName.trim()) payload.MiddleName  = createForm.MiddleName.trim();
    if (createForm.Department.trim()) payload.Department  = createForm.Department.trim();
    if (createForm.PhoneNo.trim())    payload.PhoneNo     = createForm.PhoneNo.trim();
    if (createForm.Status.trim())     payload.Status      = createForm.Status.trim();

    const result = await adminService.createAdmin(payload);
    if (result.success) {
      toast.success(`Admin account created for ${payload.FirstName} ${payload.LastName}`);
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      loadAdmins();
    } else {
      setCreateError(result.error || 'Failed to create admin account');
    }
    setCreateLoading(false);
  };

  // ── stats
  const totalAdmins      = admins.length;
  const superAdminCount  = admins.filter(a => (a.role || a.Role) === 'SuperAdmin').length;
  const activeCount      = admins.filter(a => (a.status || a.Status || '').toLowerCase() === 'active').length;

  return (
    <div className="aum-page">
      {/* Header */}
      <div className="aum-header">
        <div className="aum-header-left">
          <div className="aum-header-icon"><i className="fas fa-user-shield"></i></div>
          <div>
            <h1>Admin User Management</h1>
            <p>Create and manage administrator accounts</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button className="btn-primary" onClick={() => { setShowCreate(true); setCreateError(null); }}>
            <i className="fas fa-plus"></i> Create Admin
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="aum-stats">
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon--blue"><i className="fas fa-users-cog"></i></div>
          <div><p className="aum-stat-num">{totalAdmins}</p><p className="aum-stat-lbl">Total Admins</p></div>
        </div>
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon--purple"><i className="fas fa-crown"></i></div>
          <div><p className="aum-stat-num">{superAdminCount}</p><p className="aum-stat-lbl">Super Admins</p></div>
        </div>
        <div className="aum-stat-card">
          <div className="aum-stat-icon aum-stat-icon--green"><i className="fas fa-check-circle"></i></div>
          <div><p className="aum-stat-num">{activeCount}</p><p className="aum-stat-lbl">Active</p></div>
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="aum-controls">
        <div className="aum-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email or department…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-secondary btn-sm" onClick={loadAdmins} disabled={loading}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <i className="fas fa-exclamation-circle"></i>
          <div><p>{error}</p></div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="aum-loading"><div className="spinner"></div><p>Loading admins…</p></div>
      ) : filtered.length === 0 ? (
        <div className="aum-empty">
          <i className="fas fa-user-slash"></i>
          <p>{searchQuery ? `No admins matching "${searchQuery}"` : 'No admin accounts found'}</p>
        </div>
      ) : (
        <div className="aum-table-wrap">
          <table className="aum-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((admin) => {
                const id   = admin.id || admin.Id;
                const fn   = admin.firstName || admin.FirstName || '';
                const ln   = admin.lastName  || admin.LastName  || '';
                const em   = admin.email     || admin.Email     || '';
                const role = admin.role      || admin.Role      || '—';
                const dept = admin.department || admin.Department || '—';
                const stat = admin.status    || admin.Status    || '—';
                const cd   = admin.createdAt || admin.CreatedAt;
                return (
                  <tr key={id}>
                    <td className="aum-name-cell">
                      <div className="aum-avatar">{(fn[0] || '').toUpperCase()}{(ln[0] || '').toUpperCase()}</div>
                      <div>
                        <span className="aum-name">{fn} {ln}</span>
                        {admin.isDeleted && <span className="aum-deleted-tag">Deleted</span>}
                      </div>
                    </td>
                    <td>{em}</td>
                    <td>
                      <span className={`aum-role-badge ${role === 'SuperAdmin' ? 'aum-role-badge--super' : 'aum-role-badge--admin'}`}>
                        {role}
                      </span>
                    </td>
                    <td>{dept}</td>
                    <td><span className={statusBadgeClass(stat)}>{stat}</span></td>
                    <td>{fmtDate(cd)}</td>
                    <td>
                      <button
                        className="btn-icon btn-icon--view"
                        title="View profile"
                        onClick={() => openProfile(admin)}
                        disabled={profileLoading}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="aum-count">{filtered.length} of {totalAdmins} admin{totalAdmins !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {profileItem && (
        <div className="aum-modal-overlay" onClick={() => setProfileItem(null)}>
          <div className="aum-modal" onClick={e => e.stopPropagation()}>
            <div className="aum-modal-header">
              <h2><i className="fas fa-id-card"></i> Admin Profile</h2>
              <button className="aum-modal-close" onClick={() => setProfileItem(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="aum-modal-body">
              <div className="aum-profile-avatar">
                {((profileItem.firstName || profileItem.FirstName || '')[0] || '').toUpperCase()}
                {((profileItem.lastName  || profileItem.LastName  || '')[0] || '').toUpperCase()}
              </div>
              <div className="aum-detail-grid">
                {[
                  ['ID',         profileItem.id || profileItem.Id],
                  ['First Name', profileItem.firstName || profileItem.FirstName],
                  ['Middle Name',profileItem.middleName || profileItem.MiddleName || '—'],
                  ['Last Name',  profileItem.lastName  || profileItem.LastName],
                  ['Email',      profileItem.email     || profileItem.Email],
                  ['Role',       profileItem.role      || profileItem.Role],
                  ['Department', profileItem.department || profileItem.Department || '—'],
                  ['Phone',      profileItem.phoneNo   || profileItem.PhoneNo     || '—'],
                  ['Status',     profileItem.status    || profileItem.Status      || '—'],
                  ['Created',    fmtDate(profileItem.createdAt || profileItem.CreatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="aum-detail-row">
                    <span className="aum-detail-label">{label}</span>
                    <span className="aum-detail-value">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="aum-modal-overlay" onClick={() => !createLoading && setShowCreate(false)}>
          <div className="aum-modal aum-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="aum-modal-header">
              <h2><i className="fas fa-user-plus"></i> Create Admin Account</h2>
              <button className="aum-modal-close" onClick={() => !createLoading && setShowCreate(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="aum-modal-body">
              {createError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <div><p>{createError}</p></div>
                </div>
              )}
              <form onSubmit={handleCreateSubmit} className="aum-create-form">
                <div className="aum-form-row">
                  <div className="form-group">
                    <label>First Name <span className="required">*</span></label>
                    <input type="text" name="FirstName" value={createForm.FirstName} onChange={handleCreateChange} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name <span className="required">*</span></label>
                    <input type="text" name="LastName" value={createForm.LastName} onChange={handleCreateChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Middle Name <span className="optional">(Optional)</span></label>
                  <input type="text" name="MiddleName" value={createForm.MiddleName} onChange={handleCreateChange} />
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" name="Email" value={createForm.Email} onChange={handleCreateChange} required />
                </div>
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <div className="aum-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="Password"
                      value={createForm.Password}
                      onChange={handleCreateChange}
                      required minLength={6}
                    />
                    <button type="button" className="aum-pw-toggle" onClick={() => setShowPassword(p => !p)}>
                      <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="aum-form-row">
                  <div className="form-group">
                    <label>Role <span className="required">*</span></label>
                    <select name="Role" value={createForm.Role} onChange={handleCreateChange} required>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department <span className="optional">(Optional)</span></label>
                    <input type="text" name="Department" value={createForm.Department} onChange={handleCreateChange} />
                  </div>
                </div>
                <div className="aum-form-row">
                  <div className="form-group">
                    <label>Phone <span className="optional">(Optional)</span></label>
                    <input type="tel" name="PhoneNo" value={createForm.PhoneNo} onChange={handleCreateChange} />
                  </div>
                  <div className="form-group">
                    <label>Status <span className="optional">(Optional)</span></label>
                    <input type="text" name="Status" value={createForm.Status} onChange={handleCreateChange} placeholder="e.g. Active" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)} disabled={createLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={createLoading}>
                    {createLoading
                      ? <><i className="fas fa-spinner fa-spin"></i> Creating…</>
                      : <><i className="fas fa-user-plus"></i> Create Admin</>}
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

export default AdminUserManagement;

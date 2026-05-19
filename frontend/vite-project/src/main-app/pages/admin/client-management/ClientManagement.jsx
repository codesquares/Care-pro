import { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './client-management.css';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [exportDates, setExportDates] = useState({ startDate: '', endDate: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // Admin account deletion state
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllClients();

      if (result.success) {
        setClients(result.data);
      } else {
        setError(result.error || 'Failed to fetch clients');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phoneNo.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => 
        statusFilter === 'active' ? client.status === true : client.status === false
      );
    }

    setFilteredClients(filtered);
  };

  const handleViewDetails = async (clientId) => {
    try {
      const result = await adminService.getClientById(clientId);
      if (result.success) {
        setSelectedClient(result.data);
        setShowModal(true);
      } else {
        alert('Failed to fetch client details: ' + result.error);
      }
    } catch (error) {
      alert('Error fetching client details');
      console.error(error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setDeleteReason('');
    setDeleteResult(null);
    setShowDeleteConfirm(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const result = await adminService.exportClients(exportDates);
    if (!result.success) setExportError(result.error || 'Export failed');
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="client-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-management">
      <div className="page-header">
        <div>
          <h1>Client Management</h1>
          <p>Manage and monitor all clients in the system</p>
        </div>
        <div className="export-bar">
          <input
            type="date"
            className="export-date-input"
            value={exportDates.startDate}
            onChange={(e) => setExportDates(p => ({ ...p, startDate: e.target.value }))}
            title="Export start date (optional)"
          />
          <input
            type="date"
            className="export-date-input"
            value={exportDates.endDate}
            onChange={(e) => setExportDates(p => ({ ...p, endDate: e.target.value }))}
            title="Export end date (optional)"
          />
          <button className="btn-export" onClick={handleExport} disabled={exporting}>
            <i className="fas fa-file-excel"></i>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{exportError}</p>
          <button onClick={() => setExportError(null)}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchClients}>Retry</button>
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-box">
          <h3>Total Clients</h3>
          <p className="stat-value">{clients.length}</p>
        </div>
        <div className="stat-box">
          <h3>Active</h3>
          <p className="stat-value">{clients.filter(c => c.status).length}</p>
        </div>
        <div className="stat-box">
          <h3>Inactive</h3>
          <p className="stat-value">{clients.filter(c => !c.status).length}</p>
        </div>
        <div className="stat-box">
          <h3>Activity Rate</h3>
          <p className="stat-value">
            {clients.length > 0 ? ((clients.filter(c => c.status).length / clients.length) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="btn-reset"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Home Address</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No clients found
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <img
                      src={client.profileImage || '/default-avatar.png'}
                      alt={`${client.firstName} ${client.lastName}`}
                      className="profile-image"
                    />
                  </td>
                  <td>{`${client.firstName} ${client.lastName}`}</td>
                  <td>{client.email}</td>
                  <td>{client.phoneNo}</td>
                  <td>{client.homeAddress || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${client.status ? 'active' : 'inactive'}`}>
                      {client.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(client.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing client details */}
      {showModal && selectedClient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content client-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="modal-header">
              <img
                src={selectedClient.profileImage || '/default-avatar.png'}
                alt={`${selectedClient.firstName} ${selectedClient.lastName}`}
                className="modal-profile-image"
              />
              <div>
                <h2>{`${selectedClient.firstName} ${selectedClient.middleName || ''} ${selectedClient.lastName}`}</h2>
                <p className="modal-email">{selectedClient.email}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Contact Information</h3>
                <p><strong>Phone:</strong> {selectedClient.phoneNo}</p>
                <p><strong>Email:</strong> {selectedClient.email}</p>
                <p><strong>Home Address:</strong> {selectedClient.homeAddress || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Account Status</h3>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedClient.status ? 'active' : 'inactive'}`}>
                    {selectedClient.status ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p><strong>Role:</strong> {selectedClient.role}</p>
              </div>

              <div className="detail-section">
                <h3>Account Information</h3>
                <p><strong>Created At:</strong> {new Date(selectedClient.createdAt).toLocaleString()}</p>
                <p><strong>User ID:</strong> {selectedClient.id}</p>
              </div>

              {/* Danger Zone */}
              <div className="detail-section" style={{ border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', background: '#fef2f2' }}>
                <h3 style={{ color: '#b91c1c', marginTop: 0 }}>Danger Zone — Delete Account</h3>
                {deleteResult?.success ? (
                  <div style={{ color: '#166534', background: '#dcfce7', borderRadius: '6px', padding: '0.75rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>Account deletion scheduled.</p>
                    <p style={{ margin: '0.25rem 0 0' }}>
                      Permanent deletion on: <strong>{new Date(deleteResult.permanentDeletionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>
                  </div>
                ) : (
                  <>
                    {deleteResult?.message && (
                      <div style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{deleteResult.message}</p>
                        {deleteResult.blockers?.length > 0 && (
                          <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 0' }}>
                            {deleteResult.blockers.map((b, i) => <li key={i}>{b}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                    {!showDeleteConfirm ? (
                      <>
                        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          Scheduling deletion will soft-delete this client's account immediately.
                          Their data will be permanently anonymised after 30 days.
                        </p>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.875rem' }}>
                            Reason <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Enter reason for deletion (required)"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            style={{ width: '100%', resize: 'vertical', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '0.875rem' }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (!deleteReason.trim()) {
                              alert('Please enter a reason before proceeding.');
                              return;
                            }
                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            background: '#ef4444', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          Delete Account
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '0.75rem' }}>
                          Are you sure? This will immediately soft-delete the client's account.
                          Their data will be permanently erased after 30 days.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                          >
                            Go back
                          </button>
                          <button
                            disabled={deleteLoading}
                            onClick={async () => {
                              setDeleteLoading(true);
                              setDeleteResult(null);
                              const result = await adminService.deleteClientAccount(selectedClient.id, deleteReason);
                              setDeleteResult(result);
                              setShowDeleteConfirm(false);
                              setDeleteLoading(false);
                            }}
                            style={{
                              background: '#b91c1c', color: '#fff', border: 'none',
                              borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600,
                            }}
                          >
                            {deleteLoading ? 'Processing...' : 'Yes, Delete Account'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;

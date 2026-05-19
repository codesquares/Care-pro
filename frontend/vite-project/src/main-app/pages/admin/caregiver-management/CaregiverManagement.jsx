import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../../services/adminService';
import './caregiver-management.css';

const CaregiverManagement = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    availability: 'all',
    location: ''
  });
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
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
    fetchCaregivers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [caregivers, searchTerm, filters]);

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.getAllCaregivers();

      if (result.success) {
        setCaregivers(result.data);
      } else {
        setError(result.error || 'Failed to fetch caregivers');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching caregivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...caregivers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cg =>
        `${cg.firstName} ${cg.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cg.phoneNo.includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(cg => 
        filters.status === 'active' ? cg.status === true : cg.status === false
      );
    }

    // Availability filter
    if (filters.availability !== 'all') {
      filtered = filtered.filter(cg => 
        filters.availability === 'available' ? cg.isAvailable === true : cg.isAvailable === false
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(cg =>
        cg.location && cg.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredCaregivers(filtered);
  };

  const handleViewDetails = async (caregiverId) => {
    try {
      const result = await adminService.getCaregiverById(caregiverId);
      if (result.success) {
        setSelectedCaregiver(result.data);
        setShowModal(true);
      } else {
        alert('Failed to fetch caregiver details: ' + result.error);
      }
    } catch (error) {
      alert('Error fetching caregiver details');
      console.error(error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCaregiver(null);
    setDeleteReason('');
    setDeleteResult(null);
    setShowDeleteConfirm(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    const result = await adminService.exportCaregivers(exportDates);
    if (!result.success) setExportError(result.error || 'Export failed');
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="caregiver-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading caregivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="caregiver-management">
      <div className="page-header">
        <div>
          <h1>Caregiver Management</h1>
          <p>Manage and monitor all caregivers in the system</p>
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
          <button onClick={fetchCaregivers}>Retry</button>
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-box">
          <h3>Total Caregivers</h3>
          <p className="stat-value">{caregivers.length}</p>
        </div>
        <div className="stat-box">
          <h3>Active</h3>
          <p className="stat-value">{caregivers.filter(cg => cg.status).length}</p>
        </div>
        <div className="stat-box">
          <h3>Available</h3>
          <p className="stat-value">{caregivers.filter(cg => cg.isAvailable).length}</p>
        </div>
        <div className="stat-box">
          <h3>Total Earnings</h3>
          <p className="stat-value">
            ${caregivers.reduce((sum, cg) => sum + (cg.totalEarning || 0), 0).toFixed(2)}
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
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />

          <button
            className="btn-reset"
            onClick={() => {
              setSearchTerm('');
              setFilters({ status: 'all', availability: 'all', location: '' });
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="caregivers-table-container">
        <table className="caregivers-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Available</th>
              <th>Orders</th>
              <th>Earnings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCaregivers.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                  No caregivers found
                </td>
              </tr>
            ) : (
              filteredCaregivers.map((caregiver) => (
                <tr key={caregiver.id}>
                  <td>
                    <img
                      src={caregiver.profileImage || '/default-avatar.png'}
                      alt={`${caregiver.firstName} ${caregiver.lastName}`}
                      className="profile-image"
                    />
                  </td>
                  <td>{`${caregiver.firstName} ${caregiver.lastName}`}</td>
                  <td>{caregiver.email}</td>
                  <td>{caregiver.phoneNo}</td>
                  <td>{caregiver.location || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${caregiver.status ? 'active' : 'inactive'}`}>
                      {caregiver.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`availability-badge ${caregiver.isAvailable ? 'available' : 'unavailable'}`}>
                      {caregiver.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>{caregiver.noOfOrders || 0}</td>
                  <td>${(caregiver.totalEarning || 0).toFixed(2)}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(caregiver.id)}
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

      {/* Modal for viewing caregiver details */}
      {showModal && selectedCaregiver && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content caregiver-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="modal-header">
              <img
                src={selectedCaregiver.profileImage || '/default-avatar.png'}
                alt={`${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`}
                className="modal-profile-image"
              />
              <div>
                <h2>{`${selectedCaregiver.firstName} ${selectedCaregiver.middleName || ''} ${selectedCaregiver.lastName}`}</h2>
                <p className="modal-email">{selectedCaregiver.email}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Contact Information</h3>
                <p><strong>Phone:</strong> {selectedCaregiver.phoneNo}</p>
                <p><strong>Email:</strong> {selectedCaregiver.email}</p>
                <p><strong>Home Address:</strong> {selectedCaregiver.homeAddress || 'N/A'}</p>
                <p><strong>Location:</strong> {selectedCaregiver.location || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Status & Availability</h3>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedCaregiver.status ? 'active' : 'inactive'}`}>
                    {selectedCaregiver.status ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p><strong>Available:</strong> 
                  <span className={`availability-badge ${selectedCaregiver.isAvailable ? 'available' : 'unavailable'}`}>
                    {selectedCaregiver.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </p>
              </div>

              <div className="detail-section">
                <h3>Performance Metrics</h3>
                <p><strong>Total Earnings:</strong> ${(selectedCaregiver.totalEarning || 0).toFixed(2)}</p>
                <p><strong>Number of Orders:</strong> {selectedCaregiver.noOfOrders || 0}</p>
                <p><strong>Hours Spent:</strong> {selectedCaregiver.noOfHoursSpent || 0}</p>
              </div>

              <div className="detail-section">
                <h3>Services</h3>
                <div className="services-list">
                  {selectedCaregiver.services && selectedCaregiver.services.length > 0 ? (
                    selectedCaregiver.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))
                  ) : (
                    <p>No services listed</p>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>About</h3>
                <p><strong>Intro:</strong> {selectedCaregiver.aboutMeIntro || 'N/A'}</p>
                <p><strong>About Me:</strong> {selectedCaregiver.aboutMe || 'N/A'}</p>
              </div>

              {selectedCaregiver.introVideo && (
                <div className="detail-section">
                  <h3>Introduction Video</h3>
                  <video controls width="100%">
                    <source src={selectedCaregiver.introVideo} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <div className="detail-section">
                <h3>Account Information</h3>
                <p><strong>Created At:</strong> {new Date(selectedCaregiver.createdAt).toLocaleString()}</p>
                <p><strong>Role:</strong> {selectedCaregiver.role}</p>
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
                          Scheduling deletion will soft-delete this caregiver and all their active gigs immediately.
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
                          Are you sure? This will immediately soft-delete the caregiver's account and all their active gigs.
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
                              const result = await adminService.deleteCaregiverAccount(selectedCaregiver.id, deleteReason);
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

export default CaregiverManagement;

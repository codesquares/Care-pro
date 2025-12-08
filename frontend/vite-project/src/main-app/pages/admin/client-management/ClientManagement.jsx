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
        <h1>Client Management</h1>
        <p>Manage and monitor all clients in the system</p>
      </div>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;

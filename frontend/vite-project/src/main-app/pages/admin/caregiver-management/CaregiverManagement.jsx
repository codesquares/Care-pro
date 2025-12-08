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
        <h1>Caregiver Management</h1>
        <p>Manage and monitor all caregivers in the system</p>
      </div>

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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverManagement;

import { useState, useEffect, useMemo } from 'react';
import adminService from '../../../services/adminService';
import './care-matching.css';

const CareMatching = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(true);
  const [caregiversError, setCaregiversError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    availability: 'all',
    location: ''
  });

  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [caregiverGigs, setCaregiverGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [gigsError, setGigsError] = useState(null);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [recommendGig, setRecommendGig] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    fetchCaregivers();
    fetchClients();
  }, []);

  const fetchCaregivers = async () => {
    try {
      setLoadingCaregivers(true);
      setCaregiversError(null);
      const result = await adminService.getAllCaregivers();
      if (result.success) {
        setCaregivers(result.data);
      } else {
        setCaregiversError(result.error || 'Failed to fetch caregivers');
      }
    } catch (error) {
      setCaregiversError('An unexpected error occurred');
      console.error('Error fetching caregivers:', error);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const result = await adminService.getAllClients();
      if (result.success) {
        setClients(result.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredCaregivers = useMemo(() => {
    let filtered = [...caregivers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cg =>
        `${cg.firstName} ${cg.lastName}`.toLowerCase().includes(term) ||
        cg.email?.toLowerCase().includes(term) ||
        cg.phoneNo?.includes(searchTerm)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(cg =>
        filters.status === 'active' ? cg.status === true : cg.status === false
      );
    }

    if (filters.availability !== 'all') {
      filtered = filtered.filter(cg =>
        filters.availability === 'available' ? cg.isAvailable === true : cg.isAvailable === false
      );
    }

    if (filters.location) {
      filtered = filtered.filter(cg =>
        cg.location && cg.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    return filtered;
  }, [caregivers, searchTerm, filters]);

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    const term = clientSearchTerm.toLowerCase();
    return clients.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }, [clients, clientSearchTerm]);

  const handleSelectCaregiver = async (caregiver) => {
    setSelectedCaregiver(caregiver);
    setCaregiverGigs([]);
    setGigsError(null);
    setLoadingGigs(true);
    try {
      const result = await adminService.getGigsByCaregiver(caregiver.id);
      if (result.success) {
        setCaregiverGigs(result.data);
      } else {
        setGigsError(result.error || 'Failed to fetch gigs');
      }
    } catch (error) {
      setGigsError('An unexpected error occurred');
      console.error('Error fetching caregiver gigs:', error);
    } finally {
      setLoadingGigs(false);
    }
  };

  const openRecommendModal = (gig) => {
    setRecommendGig(gig);
    setSelectedClientId(null);
    setClientSearchTerm('');
    setSendResult(null);
  };

  const closeRecommendModal = () => {
    setRecommendGig(null);
    setSelectedClientId(null);
    setSendResult(null);
  };

  const handleSendRecommendation = async () => {
    if (!selectedClientId || !recommendGig) return;
    setSending(true);
    setSendResult(null);
    const result = await adminService.recommendGigToClient({
      clientId: selectedClientId,
      gigId: recommendGig.id
    });
    setSendResult(result);
    setSending(false);
    if (result.success) {
      setSelectedClientId(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  if (loadingCaregivers) {
    return (
      <div className="care-matching">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading caregivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="care-matching">
      <div className="page-header">
        <div>
          <h1>Care Matching</h1>
          <p>Find a caregiver, pick a gig, and email the client a direct recommendation</p>
        </div>
      </div>

      {caregiversError && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{caregiversError}</p>
          <button onClick={fetchCaregivers}>Retry</button>
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search caregivers by name, email, or phone..."
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

      <div className="matching-layout">
        <div className="caregivers-table-container">
          <table className="caregivers-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Location</th>
                <th>Available</th>
                <th>Verified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCaregivers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No caregivers found
                  </td>
                </tr>
              ) : (
                filteredCaregivers.map((caregiver) => (
                  <tr
                    key={caregiver.id}
                    className={selectedCaregiver?.id === caregiver.id ? 'row-selected' : ''}
                    onClick={() => handleSelectCaregiver(caregiver)}
                  >
                    <td>
                      <img
                        src={caregiver.profileImage || '/default-avatar.png'}
                        alt={`${caregiver.firstName} ${caregiver.lastName}`}
                        className="profile-image"
                      />
                    </td>
                    <td>{`${caregiver.firstName} ${caregiver.lastName}`}</td>
                    <td>{caregiver.location || 'N/A'}</td>
                    <td>
                      <span className={`availability-badge ${caregiver.isAvailable ? 'available' : 'unavailable'}`}>
                        {caregiver.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <span className={`verified-badge ${caregiver.isIdentityVerified ? 'verified' : 'unverified'}`}>
                        <i className={`fas ${caregiver.isIdentityVerified ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                        {caregiver.isIdentityVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view" onClick={() => handleSelectCaregiver(caregiver)}>
                        View Gigs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedCaregiver && (
          <div className="gigs-panel">
            <h2>{`${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`}'s Gigs</h2>

            {gigsError && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{gigsError}</p>
              </div>
            )}

            {loadingGigs ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading gigs...</p>
              </div>
            ) : caregiverGigs.length === 0 ? (
              <p className="no-gigs">This caregiver has no gigs yet.</p>
            ) : (
              <table className="gigs-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Package</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {caregiverGigs.map((gig) => (
                    <tr key={gig.id}>
                      <td>{gig.title}</td>
                      <td><span className="category-tag">{gig.category}</span></td>
                      <td>{gig.packageType || 'N/A'}</td>
                      <td><strong>{formatCurrency(gig.price)}</strong></td>
                      <td>
                        <span className={`status-badge status-${(gig.status || '').toLowerCase()}`}>
                          {gig.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-recommend"
                          disabled={gig.status !== 'Active' && gig.status !== 'Published'}
                          onClick={() => openRecommendModal(gig)}
                        >
                          Recommend to Client
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Recommend to Client Modal */}
      {recommendGig && (
        <div className="care-matching-modal-overlay" onClick={closeRecommendModal}>
          <div className="care-matching-modal-content recommend-modal" onClick={(e) => e.stopPropagation()}>
            <div className="care-matching-modal-header">
              <h2>Recommend "{recommendGig.title}"</h2>
              <button className="care-matching-modal-close" onClick={closeRecommendModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="care-matching-modal-body">
              {sendResult && (
                <div className={`alert ${sendResult.success ? 'alert-success' : 'alert-error'}`}>
                  <p>{sendResult.message || sendResult.error}</p>
                </div>
              )}

              {!sendResult?.success && (
                <>
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search clients by name or email..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="client-list">
                    {loadingClients ? (
                      <p>Loading clients...</p>
                    ) : filteredClients.length === 0 ? (
                      <p>No clients found</p>
                    ) : (
                      filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`client-item ${selectedClientId === client.id ? 'selected' : ''}`}
                          onClick={() => setSelectedClientId(client.id)}
                        >
                          <div>
                            <strong>{client.firstName} {client.lastName}</strong>
                            <span className="client-email">{client.email}</span>
                          </div>
                          {selectedClientId === client.id && (
                            <i className="fas fa-check-circle"></i>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="care-matching-modal-footer">
              <button className="btn-secondary" onClick={closeRecommendModal}>
                {sendResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!sendResult?.success && (
                <button
                  className="btn-send"
                  disabled={!selectedClientId || sending}
                  onClick={handleSendRecommendation}
                >
                  {sending ? 'Sending...' : 'Send Recommendation'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareMatching;

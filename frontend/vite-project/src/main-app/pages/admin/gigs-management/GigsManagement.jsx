import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './gigs-management.css';

const GigsManagement = () => {
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedGig, setSelectedGig] = useState(null);
  const [showGigModal, setShowGigModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Bulk delete state
  const [selectedGigIds, setSelectedGigIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState('');

  // Deleted gigs view state
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'deleted'
  const [deletedGigs, setDeletedGigs] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedTotalCount, setDeletedTotalCount] = useState(0);
  const [deletedHasMore, setDeletedHasMore] = useState(false);
  const [deletedCaregiverFilter, setDeletedCaregiverFilter] = useState('');

  // Check if current user is SuperAdmin
  const isSuperAdmin = (() => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      return userDetails?.role === 'SuperAdmin';
    } catch { return false; }
  })();

  const getAdminUserId = () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      return userDetails?.id || '';
    } catch { return ''; }
  };

  useEffect(() => {
    loadGigs();
  }, [currentPage, statusFilter, searchTerm, categoryFilter]);

  useEffect(() => {
    if (viewMode === 'deleted') {
      loadDeletedGigs();
    }
  }, [viewMode, deletedPage, deletedCaregiverFilter]);

  useEffect(() => {
    setFilteredGigs(gigs);
  }, [gigs]);

  const loadGigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page: currentPage, pageSize };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      
      const result = await adminService.getAllGigs(params);
      
      if (result.success) {
        setGigs(result.data);
        setTotalCount(result.totalCount || result.count || result.data.length);
        setHasMore(result.hasMore || false);
        const stats = adminService.getGigStatistics(result.data);
        setStatistics(stats);
      } else {
        setError(result.error || 'Failed to load gigs');
      }
    } catch (err) {
      console.error('Error loading gigs:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGig = async (gigId) => {
    try {
      const result = await adminService.getGigById(gigId);
      if (result.success) {
        setSelectedGig(result.data);
        setShowGigModal(true);
      } else {
        alert(result.error || 'Failed to load gig details');
      }
    } catch (err) {
      console.error('Error loading gig:', err);
      alert('Failed to load gig details');
    }
  };

  const closeGigModal = () => {
    setShowGigModal(false);
    setSelectedGig(null);
  };

  const loadDeletedGigs = async () => {
    try {
      setDeletedLoading(true);
      const params = { page: deletedPage, pageSize };
      if (deletedCaregiverFilter.trim()) params.caregiverId = deletedCaregiverFilter.trim();
      const result = await adminService.getDeletedGigs(params);
      if (result.success) {
        setDeletedGigs(result.data);
        setDeletedTotalCount(result.totalCount || 0);
        setDeletedHasMore(result.hasMore || false);
      } else {
        setError(result.error || 'Failed to load deleted gigs');
      }
    } catch (err) {
      console.error('Error loading deleted gigs:', err);
      setError('An unexpected error occurred');
    } finally {
      setDeletedLoading(false);
    }
  };

  // Bulk delete handlers
  const toggleGigSelection = (gigId) => {
    setSelectedGigIds(prev => {
      const next = new Set(prev);
      if (next.has(gigId)) next.delete(gigId);
      else next.add(gigId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGigIds.size === filteredGigs.length) {
      setSelectedGigIds(new Set());
    } else {
      setSelectedGigIds(new Set(filteredGigs.map(g => g.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGigIds.size === 0) return;
    const adminUserId = getAdminUserId();
    if (!adminUserId) { setError('Admin user ID not found.'); return; }

    try {
      setBulkDeleting(true);
      setBulkDeleteResult(null);
      const result = await adminService.bulkSoftDeleteGigs({
        gigIds: Array.from(selectedGigIds),
        deleteAll: false,
        adminUserId
      });
      if (result.success) {
        setBulkDeleteResult(result.data);
        setSelectedGigIds(new Set());
        loadGigs();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError('An error occurred during bulk delete.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllInput !== 'DELETE ALL') return;
    const adminUserId = getAdminUserId();
    if (!adminUserId) { setError('Admin user ID not found.'); return; }

    try {
      setBulkDeleting(true);
      setBulkDeleteResult(null);
      setShowDeleteAllConfirm(false);
      setDeleteAllInput('');
      const result = await adminService.bulkSoftDeleteGigs({
        gigIds: [],
        deleteAll: true,
        adminUserId
      });
      if (result.success) {
        setBulkDeleteResult(result.data);
        setSelectedGigIds(new Set());
        loadGigs();
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Delete all error:', err);
      setError('An error occurred during delete all.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'status-badge status-active';
      case 'Paused':
        return 'status-badge status-paused';
      case 'Draft':
        return 'status-badge status-draft';
      default:
        return 'status-badge';
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(gigs.map(gig => gig.category).filter(Boolean))];
    return categories.sort();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="gigs-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading gigs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gigs-management">
      <div className="gigs-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-briefcase"></i>
            Gigs Management
          </h1>
          <p>Manage and monitor all gigs in the system</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="admin-gigs-view-toggle">
        <button
          className={`admin-gigs-view-btn ${viewMode === 'active' ? 'active' : ''}`}
          onClick={() => setViewMode('active')}
        >
          <i className="fas fa-briefcase"></i> Active Gigs
        </button>
        <button
          className={`admin-gigs-view-btn ${viewMode === 'deleted' ? 'active' : ''}`}
          onClick={() => setViewMode('deleted')}
        >
          <i className="fas fa-trash-alt"></i> Deleted Gigs
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={loadGigs} className="retry-btn">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.total}</h3>
              <p>Total Gigs</p>
            </div>
          </div>

          <div className="stat-card stat-active">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.active}</h3>
              <p>Active Gigs</p>
            </div>
          </div>

          <div className="stat-card stat-paused">
            <div className="stat-icon">
              <i className="fas fa-pause-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.paused}</h3>
              <p>Paused Gigs</p>
            </div>
          </div>

          <div className="stat-card stat-draft">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.draft}</h3>
              <p>Draft Gigs</p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'active' && (
      <>
      {/* Bulk Delete Result Banner */}
      {bulkDeleteResult && (
        <div className="alert alert-bulk-result">
          <div className="bulk-result-summary">
            <strong>{bulkDeleteResult.message}</strong>
            <span>Deleted: {bulkDeleteResult.deletedCount} | Skipped: {bulkDeleteResult.skippedCount} | Failed: {bulkDeleteResult.failedCount}</span>
          </div>
          {bulkDeleteResult.skippedReasons && bulkDeleteResult.skippedReasons.length > 0 && (
            <ul className="bulk-skipped-list">
              {bulkDeleteResult.skippedReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          )}
          <button className="close-btn" onClick={() => setBulkDeleteResult(null)}>×</button>
        </div>
      )}

      {/* SuperAdmin Bulk Actions */}
      {isSuperAdmin && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            {selectedGigIds.size > 0 && (
              <>
                <span className="selected-count">{selectedGigIds.size} gig{selectedGigIds.size !== 1 ? 's' : ''} selected</span>
                <button
                  className="btn-bulk-delete"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedGigIds.size})`}
                </button>
              </>
            )}
          </div>
          <button
            className="btn-delete-all"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={bulkDeleting}
          >
            Delete All Gigs
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by title, caregiver, category, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>
              <i className="fas fa-filter"></i> Status
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {adminService.getGigStatusOptions().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <i className="fas fa-tag"></i> Category
            </label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <button 
            className="reset-filters-btn"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setCategoryFilter('All');
              setCurrentPage(1);
            }}
          >
            <i className="fas fa-redo"></i> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredGigs.length}</strong> of <strong>{totalCount}</strong> gigs
          {totalCount > pageSize && <span> (Page {currentPage})</span>}
        </p>
      </div>

      {/* Gigs Table */}
      <div className="table-container">
        {filteredGigs.length === 0 ? (
          <div className="no-data">
            <i className="fas fa-briefcase"></i>
            <p>No gigs found</p>
          </div>
        ) : (
          <table className="gigs-table">
            <thead>
              <tr>
                {isSuperAdmin && (
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedGigIds.size === filteredGigs.length && filteredGigs.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th>Image</th>
                <th>Title</th>
                <th>Caregiver</th>
                <th>Category</th>
                <th>Package Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGigs.map((gig) => (
                <tr key={gig.id} className={selectedGigIds.has(gig.id) ? 'row-selected' : ''}>
                  {isSuperAdmin && (
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedGigIds.has(gig.id)}
                        onChange={() => toggleGigSelection(gig.id)}
                      />
                    </td>
                  )}
                  <td data-label="Image">
                    <div className="gig-image">
                      {gig.image1 ? (
                        <img src={gig.image1} alt={gig.title} />
                      ) : (
                        <div className="no-image">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                  </td>
                  <td data-label="Title">
                    <div className="gig-title">
                      <strong>{gig.title}</strong>
                      {gig.videoURL && (
                        <span className="has-video" title="Has video">
                          <i className="fas fa-video"></i>
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Caregiver">{gig.caregiverName || 'N/A'}</td>
                  <td data-label="Category">
                    <span className="category-tag">{gig.category}</span>
                  </td>
                  <td data-label="Package Type">{gig.packageType || 'N/A'}</td>
                  <td data-label="Price">
                    <strong className="price">{formatCurrency(gig.price)}</strong>
                  </td>
                  <td data-label="Status">
                    <span className={getStatusBadgeClass(gig.status)}>
                      {gig.status}
                    </span>
                  </td>
                  <td data-label="Created">{formatDate(gig.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewGig(gig.id)}
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalCount > pageSize && (
        <div className="pagination-controls">
          <button
            className="btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="page-info">Page {currentPage} of {Math.ceil(totalCount / pageSize)}</span>
          <button
            className="btn-secondary"
            disabled={!hasMore && currentPage >= Math.ceil(totalCount / pageSize)}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Gig Details Modal */}
      </>
      )}

      {viewMode === 'deleted' && (
        <div className="deleted-gigs-section">
          {/* Caregiver Filter */}
          <div className="deleted-gigs-filter">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Filter by Caregiver ID..."
                value={deletedCaregiverFilter}
                onChange={(e) => { setDeletedCaregiverFilter(e.target.value); setDeletedPage(1); }}
              />
              {deletedCaregiverFilter && (
                <button className="clear-search" onClick={() => { setDeletedCaregiverFilter(''); setDeletedPage(1); }}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Deleted Gigs Table */}
          <div className="table-container">
            {deletedLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading deleted gigs...</p>
              </div>
            ) : deletedGigs.length === 0 ? (
              <div className="no-data">
                <i className="fas fa-trash-alt"></i>
                <p>No deleted gigs found</p>
              </div>
            ) : (
              <table className="gigs-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Caregiver</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Deleted On</th>
                    <th>Days Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedGigs.map((gig) => (
                    <tr key={gig.id}>
                      <td data-label="Title"><strong>{gig.title}</strong></td>
                      <td data-label="Caregiver">{gig.caregiverName || 'N/A'}</td>
                      <td data-label="Category"><span className="category-tag">{gig.category}</span></td>
                      <td data-label="Price"><strong className="price">{formatCurrency(gig.price)}</strong></td>
                      <td data-label="Deleted On">{formatDate(gig.deletedOn)}</td>
                      <td data-label="Days Remaining">
                        <span className={`days-remaining ${gig.daysRemaining <= 5 ? 'critical' : gig.daysRemaining <= 10 ? 'warning' : ''}`}>
                          {gig.daysRemaining} day{gig.daysRemaining !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td data-label="Status">
                        {gig.canRestore ? (
                          <span className="status-badge status-restorable">Restorable</span>
                        ) : (
                          <span className="status-badge status-expired">Expired</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Deleted Gigs Pagination */}
          {deletedTotalCount > pageSize && (
            <div className="pagination-controls">
              <button
                className="btn-secondary"
                disabled={deletedPage <= 1}
                onClick={() => setDeletedPage(prev => prev - 1)}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <span className="page-info">Page {deletedPage} of {Math.ceil(deletedTotalCount / pageSize)}</span>
              <button
                className="btn-secondary"
                disabled={!deletedHasMore && deletedPage >= Math.ceil(deletedTotalCount / pageSize)}
                onClick={() => setDeletedPage(prev => prev + 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gig Details Modal */}
      {showGigModal && selectedGig && (
        <div className="modal-overlay" onClick={closeGigModal}>
          <div className="modal-content gig-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gig Details</h2>
              <button className="close-btn" onClick={closeGigModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="gig-details-grid">
                {/* Image Section */}
                <div className="detail-section">
                  <h3>Image</h3>
                  {selectedGig.image1 ? (
                    <img 
                      src={selectedGig.image1} 
                      alt={selectedGig.title}
                      className="gig-detail-image"
                    />
                  ) : (
                    <div className="no-image-large">
                      <i className="fas fa-image"></i>
                      <p>No image available</p>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-item">
                    <label>Title:</label>
                    <span>{selectedGig.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span className="category-tag">{selectedGig.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sub-Categories:</label>
                    <span>
                      {Array.isArray(selectedGig.subCategory) 
                        ? selectedGig.subCategory.join(', ') 
                        : selectedGig.subCategory || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Tags:</label>
                    <span>{selectedGig.tags || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={getStatusBadgeClass(selectedGig.status)}>
                      {selectedGig.status}
                    </span>
                  </div>
                </div>

                {/* Package Info */}
                <div className="detail-section">
                  <h3>Package Information</h3>
                  <div className="detail-item">
                    <label>Package Type:</label>
                    <span>{selectedGig.packageType}</span>
                  </div>
                  <div className="detail-item">
                    <label>Package Name:</label>
                    <span>{selectedGig.packageName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Package Details:</label>
                    <ul className="package-details-list">
                      {Array.isArray(selectedGig.packageDetails) ? (
                        selectedGig.packageDetails.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))
                      ) : (
                        <li>{selectedGig.packageDetails || 'N/A'}</li>
                      )}
                    </ul>
                  </div>
                  <div className="detail-item">
                    <label>Delivery Time:</label>
                    <span>{selectedGig.deliveryTime}</span>
                  </div>
                  <div className="detail-item">
                    <label>Price:</label>
                    <span className="price-large">{formatCurrency(selectedGig.price)}</span>
                  </div>
                </div>

                {/* Caregiver Info */}
                <div className="detail-section">
                  <h3>Caregiver Information</h3>
                  <div className="detail-item">
                    <label>Caregiver ID:</label>
                    <span className="mono">{selectedGig.caregiverId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Caregiver Name:</label>
                    <span>{selectedGig.caregiverName}</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="detail-section">
                  <h3>Timestamps</h3>
                  <div className="detail-item">
                    <label>Created At:</label>
                    <span>{formatDate(selectedGig.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Updated On:</label>
                    <span>{formatDate(selectedGig.updatedOn)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Updated to Pause:</label>
                    <span>{selectedGig.isUpdatedToPause ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {/* Video */}
                {selectedGig.videoURL && (
                  <div className="detail-section full-width">
                    <h3>Video</h3>
                    <a 
                      href={selectedGig.videoURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="video-link"
                    >
                      <i className="fas fa-video"></i> View Video
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={closeGigModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllInput(''); }}>
          <div className="modal-content delete-all-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete All Gigs</h2>
              <button className="close-btn" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllInput(''); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="delete-all-warning">
                This will soft-delete <strong>ALL gigs</strong> in the system. Gigs with active contracts, subscriptions, or orders will be skipped.
              </p>
              <p>Type <strong>DELETE ALL</strong> to confirm:</p>
              <input
                type="text"
                className="delete-all-input"
                value={deleteAllInput}
                onChange={(e) => setDeleteAllInput(e.target.value)}
                placeholder="Type DELETE ALL"
              />
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllInput(''); }}>
                Cancel
              </button>
              <button
                className="btn-confirm-delete-all"
                disabled={deleteAllInput !== 'DELETE ALL' || bulkDeleting}
                onClick={handleDeleteAll}
              >
                {bulkDeleting ? 'Deleting...' : 'Confirm Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigsManagement;

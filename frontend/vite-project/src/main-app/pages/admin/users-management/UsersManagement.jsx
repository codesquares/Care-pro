import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './users-management.css';
import config from '../../../config';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  const pageSize = 10;
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await axios.get(`${config.BASE_URL}/Auths/ApplicantUsers`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            pageNumber: currentPage,
            pageSize
          }
        });
        
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentPage]);

  // Filter users based on role and search query
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Handle sending notification to user
  const handleSendNotification = async () => {
    try {
      if (!selectedUser || !notificationText.trim()) {
        toast.error('Please select a user and enter a notification message');
        return;
      }
      
      const token = localStorage.getItem('authToken');
      
      await axios.post(`${config.BASE_URL}/Notifications/SendNotification`, {
        userId: selectedUser.id,
        message: notificationText,
        title: 'Admin Notification',
        type: 'Admin'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success(`Notification sent to ${selectedUser.firstName} ${selectedUser.lastName}`);
      setShowNotificationModal(false);
      setNotificationText('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error sending notification:', err);
      toast.error('Failed to send notification');
    }
  };
  
  // Open notification modal for a user
  const openSendNotification = (user) => {
    setSelectedUser(user);
    setShowNotificationModal(true);
  };
  
  // View user details
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  return (
    <div className="users-management">
      <header className="page-header">
        <h1>Users Management</h1>
        <p>View and manage all users in the Care Pro system</p>
      </header>
      
      <div className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="role-filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button 
            className={filter === 'client' ? 'active' : ''} 
            onClick={() => setFilter('client')}
          >
            Clients
          </button>
          <button 
            className={filter === 'caregiver' ? 'active' : ''} 
            onClick={() => setFilter('caregiver')}
          >
            Caregivers
          </button>
          <button 
            className={filter === 'admin' ? 'active' : ''} 
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name">
                          <div className="user-avatar">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="user-full-name">{user.firstName} {user.lastName}</div>
                            <div className="user-id">ID: {user.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view" 
                            onClick={() => viewUserDetails(user)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="action-btn message" 
                            onClick={() => openSendNotification(user)}
                            title="Send Notification"
                          >
                            <i className="fas fa-bell"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-results">
                      <p>No users found matching your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pagination">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>
            <span>Page {currentPage}</span>
            <button 
              disabled={filteredUsers.length < pageSize} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </>
      )}
      
      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content user-details-modal">
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-profile-header">
                <div className="large-avatar">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </div>
                <div className="user-headline">
                  <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <span className={`role-badge ${selectedUser.role.toLowerCase()}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              
              <div className="user-details-grid">
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{selectedUser.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">User ID:</span>
                  <span className="value">{selectedUser.id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedUser.phoneNo || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Address:</span>
                  <span className="value">{selectedUser.homeAddress || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Joined Date:</span>
                  <span className="value">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-indicator ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="user-actions">
                <button 
                  className="btn primary-btn" 
                  onClick={() => {
                    setShowUserModal(false);
                    openSendNotification(selectedUser);
                  }}
                >
                  <i className="fas fa-bell"></i> Send Notification
                </button>
                {/* Add more user action buttons as needed */}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Send Notification Modal */}
      {showNotificationModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content notification-modal">
            <div className="modal-header">
              <h2>Send Notification</h2>
              <button className="close-btn" onClick={() => setShowNotificationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="recipient">
                To: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
              </p>
              
              <div className="form-group">
                <label htmlFor="notification-text">Message</label>
                <textarea
                  id="notification-text"
                  placeholder="Enter your notification message here..."
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  rows={5}
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn secondary-btn" 
                  onClick={() => setShowNotificationModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn primary-btn" 
                  onClick={handleSendNotification}
                  disabled={!notificationText.trim()}
                >
                  <i className="fas fa-paper-plane"></i> Send Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;

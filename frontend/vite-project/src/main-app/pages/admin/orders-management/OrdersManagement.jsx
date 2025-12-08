import React, { useState, useEffect } from 'react';
import adminService from '../../../services/adminService';
import './orders-management.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, dateFilter, startDate, endDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminService.getAllOrders();
      
      if (result.success) {
        const sortedOrders = adminService.sortOrdersByDate(result.data, 'desc');
        setOrders(sortedOrders);
        const stats = adminService.getOrderStatistics(sortedOrders);
        setStatistics(stats);
      } else {
        setError(result.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = adminService.filterOrdersByStatus(filtered, statusFilter);
    }

    // Filter by date
    if (dateFilter === 'custom' && (startDate || endDate)) {
      filtered = adminService.filterOrdersByDateRange(filtered, startDate, endDate);
    } else if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.orderCreatedOn) >= today);
    } else if (dateFilter === 'week') {
      filtered = adminService.getRecentOrders(filtered, 7);
    } else if (dateFilter === 'month') {
      filtered = adminService.getRecentOrders(filtered, 30);
    }

    // Search filter
    if (searchTerm) {
      filtered = adminService.searchOrders(filtered, searchTerm);
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = async (orderId) => {
    try {
      const result = await adminService.getOrderById(orderId);
      if (result.success) {
        setSelectedOrder(result.data);
        setShowOrderModal(true);
      } else {
        alert(result.error || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error loading order:', err);
      alert('Failed to load order details');
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-badge status-pending';
      case 'In Progress':
        return 'status-badge status-progress';
      case 'Completed':
        return 'status-badge status-completed';
      case 'Declined':
        return 'status-badge status-declined';
      case 'Disputed':
        return 'status-badge status-disputed';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <div className="orders-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-management">
      <div className="orders-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-shopping-cart"></i>
            Orders Management
          </h1>
          <p>Manage and monitor all orders in the system</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={loadOrders} className="retry-btn">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.total}</h3>
              <p>Total Orders</p>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.pending}</h3>
              <p>Pending Orders</p>
            </div>
          </div>

          <div className="stat-card stat-progress">
            <div className="stat-icon">
              <i className="fas fa-spinner"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card stat-disputed">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.disputed}</h3>
              <p>Disputed</p>
            </div>
          </div>

          <div className="stat-card stat-revenue">
            <div className="stat-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="stat-content">
              <h3>{formatCurrency(statistics.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by client, caregiver, or gig title..."
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
              {adminService.getOrderStatusOptions().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <i className="fas fa-calendar"></i> Date Range
            </label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <button 
            className="reset-filters-btn"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setDateFilter('all');
              setStartDate('');
              setEndDate('');
            }}
          >
            <i className="fas fa-redo"></i> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        {filteredOrders.length === 0 ? (
          <div className="no-data">
            <i className="fas fa-shopping-cart"></i>
            <p>No orders found</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Gig</th>
                <th>Client</th>
                <th>Caregiver</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="order-id">{order.id?.substring(0, 8)}...</span>
                  </td>
                  <td>
                    <div className="gig-info">
                      {order.gigImage && (
                        <img 
                          src={order.gigImage} 
                          alt={order.gigTitle}
                          className="gig-thumb"
                        />
                      )}
                      <span className="gig-title">{order.gigTitle}</span>
                    </div>
                  </td>
                  <td>{order.clientName || 'N/A'}</td>
                  <td>{order.caregiverName || 'N/A'}</td>
                  <td>
                    <strong className="amount">{formatCurrency(order.amount)}</strong>
                  </td>
                  <td>
                    <span className="payment-method">{order.paymentOption}</span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(order.clientOrderStatus)}>
                      {order.clientOrderStatus}
                    </span>
                    {order.isDeclined && (
                      <span className="declined-indicator" title="Declined">
                        <i className="fas fa-ban"></i>
                      </span>
                    )}
                  </td>
                  <td>{formatDate(order.orderCreatedOn)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewOrder(order.id)}
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

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={closeOrderModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-grid">
                {/* Order Info */}
                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-item">
                    <label>Order ID:</label>
                    <span className="mono">{selectedOrder.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={getStatusBadgeClass(selectedOrder.clientOrderStatus)}>
                      {selectedOrder.clientOrderStatus}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Is Declined:</label>
                    <span>{selectedOrder.isDeclined ? 'Yes' : 'No'}</span>
                  </div>
                  {selectedOrder.declineReason && (
                    <div className="detail-item">
                      <label>Decline Reason:</label>
                      <span className="decline-reason">{selectedOrder.declineReason}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Order Created:</label>
                    <span>{formatDate(selectedOrder.orderCreatedOn)}</span>
                  </div>
                </div>

                {/* Gig Info */}
                <div className="detail-section">
                  <h3>Gig Information</h3>
                  {selectedOrder.gigImage && (
                    <img 
                      src={selectedOrder.gigImage} 
                      alt={selectedOrder.gigTitle}
                      className="order-gig-image"
                    />
                  )}
                  <div className="detail-item">
                    <label>Gig ID:</label>
                    <span className="mono">{selectedOrder.gigId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gig Title:</label>
                    <span><strong>{selectedOrder.gigTitle}</strong></span>
                  </div>
                  <div className="detail-item">
                    <label>Gig Status:</label>
                    <span className={getStatusBadgeClass(selectedOrder.gigStatus)}>
                      {selectedOrder.gigStatus}
                    </span>
                  </div>
                  {selectedOrder.gigPackageDetails && Array.isArray(selectedOrder.gigPackageDetails) && (
                    <div className="detail-item">
                      <label>Package Details:</label>
                      <ul className="package-list">
                        {selectedOrder.gigPackageDetails.map((detail, index) => (
                          <li key={index}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Client Info */}
                <div className="detail-section">
                  <h3>Client Information</h3>
                  <div className="detail-item">
                    <label>Client ID:</label>
                    <span className="mono">{selectedOrder.clientId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Client Name:</label>
                    <span><strong>{selectedOrder.clientName}</strong></span>
                  </div>
                </div>

                {/* Caregiver Info */}
                <div className="detail-section">
                  <h3>Caregiver Information</h3>
                  <div className="detail-item">
                    <label>Caregiver ID:</label>
                    <span className="mono">{selectedOrder.caregiverId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Caregiver Name:</label>
                    <span><strong>{selectedOrder.caregiverName}</strong></span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="detail-section">
                  <h3>Payment Information</h3>
                  <div className="detail-item">
                    <label>Amount:</label>
                    <span className="amount-large">{formatCurrency(selectedOrder.amount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Option:</label>
                    <span>{selectedOrder.paymentOption}</span>
                  </div>
                  {selectedOrder.transactionId && (
                    <div className="detail-item">
                      <label>Transaction ID:</label>
                      <span className="mono">{selectedOrder.transactionId}</span>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="detail-section">
                  <h3>Additional Information</h3>
                  <div className="detail-item">
                    <label>Number of Orders:</label>
                    <span>{selectedOrder.noOfOrders || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={closeOrderModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;

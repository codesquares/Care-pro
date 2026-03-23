import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../../config';
import ContractService from '../../../services/contractService';
import '../../client/client-dashboard/marketplaceHero.css';
import './CaregiverOrders.css';

const ORDERS_PER_PAGE = 6;

const TABS = [
  { key: 'All Orders', match: null },
  { key: 'Priority', match: ['Priority'] },
  { key: 'Active', match: ['Active', 'In Progress', 'Inactive', 'Pending'] },
  { key: 'Done', match: ['Completed', 'Done'] },
  { key: 'Approved', match: ['Approved'] },
  { key: 'Disputed', match: ['Disputed'] },
  { key: 'Cancelled', match: ['Cancelled', 'Contract Rejected', 'Terminated'] },
];

const getActionText = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress' || s === 'active') return 'Click here to track this Order';
  if (s === 'approved') return 'Click here to track Progress';
  if (s === 'pending') return 'Generate Contract';
  if (s === 'inactive') return 'Review Contract';
  if (s === 'completed' || s === 'done') return 'View Details';
  if (s === 'disputed') return 'View Dispute';
  if (s === 'cancelled' || s === 'contract rejected' || s === 'terminated') return 'View Details';
  return 'View Order';
};

const getStatusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress' || s === 'active') return 'st-active';
  if (s === 'approved') return 'st-approved';
  if (s === 'pending' || s === 'inactive') return 'st-inactive';
  if (s === 'completed' || s === 'done') return 'st-done';
  if (s === 'disputed') return 'st-disputed';
  if (s === 'cancelled' || s === 'contract rejected' || s === 'terminated') return 'st-cancelled';
  return '';
};

const getStatusDesc = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'in progress' || s === 'active') return 'Order is currently active';
  if (s === 'approved') return 'Contract approved for this order';
  if (s === 'pending') return 'Contract Not yet generated';
  if (s === 'inactive') return 'Contract Not yet generated';
  if (s === 'completed' || s === 'done') return 'Order completed successfully';
  if (s === 'disputed') return 'Order is under dispute resolution';
  if (s === 'cancelled') return 'Order was cancelled';
  if (s === 'contract rejected') return 'Contract was rejected';
  if (s === 'terminated') return 'Order was terminated';
  return '';
};

const getServiceMode = (order) => {
  if (order.paymentOption === 'monthly') return 'Recurring';
  return 'One-off';
};

const CaregiverOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [serviceMode, setServiceMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contractStates, setContractStates] = useState({});

  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const caregiverId = userDetails?.id;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!caregiverId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${config.BASE_URL}/ClientOrders/CaregiverOrders/caregiverId?caregiverId=${caregiverId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) throw new Error(`Failed to fetch orders: ${response.status}`);
        const data = await response.json();
        const arr = Array.isArray(data) ? data : data.clientOrders || [];
        arr.sort((a, b) => {
          const dA = new Date(a.orderCreatedOn || a.orderDate || a.createdAt || 0);
          const dB = new Date(b.orderCreatedOn || b.orderDate || b.createdAt || 0);
          return dB - dA;
        });
        setOrders(arr);

        // Fetch contract status for each order
        const contractChecks = arr.map(async (order) => {
          try {
            const result = await ContractService.checkExistingContract(order.id);
            return {
              orderId: order.id,
              hasContract: result.success && result.hasContract,
              contract: result.data,
            };
          } catch {
            return { orderId: order.id, hasContract: false, contract: null };
          }
        });
        const results = await Promise.all(contractChecks);
        const states = {};
        results.forEach(r => { states[r.orderId] = r; });
        setContractStates(states);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message);
        toast.error('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [caregiverId]);

  // Derive an effective status that factors in contract state and disputes
  // Priority: Disputed > Terminated/Rejected > order status > contract-only Approved
  const getEffectiveStatus = (order) => {
    const orderStatus = (order.clientOrderStatus || '').toLowerCase();
    const cs = contractStates[order.id];
    const contractStatus = cs?.hasContract
      ? (cs.contract?.status || '').toLowerCase().replace(/\s+/g, '')
      : '';

    // 1. Disputed always wins
    if (order.hasDispute || orderStatus === 'disputed') return 'Disputed';

    // 2. Contract terminated or rejected → Cancelled bucket
    if (contractStatus === 'terminated') return 'Terminated';
    if (contractStatus === 'clientrejected' || contractStatus === 'caregiverrejected') return 'Contract Rejected';

    // 3. Order is In Progress or Active → Active (work is happening)
    if (orderStatus === 'in progress' || orderStatus === 'active') return 'Active';

    // 4. Order is Completed/Done → Done
    if (orderStatus === 'completed' || orderStatus === 'done') return 'Done';

    // 5. Order is Cancelled → Cancelled
    if (orderStatus === 'cancelled') return 'Cancelled';

    // 6. Order still Inactive/Pending but contract is approved → Approved
    if ((orderStatus === 'inactive' || orderStatus === 'pending') &&
        (contractStatus === 'approved' || contractStatus === 'active')) {
      return 'Approved';
    }

    // 7. Fallback to raw order status
    return order.clientOrderStatus || '';
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const c = {};
    TABS.forEach(t => {
      if (!t.match) {
        c[t.key] = orders.length;
      } else {
        c[t.key] = orders.filter(o =>
          t.match.some(s => s.toLowerCase() === getEffectiveStatus(o).toLowerCase())
        ).length;
      }
    });
    return c;
  }, [orders, contractStates]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = orders;
    const tab = TABS.find(t => t.key === activeTab);
    if (tab?.match) {
      list = list.filter(o =>
        tab.match.some(s => s.toLowerCase() === getEffectiveStatus(o).toLowerCase())
      );
    }
    if (serviceMode) {
      list = list.filter(o => getServiceMode(o) === serviceMode);
    }
    return list;
  }, [orders, activeTab, serviceMode, contractStates]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [activeTab, serviceMode]);

  const handleOrderClick = (orderId) => {
    navigate(`/app/caregiver/order-details/${orderId}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="cg-orders-page">
      {/* Banner */}
      <div className="marketplace-banner cg-orders-banner">
        <div className="marketplace-banner-content">
          <h1 className="marketplace-banner-title">Manage Orders</h1>
        </div>
        <div className="cg-orders-banner-right">
          <button
            className="cg-orders-earnings-btn"
            onClick={() => navigate('/app/caregiver/earnings')}
          >
            💰 View Earnings
          </button>
        </div>
      </div>

      <div className="cg-orders-content">
        {/* Tabs */}
        <div className="cg-orders-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`cg-orders-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.key}
              {tabCounts[tab.key] > 0 && tab.match && (
                <span className="cg-tab-count">({tabCounts[tab.key]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Service Mode Filter */}
        <div className="cg-service-mode-row">
          <span className="cg-mode-label">Service Mode:</span>
          <label className={`cg-mode-radio ${serviceMode === '' ? 'active' : ''}`}>
            <input type="radio" name="svcMode" checked={serviceMode === ''} onChange={() => setServiceMode('')} />
            Clear
          </label>
          <label className={`cg-mode-radio ${serviceMode === 'One-off' ? 'active' : ''}`}>
            <input type="radio" name="svcMode" checked={serviceMode === 'One-off'} onChange={() => setServiceMode('One-off')} />
            One-Off
          </label>
          <label className={`cg-mode-radio ${serviceMode === 'Recurring' ? 'active' : ''}`}>
            <input type="radio" name="svcMode" checked={serviceMode === 'Recurring'} onChange={() => setServiceMode('Recurring')} />
            Recurring
          </label>
        </div>

        {/* Content */}
        {loading ? (
          <div className="cg-orders-loading">
            <div className="cg-orders-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="cg-orders-error">
            <p>{error}</p>
            <button className="cg-retry-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="cg-orders-empty">
            <h2>No orders found</h2>
            <p>
              {activeTab !== 'All Orders'
                ? `You don't have any ${activeTab.toLowerCase()} orders.`
                : "You haven't received any orders yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="cg-orders-list">
              {paginatedOrders.map(order => (
                <div
                  key={order.id}
                  className="cg-order-card"
                  onClick={() => handleOrderClick(order.id)}
                >
                  {/* Image */}
                  <div className="cg-order-img-wrap">
                    <img
                      src={order.gigImage || 'https://via.placeholder.com/200x130?text=No+Image'}
                      alt={order.gigTitle}
                      className="cg-order-img"
                    />
                  </div>

                  {/* Info */}
                  <div className="cg-order-info">
                    <div className="cg-order-client-row">
                      <div className="cg-order-avatar">
                        {order.clientName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                      </div>
                      <span className="cg-order-client-name">{order.clientName || 'Unknown Client'}</span>
                      <span className="cg-verified-badge">verified ✓</span>
                      <span className="cg-order-rating">★ 4.5</span>
                    </div>
                    {order.clientLocation && (
                      <span className="cg-order-location">📍 {order.clientLocation}</span>
                    )}

                    <h3 className="cg-order-title">{order.gigTitle}</h3>

                    <div className="cg-order-meta">
                      <span className="cg-order-package">
                        Basic Package <strong>₦{Number(order.amount || 0).toLocaleString()}</strong>
                      </span>
                      <span className="cg-order-svc-mode">Service Mode: {getServiceMode(order)}</span>
                    </div>

                    <div className="cg-order-status-row">
                      <span className={`cg-status-pill ${getStatusClass(order.clientOrderStatus)}`}>
                        {order.clientOrderStatus}
                      </span>
                      <span className="cg-status-desc">{getStatusDesc(order.clientOrderStatus)}</span>
                    </div>

                    {/* Contract status */}
                    {contractStates[order.id] && (
                      <div className="cg-contract-status-row">
                        {contractStates[order.id].hasContract ? (() => {
                          const cs = contractStates[order.id].contract?.status || '';
                          const info = ContractService.getStatusDisplayInfo(cs);
                          const s = cs.toLowerCase().replace(/\s+/g, '');
                          let icon = '📋';
                          if (s === 'approved' || s === 'active' || s === 'completed') icon = '✅';
                          else if (s === 'pendingcaregiverapproval') icon = '📩';
                          else if (s === 'pendingclientapproval' || s === 'revised') icon = '⏳';
                          else if (s === 'clientreviewrequested' || s === 'caregiverreviewrequested') icon = '🔄';
                          else if (s === 'clientrejected' || s === 'caregiverrejected') icon = '❌';
                          else if (s === 'terminated') icon = '🚫';
                          else if (s === 'cancelled') icon = '🚫';
                          return (
                            <span className={`cg-contract-badge cg-contract-${s}`}>
                              {icon} {info.label}
                            </span>
                          );
                        })() : (
                          <span className="cg-contract-badge cg-contract-none">📋 No Contract</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="cg-order-action">
                    <button
                      className="cg-action-btn"
                      onClick={(e) => { e.stopPropagation(); handleOrderClick(order.id); }}
                    >
                      {getActionText(order.clientOrderStatus)}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="cg-orders-pagination">
                <button
                  className="cg-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ‹
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={`cg-page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="cg-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CaregiverOrders;

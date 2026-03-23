import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ClientReviewService from "../../../services/clientReviewService.js";
import ContractService from "../../../services/contractService.js";
import OrderTasksService from "../../../services/orderTasksService.js";
import ClientOrderService from "../../../services/clientOrderService.js";
import config from "../../../config";
import "../client-dashboard/marketplaceHero.css";
import "../../care-giver/orders/CaregiverOrders.css";

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

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [serviceMode, setServiceMode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contractStates, setContractStates] = useState({});

  const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
  const clientUserId = userDetails?.id;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!clientUserId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${config.BASE_URL}/ClientOrders/clientUserId?clientUserId=${clientUserId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const fetchedOrders = Array.isArray(response.data) ? response.data : [];
        fetchedOrders.sort((a, b) => {
          const dA = new Date(a.orderCreatedOn || a.orderDate || a.createdAt || 0);
          const dB = new Date(b.orderCreatedOn || b.orderDate || b.createdAt || 0);
          return dB - dA;
        });

        // Enrich with review ratings
        const enriched = await Promise.all(
          fetchedOrders.map(async (order) => {
            try {
              const reviews = await ClientReviewService.getReviewsForOrder(order.gigId);
              let avg = 0, count = 0;
              if (reviews?.length > 0) {
                const total = reviews.reduce((sum, r) => {
                  const v = parseFloat(r.rating || r.Rating || r.score || r.Score || 0);
                  if (!isNaN(v) && v >= 1 && v <= 5) { count++; return sum + v; }
                  return sum;
                }, 0);
                avg = count > 0 ? total / count : 0;
              }
              return { ...order, calculatedRating: avg, reviewCount: count };
            } catch {
              return { ...order, calculatedRating: 0, reviewCount: 0 };
            }
          })
        );

        setOrders(enriched);

        // Fetch contract status for each order
        const contractChecks = enriched.map(async (order) => {
          try {
            const result = await ContractService.checkExistingContract(order.id);
            return { orderId: order.id, hasContract: result.success && result.hasContract, contract: result.data };
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
  }, [clientUserId]);

  // Effective status combining order + contract status
  const getEffectiveStatus = (order) => {
    const orderStatus = (order.clientOrderStatus || '').toLowerCase();
    const cs = contractStates[order.id];
    const contractStatus = cs?.hasContract
      ? (cs.contract?.status || '').toLowerCase().replace(/\s+/g, '')
      : '';
    if (order.hasDispute || orderStatus === 'disputed') return 'Disputed';
    if (contractStatus === 'terminated') return 'Terminated';
    if (contractStatus === 'clientrejected' || contractStatus === 'caregiverrejected') return 'Contract Rejected';
    if (orderStatus === 'in progress' || orderStatus === 'active') return 'Active';
    if (orderStatus === 'completed' || orderStatus === 'done') return 'Done';
    if (orderStatus === 'cancelled') return 'Cancelled';
    if ((orderStatus === 'inactive' || orderStatus === 'pending') &&
        (contractStatus === 'approved' || contractStatus === 'active')) return 'Approved';
    return order.clientOrderStatus || '';
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const c = {};
    TABS.forEach(t => {
      if (!t.match) { c[t.key] = orders.length; }
      else { c[t.key] = orders.filter(o => t.match.some(s => s.toLowerCase() === getEffectiveStatus(o).toLowerCase())).length; }
    });
    return c;
  }, [orders, contractStates]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = orders;
    const tab = TABS.find(t => t.key === activeTab);
    if (tab?.match) {
      list = list.filter(o => tab.match.some(s => s.toLowerCase() === getEffectiveStatus(o).toLowerCase()));
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
    navigate(`/app/client/my-order/${orderId}`);
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
                : "You haven't placed any orders yet."}
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
                        {order.caregiverName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                      </div>
                      <span className="cg-order-client-name">{order.caregiverName || 'Unknown Caregiver'}</span>
                      <span className="cg-verified-badge">verified ✓</span>
                      <span className="cg-order-rating">
                        {order.calculatedRating > 0
                          ? `★ ${order.calculatedRating.toFixed(1)}`
                          : '★ —'}
                      </span>
                    </div>

                    <h3 className="cg-order-title">{order.gigTitle}</h3>

                    <div className="cg-order-meta">
                      <span className="cg-order-package">
                        Basic Package <strong>₦{Number(order.amount || 0).toLocaleString()}</strong>
                      </span>
                      <span className="cg-order-svc-mode">Service Mode: {getServiceMode(order)}</span>
                      {order.billingCycleNumber > 0 && (
                        <span className="cg-order-svc-mode">Cycle {order.billingCycleNumber}</span>
                      )}
                    </div>

                    <div className="cg-order-status-row">
                      <span className={`cg-status-pill ${getStatusClass(order.clientOrderStatus)}`}>
                        {order.clientOrderStatus}
                      </span>
                      <span className="cg-status-desc">{getStatusDesc(order.clientOrderStatus)}</span>
                    </div>

                    {/* Contract status badge */}
                    {contractStates[order.id] && (
                      <div className="cg-contract-status-row">
                        {contractStates[order.id].hasContract ? (() => {
                          const cs = contractStates[order.id].contract?.status || '';
                          const info = ContractService.getStatusDisplayInfo(cs);
                          const s = cs.toLowerCase().replace(/\s+/g, '');
                          let icon = '📋';
                          if (s === 'approved' || s === 'active' || s === 'completed') icon = '✅';
                          else if (s === 'pendingclientapproval' || s === 'revised') icon = '📩';
                          else if (s === 'pendingcaregiverapproval') icon = '⏳';
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

                    {/* Fund status */}
                    {(() => {
                      const info = ClientOrderService.getFundStatusInfo(order);
                      if (!info.label) return null;
                      const colorMap = {
                        'fund-status--released': { bg: '#e8f5e9', color: '#2e7d32' },
                        'fund-status--auto-released': { bg: '#e3f2fd', color: '#1565c0' },
                        'fund-status--pending': { bg: '#fff3e0', color: '#e65100' },
                        'fund-status--disputed': { bg: '#fce4ec', color: '#c62828' },
                      };
                      const style = colorMap[info.className] || { bg: '#f5f5f5', color: '#666' };
                      return (
                        <span style={{
                          display: 'inline-block', fontSize: '0.72rem', fontWeight: 600,
                          padding: '3px 10px', borderRadius: '6px', marginTop: '4px',
                          backgroundColor: style.bg, color: style.color
                        }}>
                          {info.label}
                        </span>
                      );
                    })()}
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

export default MyOrders;

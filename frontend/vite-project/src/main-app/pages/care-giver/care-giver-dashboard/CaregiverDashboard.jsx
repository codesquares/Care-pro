import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import ProfileCard from './ProfileCard';
import StatisticsCard from './StatisticsCard';
import OrderList from './OrderList';
import PendingNegotiations from './PendingNegotiations';
import './CaregiverDashboard.css';
import setting from '../../../../assets/setting.png';
import config from '../../../config';
import accountDeletionService from '../../../services/accountDeletionService';

const CaregiverDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingDeletionDate, setPendingDeletionDate] = useState(null);
  const [showDeletionBanner, setShowDeletionBanner] = useState(true);
  const [cancelDeletionLoading, setCancelDeletionLoading] = useState(false);
  const [showCancelDeletionConfirm, setShowCancelDeletionConfirm] = useState(false);
      const navigate = useNavigate();
      const basePath = "/app/caregiver";

   // Retrieve user details from localStorage
   const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
   const caregiverId = userDetails?.id;
   // FIXED: Use centralized config instead of hardcoded Azure staging API URL fallback
   const vite_API_URL = config.BASE_URL; // Use centralized config for consistent API routing

  // Check for pending account deletion on mount
  useEffect(() => {
    const checkDeletionStatus = async () => {
      if (!caregiverId) return;
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${vite_API_URL}/CareGivers/${caregiverId}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.accountDeletionRequestedAt) {
            const deletionDate = new Date(
              new Date(data.accountDeletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
            );
            setPendingDeletionDate(deletionDate);
          }
        }
      } catch (err) {
        console.warn('Could not check deletion status', err);
      }
    };
    checkDeletionStatus();
  }, [caregiverId]);

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
           `${vite_API_URL}/ClientOrders/CaregiverOrders/caregiverId?caregiverId=${caregiverId}`,
           {
             headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
             }
           }
         );
         if (!response.ok) {
           throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
         }
         const data = await response.json();
 
         const ordersArray = Array.isArray(data) ? data : data.clientOrders || [];
         // Sort orders by most recent first
         ordersArray.sort((a, b) => {
           const dateA = new Date(a.orderCreatedOn || a.orderDate || a.createdAt || 0);
           const dateB = new Date(b.orderCreatedOn || b.orderDate || b.createdAt || 0);
           return dateB - dateA;
         });
         setOrders(ordersArray);
         setTotalOrders(ordersArray.length);
          // setTotalEarnings(data.totalEarning);
       } catch (error) {
         console.error("Error fetching orders:", error);
         setError(error.message);
       } finally {
         setLoading(false);
       }
     };
 
     fetchOrders();
   }, [caregiverId]);

  // Fetch total earnings from the same endpoint used by the NavigationBar
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!caregiverId) return;
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${vite_API_URL}/WithdrawalRequests/TotalAmountEarnedAndWithdrawn/${caregiverId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setTotalEarnings(data.totalAmountEarned ?? 0);
      } catch (error) {
        console.error('Failed to fetch earnings:', error);
      }
    };

    fetchEarnings();
  }, [caregiverId, vite_API_URL]);

  // Add loading state for initial render
  if (loading) {
    return (
      <>
        <div className="caregiver-dashboard">
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  // Add error state with retry option
  if (error) {
    return (
      <>
        <div className="caregiver-dashboard">
          <div className="dashboard-error">
            <h3>Error Loading Dashboard</h3>
            <p>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Pending deletion banner */}
      {pendingDeletionDate && showDeletionBanner && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
          padding: '0.875rem 1rem', margin: '0.75rem', display: 'flex',
          alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🗑️</span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#9a3412' }}>
              Your account is scheduled for permanent deletion on{' '}
              {pendingDeletionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#c2410c' }}>
              Cancel this request before that date to restore your account and gigs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowCancelDeletionConfirm(true)}
              style={{
                background: '#ea580c', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '0.4rem 0.9rem',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              }}
            >
              Cancel Deletion
            </button>
            <button
              onClick={() => setShowDeletionBanner(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#9a3412', fontSize: '1.1rem', lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Cancel deletion confirm overlay */}
      {showCancelDeletionConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
          onClick={() => setShowCancelDeletionConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '10px', padding: '1.5rem',
              maxWidth: '420px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Cancel Account Deletion?</h3>
            <p>Are you sure you want to cancel your deletion request? Your account and all your gigs will be fully restored immediately.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowCancelDeletionConfirm(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
                }}
              >
                No, keep scheduled
              </button>
              <button
                disabled={cancelDeletionLoading}
                onClick={async () => {
                  setCancelDeletionLoading(true);
                  try {
                    await accountDeletionService.cancelCaregiverDeletion();
                    setPendingDeletionDate(null);
                    setShowDeletionBanner(false);
                    setShowCancelDeletionConfirm(false);
                  } catch (err) {
                    setShowCancelDeletionConfirm(false);
                    if (err.response?.status === 401) {
                      alert('Your session has expired. Use the "Cancel my deletion request" link in your scheduled-deletion email. After 30 days contact codesquareltd@gmail.com.');
                    } else if (err.response?.status === 400) {
                      alert(err.response?.data?.message || 'Your grace period has ended. Account deletion cannot be cancelled.');
                    } else {
                      alert('Failed to cancel account deletion. Please try again.');
                    }
                  } finally {
                    setCancelDeletionLoading(false);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px',
                  background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {cancelDeletionLoading ? 'Processing...' : 'Yes, Cancel Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <NavigationBar /> */}
      <div className="caregiver-dashboard">
        <div className="leftbar">
          <ProfileCard />
          <StatisticsCard totalOrders={totalOrders} totalEarnings={totalEarnings} />
          <div 
            className="setting-container" 
            role="button"
            tabIndex={0}
            onClick={() => navigate(`${basePath}/settings`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`${basePath}/settings`);
              }
            }}
          >
            <img src={setting} alt="Settings" className="setting-image" />
            <span className="setting-text">Account Settings</span>
          </div>
        </div>

        <div className="rightbar">
          <div className="rightbar-header">
            <h3 className="rightbar-title">Recent Orders</h3>
            <button
              className="view-all-orders-btn"
              onClick={() => navigate(`${basePath}/orders`)}
            >
              View All Orders →
            </button>
          </div>
          <OrderList filter="All Orders" orders={orders.slice(0, 5)} loading={loading} error={error} />
          <PendingNegotiations />
        </div>
      </div>
    </>
  );
};

export default CaregiverDashboard;

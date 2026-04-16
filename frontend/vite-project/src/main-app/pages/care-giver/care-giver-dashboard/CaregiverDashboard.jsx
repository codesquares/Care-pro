import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import ProfileCard from './ProfileCard';
import StatisticsCard from './StatisticsCard';
import OrderList from './OrderList';
import './CaregiverDashboard.css';
import setting from '../../../../assets/setting.png';
import config from '../../../config'; // Import centralized config for API URLs

const CaregiverDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
      const navigate = useNavigate();
      const basePath = "/app/caregiver";

   // Retrieve user details from localStorage
   const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
   const caregiverId = userDetails?.id;
   // FIXED: Use centralized config instead of hardcoded Azure staging API URL fallback
   const vite_API_URL = config.BASE_URL; // Use centralized config for consistent API routing

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
        </div>
      </div>
    </>
  );
};

export default CaregiverDashboard;

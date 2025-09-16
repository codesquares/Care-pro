import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from './NavigationBar';
import ProfileCard from './ProfileCard';
import StatisticsCard from './StatisticsCard';
import OrderList from './OrderList';
import './CaregiverDashboard.css';
import setting from '../../../../assets/setting.png';

const CaregiverDashboard = () => {
  const [filter, setFilter] = useState('All Orders'); // Default filter is 'All Orders'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
      const navigate = useNavigate();
      const basePath = "/app/caregiver";

  const handleFilterChange = (e) => {
    setFilter(e.target.value); // Update the filter state based on the selected option
  };

   // Retrieve user details from localStorage
   const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
   const caregiverId = userDetails?.id;
   // const vite_API_URL = import.meta.env.VITE_API_URL; // Use the environment variable for the API URL
   const vite_API_URL = 'https://carepro-api20241118153443.azurewebsites.net/api'; 
   // Ensure this is set in your .env file
   const API_URL = `${vite_API_URL}/ClientOrders/CaregiverOrders/caregiverId?caregiverId=${caregiverId}`;

   useEffect(() => {
     const fetchOrders = async () => {
       try {
         const response = await fetch(API_URL);
         if (!response.ok) {
           throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
         }
         const data = await response.json();
 
         const ordersArray = Array.isArray(data) ? data : data.clientOrders || [];
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
   }, []);

  console.log("orders===>",orders) 
  const earningsTotal = (orders || []).reduce((acc, order) => {
    if (order.clientOrderStatus === 'Completed') {
      return acc + (order.amount || 0);
    }
    return acc;
  }, 0);

  useEffect(() => {
    setTotalEarnings(earningsTotal);
  }, [orders, earningsTotal]);

  console.log("totalEarnings===>", totalEarnings);

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
          <div className="select-dropdown-container">
            <label htmlFor="order-filter" className="sr-only">Filter orders</label>
            <select
              id="order-filter"
              className="custom-select"
              value={filter} // Set the selected option based on filter state
              onChange={handleFilterChange} // Update state on change
            >
              <option value="All Orders">All Orders</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <OrderList filter={filter} orders={orders} loading={loading} error={error} /> {/* Pass the selected filter to OrderList */}
        </div>
      </div>
    </>
  );
};

export default CaregiverDashboard;

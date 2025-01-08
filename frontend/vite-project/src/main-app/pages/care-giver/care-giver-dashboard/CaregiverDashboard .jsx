import React from 'react';
import NavigationBar from './NavigationBar';
import ProfileCard from './ProfileCard';
import StatisticsCard from './StatisticsCard';
import OrderList from './OrderList';
import './CaregiverDashboard.css';

const CaregiverDashboard = () => {
  return (
    <>
      {/* <NavigationBar /> */}
      <div className='main-content'>
        <div className='sidebar'>
          <ProfileCard />
          <StatisticsCard />
        </div>
        <div className="order-list">
        <div className="select-container">
          <label htmlFor="dropdown">Select an Option:</label>
          <select id="dropdown" className="custom-select">
            <option value="option1">All Orders</option>
            <option value="option2">In Progress</option>
            <option value="option3">Completed</option>
            <option value="option3">Cancelled</option>
          </select>
        </div>
        <OrderList />
        </div>
      </div>
    </>
  );
};

export default CaregiverDashboard;

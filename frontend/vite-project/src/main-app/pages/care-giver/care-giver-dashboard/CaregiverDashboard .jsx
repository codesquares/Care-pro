import React from 'react';
import NavigationBar from './NavigationBar';
import ProfileCard from './ProfileCard';
import StatisticsCard from './StatisticsCard';
import OrderList from './OrderList';
import './CaregiverDashboard.css';
import setting from '../../../../assets/setting.png';

const CaregiverDashboard = () => {
  return (
    <>
      {/* <NavigationBar /> */}
      <div className='dashboard'>
        <div className='leftbar'>
          <ProfileCard />
          <StatisticsCard />
          <div className='setting-container'>
            <img src={setting} alt="Setting" className="setting-image" />  
            <a href="/CaregiverSettings" className='setting-text'>Account Settings</a>
          </div>
        </div>
        <div className='rightbar'>
          <div className="select-container">
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

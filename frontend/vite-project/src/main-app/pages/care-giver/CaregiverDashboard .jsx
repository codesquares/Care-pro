import React from 'react'
import NavigationBar from './NavigationBar'
import ProfileCard from './ProfileCard'
import StatisticsCard from './StatisticsCard'
import OrderList from './OrderList'
import './CaregiverDashboard.css'

const CaregiverDashboard  = () => {
  return (
    <>
    <NavigationBar />
    <div className='main-content'>
    <div className='sidebar'>
    <ProfileCard />
    <StatisticsCard/>
    </div>
    <OrderList/>
    </div>
    </>
  )
}

export default CaregiverDashboard 
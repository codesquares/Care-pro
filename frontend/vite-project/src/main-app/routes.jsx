import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CaregiverDashboard from './pages/care-giver/CaregiverDashboard ';

function MainAppRoutes() {
    return (
        <Routes>
            <Route path='/CareGiverDashboard' element={<CaregiverDashboard />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
}

export default MainAppRoutes;

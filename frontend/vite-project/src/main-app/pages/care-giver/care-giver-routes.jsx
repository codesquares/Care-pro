import { Routes, Route } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard ';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import Earnings from './Earnings';

function CareGiverRoutes() {
    return (
        <>
        <NavigationBar />
        <Routes>
            <Route path='/dashboard' element={<CaregiverDashboard />} />
            <Route path='/profile' element={<UserProfile />} />
            <Route path='/earnings' element={<Earnings />} />
        </Routes>
        </>
    );
}

export default CareGiverRoutes;

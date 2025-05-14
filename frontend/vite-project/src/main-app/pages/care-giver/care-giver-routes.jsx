import { Routes, Route } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard ';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import CaregiverSettings from '../../components/caregiver_settings/CaregiverSettings';
import CaregiverProfile from '../../components/caregiver_settings/CaregiverProfile';
import Earnings from './Earnings';
import Order from './Order';
import CreateGig from './CreateGig';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';

function CareGiverRoutes() {
    return (
        <>
        <NavigationBar />
        <Routes>
            <Route path='/dashboard' element={<CaregiverDashboard />} />
            <Route path='/profile' element={<UserProfile />} />
            <Route path='/earnings' element={<Earnings />} />
            <Route path='/orders' element={<Order />} />
            <Route path='/create-gigs' element={<CreateGig/>} />
            <Route path='/settings' element={<CaregiverSettings />} />
            <Route path="/CaregiverProfile" element={<CaregiverProfile />} />
            <Route path="/message" element={<Messages />} />
            <Route path="/message/:recipientId" element={<DirectMessage />} />
        </Routes>
        </>
    );
}

export default CareGiverRoutes;

import { Routes, Route } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import CaregiverSettings from '../../components/caregiver_settings/CaregiverSettings';
import CaregiverProfile from '../../components/caregiver_settings/CaregiverProfile';
import Earnings from './Earnings';
import Order from './Order';
import CreateGig from './CreateGig';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';
import VerificationPage from './verification/VerificationPage';
import AssessmentPage from './verification/AssessmentPage';
import NotificationsPage from '../../components/Notifications/Notifications';

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
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
        </Routes>
        </>
    );
}

export default CareGiverRoutes;

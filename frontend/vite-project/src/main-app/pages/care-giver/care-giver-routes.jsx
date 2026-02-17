import { Routes, Route } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import CaregiverSettings from '../../components/caregiver_settings/CaregiverSettings';
import CaregiverProfile from '../../components/caregiver_settings/CaregiverProfile';
import Earnings from './Earnings';
import EarningsPage from './EarningsPage';
import WithdrawPage from './WithdrawPage';
import Order from './Order';
import CreateGig from './CreateGig';
import CreateOffer from '../CreateOffer';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';
import VerificationPage from './verification/VerificationPage';
import VerificationCallback from './verification/VerificationCallback';
import AssessmentPage from './verification/AssessmentPage';
import SpecializedAssessmentPage from './verification/SpecializedAssessmentPage';
import SpecializedAssessmentsPage from './verification/SpecializedAssessmentsPage';
import NotificationsPage from '../../components/Notifications/Notifications';
import ErrorBoundary from '../../components/ErrorBoundary';
import CaregiverOrderDetails from './orders/CaregiverOrderDetails';
import { GigEditProvider } from '../../contexts/GigEditContext';
import '../../components/ErrorBoundary.css';
import FAQPage from '../client/orders/FAQ';
import CaregiverSubscriptions from './subscriptions/CaregiverSubscriptions';
import CaregiverSubscriptionDetail from './subscriptions/CaregiverSubscriptionDetail';
import NotFoundPage from '../../../pages/NotFoundPage';

function CareGiverRoutes() {
    return (
        <GigEditProvider>
            <NavigationBar />
            <Routes>
                <Route path='/dashboard' element={
                    <ErrorBoundary>
                        <CaregiverDashboard />
                    </ErrorBoundary>
                } />
                <Route path='/profile' element={<UserProfile />} />
                <Route path='/earnings' element={<EarningsPage />} />
                <Route path='/withdraw' element={<WithdrawPage />} />
                <Route path='/earnings-old' element={<Earnings />} />
                <Route path='/orders' element={<Order />} />
                <Route path='/create-gigs' element={<CreateGig/>} />
                <Route path='/create-offer' element={<CreateOffer/>} />
                <Route path='/settings' element={<CaregiverSettings />} />
                <Route path="/CaregiverProfile" element={<CaregiverProfile />} />
                <Route path="/message" element={<Messages />} />
                <Route path="/message/:recipientId" element={<DirectMessage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/verification" element={<VerificationPage />} />
                <Route path="/verification-callback" element={<VerificationCallback />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/specialized-assessment" element={<SpecializedAssessmentPage />} />
                <Route path="/specialized-assessments" element={<SpecializedAssessmentsPage />} />
                <Route path="/order-details/:orderId" element={<CaregiverOrderDetails />} />
                <Route path="/subscriptions" element={<CaregiverSubscriptions />} />
                <Route path="/subscriptions/:id" element={<CaregiverSubscriptionDetail />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </GigEditProvider>
    );
}

export default CareGiverRoutes;

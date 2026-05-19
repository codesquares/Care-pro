import { Routes, Route, Navigate } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import CaregiverSettings from '../../components/caregiver_settings/CaregiverSettings';
import CaregiverProfile from '../../components/caregiver_settings/CaregiverProfile';
import Earnings from './Earnings';
import EarningsPage from './EarningsPage';
import WithdrawPage from './WithdrawPage';
import CaregiverOrders from './orders/CaregiverOrders';
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
import CaregiverWallet from './wallet/CaregiverWallet';
import ClientsRequests from './client-requests/ClientsRequests';
import CaregiverResponses from './CaregiverResponses';
import CaregiverProfileReviews from './profile/CaregiverProfileReviews';
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
                <Route path='/orders' element={<CaregiverOrders />} />
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
                {/* Specialized assessments temporarily disabled */}
                <Route path="/specialized-assessment" element={<Navigate to="/app/caregiver/assessment" replace />} />
                <Route path="/specialized-assessments" element={<Navigate to="/app/caregiver/assessment" replace />} />
                <Route path="/order-details/:orderId" element={<CaregiverOrderDetails />} />
                <Route path="/subscriptions" element={<CaregiverSubscriptions />} />
                <Route path="/subscriptions/:id" element={<CaregiverSubscriptionDetail />} />
                <Route path="/wallet" element={<CaregiverWallet />} />
                <Route path="/client-requests" element={<ClientsRequests />} />
                <Route path="/my-responses" element={<CaregiverResponses />} />
                <Route path="/profile/reviews" element={<CaregiverProfileReviews />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </GigEditProvider>
    );
}

export default CareGiverRoutes;

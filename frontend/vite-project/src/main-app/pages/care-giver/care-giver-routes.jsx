import { Routes, Route, Navigate } from 'react-router-dom';
import CaregiverDashboard from './care-giver-dashboard/CaregiverDashboard';
import UserProfile from './care-giver-profile/UserProfile';
import NavigationBar from './care-giver-dashboard/NavigationBar';
import CaregiverSettings from '../../components/caregiver_settings/CaregiverSettings';
import CaregiverProfile from '../../components/caregiver_settings/CaregiverProfile';
import EarningsPage from './EarningsPage';
import WithdrawPage from './WithdrawPage';
// Legacy Orders flow — retired in favor of My Assignments. Component files are
// preserved (fully commented out, not deleted) at ./orders/CaregiverOrders.jsx
// and ./orders/CaregiverOrderDetails.jsx; their imports below are retired too.
// import CaregiverOrders from './orders/CaregiverOrders';
import MyAssignments from './assignments/MyAssignments';
import AssignmentDetail from './assignments/AssignmentDetail';
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
// import CaregiverOrderDetails from './orders/CaregiverOrderDetails';
import { GigEditProvider } from '../../contexts/GigEditContext';
import '../../components/ErrorBoundary.css';
import FAQPage from '../client/orders/FAQ';
import CaregiverSubscriptions from './subscriptions/CaregiverSubscriptions';
import CaregiverSubscriptionDetail from './subscriptions/CaregiverSubscriptionDetail';
import CaregiverWallet from './wallet/CaregiverWallet';
import CaregiverProfileReviews from './profile/CaregiverProfileReviews';
import NotFoundPage from '../../../pages/NotFoundPage';
import FeatureMovedNotice from '../../components/shared/FeatureMovedNotice';
import VettingHub from './vetting/VettingHub';
import ClassificationForm from './vetting/ClassificationForm';
import GuarantorsForm from './vetting/GuarantorsForm';
import AddressHistoryForm from './vetting/AddressHistoryForm';
import SocialMediaForm from './vetting/SocialMediaForm';

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
                <Route path='/orders' element={<FeatureMovedNotice title="Orders have moved" message="Your orders are now under My Assignments." homePath="/app/caregiver/assignments" homeLabel="Go to My Assignments" />} />
                <Route path='/assignments' element={<MyAssignments />} />
                <Route path='/assignments/:id' element={<AssignmentDetail />} />
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
                <Route path="/order-details/:orderId" element={<FeatureMovedNotice title="Orders have moved" message="Your orders are now under My Assignments." homePath="/app/caregiver/assignments" homeLabel="Go to My Assignments" />} />
                <Route path="/subscriptions" element={<CaregiverSubscriptions />} />
                <Route path="/subscriptions/:id" element={<CaregiverSubscriptionDetail />} />
                <Route path="/wallet" element={<CaregiverWallet />} />
                <Route path="/vetting" element={<VettingHub />} />
                <Route path="/vetting/classification" element={<ClassificationForm />} />
                <Route path="/vetting/guarantors" element={<GuarantorsForm />} />
                <Route path="/vetting/address-history" element={<AddressHistoryForm />} />
                <Route path="/vetting/social-media" element={<SocialMediaForm />} />
                {/* Tier A: the competitive care-request flow is retired pending the
                    package-request + internal-assignment rebuild (Tier D). */}
                <Route path="/client-requests" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Client requests are moving to guided care packages. This will be back soon." />} />
                <Route path="/my-responses" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Your responses are moving to guided care packages. This will be back soon." />} />
                <Route path="/profile/reviews" element={<CaregiverProfileReviews />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/price-negotiation/:negotiationId" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Price negotiation is moving to guided care packages. This will be back soon." />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </GigEditProvider>
    );
}

export default CareGiverRoutes;

import { Routes, Route } from 'react-router-dom';
import ClientDashboard from './client-dashboard/ClientDashboard';
import NavigationBar from './ClientNavBar';
import PaymentPage from './payment/PaymentPage';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';
import PaymentSuccess from './home-care-service/PaymentSuccess';
import CommitmentSuccess from './home-care-service/CommitmentSuccess';
import MyOrders from './orders/MyOrders';
import OrderDetails from './orders/OrderTasks&Details';
import OrderHistory from './orders/OrderHistory';
import ClientSettings from './client-settings/ClientSettings';
import ClientPreferences from './preferences/ClientPreferences';
import ClientVerificationPage from './verification/VerificationPage';
// Retired: Care Needs wizard (source preserved commented out under ./care-needs/).
// import CareNeedsSettings from './care-needs/CareNeedsSettings';
import ClientProfile from './profile/ClientProfile';
import NotificationsPage from '../../components/Notifications/Notifications';
import ResolutionCenter from './orders/ResolutionCenter';
import FAQPage from './orders/FAQ';
import ClientSubscriptions from './subscriptions/ClientSubscriptions';
import SubscriptionDetail from './subscriptions/SubscriptionDetail';
import ClientBilling from './billing/ClientBilling';
import InvoiceDetail from './billing/InvoiceDetail';
import ClientWallet from './wallet/ClientWallet';
import ClientBookings from './bookings/ClientBookings';
import ContractDetailPage from './orders/ContractDetailPage';
import NotFoundPage from '../../../pages/NotFoundPage';
import OnboardingQaHarness from './onboarding/OnboardingQaHarness';
import FeatureMovedNotice from '../../components/shared/FeatureMovedNotice';
import MyPackageRequests from './package-requests/MyPackageRequests';
import PackageRequestDetail from './package-requests/PackageRequestDetail';


function ClientRoutes() {
    return (
        <>
        <NavigationBar />
        <Routes>
            <Route path='/dashboard' element={<ClientDashboard />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/message" element={<Messages />} />
            <Route path="/message/:recipientId" element={<DirectMessage />} />
            <Route path="/app/client/payment-success" element={<PaymentSuccess />} />
            <Route path="/my-order" element={<MyOrders />} />
            <Route path="/my-order/:orderId" element={<OrderDetails />} />
            <Route path="/my-order/:orderId/contract" element={<ContractDetailPage />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/settings" element={<ClientSettings />} />
            <Route path="/preferences" element={<ClientPreferences />} />
            <Route path="/verification" element={<ClientVerificationPage />} />
            {/* Retired: the Care Needs wizard promised caregiver matching that no longer exists — caregivers are
                assigned internally from a care package. Old bookmarks and returnTo links land on this notice. */}
            <Route path="/care-needs" element={<FeatureMovedNotice title="Care needs setup has been retired" message="You no longer need to set up care preferences. Browse our care packages, or talk to our care team for a free assessment, and we'll match you with a vetted caregiver." homePath="/marketplace" homeLabel="Browse care packages" />} />
            {/* Tier A: the competitive care-request flow is retired pending the
                package-request + internal-assignment rebuild (Tier D). */}
            <Route path="/post-project" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Posting a job request is moving to guided care packages. This will be back soon." />} />
            <Route path="/care-requests/:requestId/matches" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Caregiver matching is moving to guided care packages. This will be back soon." />} />
            <Route path="/care-requests/:requestId/detail" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Care request details are moving to guided care packages. This will be back soon." />} />
            <Route path="/your-requests" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Your care requests are moving to guided care packages. This will be back soon." />} />
            <Route path="/requests" element={<MyPackageRequests />} />
            <Route path="/requests/:id" element={<PackageRequestDetail />} />
            <Route path="/profile" element={<ClientProfile />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            {/* Retired: direct gig checkout. Care is requested as packages and the caregiver is assigned
                internally; POST /payments/initiate is rejected server-side for every caller. */}
            <Route path="/cart/:id" element={<FeatureMovedNotice title="Direct hiring has been retired" message="You no longer pick and pay for a specific caregiver. Choose a care package and we'll match you with the right caregiver." homePath="/marketplace" homeLabel="Browse care packages" />} />
            <Route path="/commitment-success" element={<CommitmentSuccess />} />
            {/* Chat is no longer unlocked by a fee (conversations are tied to assignments), so the fee can't be
                started any more. /commitment-success stays so an in-flight payment can still verify and get a receipt. */}
            <Route path="/commitment-payment/:id" element={<FeatureMovedNotice title="Chat unlock payments have been retired" message="Messaging is now available between you and your assigned caregiver once they accept your package request — no payment is needed." homePath="/app/client/requests" homeLabel="Go to My Requests" />} />
            <Route path="/subscriptions" element={<ClientSubscriptions />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="/billing" element={<ClientBilling />} />
            <Route path="/billing/:id" element={<InvoiceDetail />} />
            <Route path="/wallet" element={<ClientWallet />} />
            <Route path="/bookings" element={<ClientBookings />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/price-negotiation/:negotiationId" element={<FeatureMovedNotice title="Care requests are being rebuilt" message="Price negotiation is moving to guided care packages. This will be back soon." />} />
            <Route path="/onboarding-qa" element={<OnboardingQaHarness />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </>
    );
}

export default ClientRoutes;

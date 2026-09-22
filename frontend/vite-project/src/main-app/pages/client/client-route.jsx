import { Routes, Route } from 'react-router-dom';
import ClientDashboard from './client-dashboard/ClientDashboard';
import HomeCareService from './home-care-service/HomeCareService';
import NavigationBar from './ClientNavBar';
import PaymentPage from './payment/PaymentPage';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';
import PaymentSuccess from './home-care-service/PaymentSuccess';
import CommitmentSuccess from './home-care-service/CommitmentSuccess';
import CommitmentPayment from './home-care-service/CommitmentPayment';
import MyOrders from './orders/MyOrders';
import OrderDetails from './orders/OrderTasks&Details';
import OrderHistory from './orders/OrderHistory';
import ClientSettings from './client-settings/ClientSettings';
import ClientPreferences from './preferences/ClientPreferences';
import ClientVerificationPage from './verification/VerificationPage';
import CareNeedsSettings from './care-needs/CareNeedsSettings';
import ClientProfile from './profile/ClientProfile';
import Cart from '../client/cart/Cart';
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
            <Route path="/care-needs" element={<CareNeedsSettings />} />
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
            <Route path="/cart/:id" element={<Cart />} />
            <Route path="/commitment-success" element={<CommitmentSuccess />} />
            <Route path="/commitment-payment/:id" element={<CommitmentPayment />} />
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

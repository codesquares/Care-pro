import { Routes, Route } from 'react-router-dom';
import ClientDashboard from './client-dashboard/ClientDashboard';
import HomeCareService from './home-care-service/HomeCareService';
import NavigationBar from './ClientNavBar';
import PaymentPage from './payment/PaymentPage';
import Messages from '../Messages';
import DirectMessage from '../../components/messages/DirectMessage';
import PaymentSuccess from './home-care-service/PaymentSuccess';
import MyOrders from './orders/MyOrders';
import OrderDetails from './orders/OrderTasks&Details';
import OrderHistory from './orders/OrderHistory';
import ClientSettings from './client-settings/ClientSettings';
import ClientPreferences from './preferences/ClientPreferences';
// import ClientVerificationPage from './verification/VerificationPage';
import CareNeedsSettings from './care-needs/CareNeedsSettings';
import ClientProfile from './profile/ClientProfile';
import RequestCaregiver from './request-caregiver/RequestCaregiver';
import Cart from '../client/cart/Cart';
import NotificationsPage from '../../components/Notifications/Notifications';
import ResolutionCenter from './orders/ResolutionCenter';
import FAQPage from './orders/FAQ';
import ClientSubscriptions from './subscriptions/ClientSubscriptions';
import SubscriptionDetail from './subscriptions/SubscriptionDetail';
import ClientBilling from './billing/ClientBilling';
import InvoiceDetail from './billing/InvoiceDetail';
import NotFoundPage from '../../../pages/NotFoundPage';


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
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/settings" element={<ClientSettings />} />
            <Route path="/preferences" element={<ClientPreferences />} />
            {/* <Route path="/verification" element={<ClientVerificationPage />} /> */}
            <Route path="/care-needs" element={<CareNeedsSettings />} />
            <Route path="/post-project" element={<RequestCaregiver />} />
            <Route path="/profile" element={<ClientProfile />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/cart/:id" element={<Cart />} />
            <Route path="/subscriptions" element={<ClientSubscriptions />} />
            <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="/billing" element={<ClientBilling />} />
            <Route path="/billing/:id" element={<InvoiceDetail />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </>
    );
}

export default ClientRoutes;

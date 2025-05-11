import { Routes, Route } from 'react-router-dom';
import ClientDashboard from './client-dashboard/ClientDashboard';
import HomeCareService from './home-care-service/HomeCareService';
import NavigationBar from './ClientNavBar';
import PaymentPage from './payment/PaymentPage';
import { MessagesPage } from '../../features/messaging';
import PaymentSuccess from './home-care-service/PaymentSuccess';
import MyOrders from './orders/MyOrders';
import OrderDetails from './orders/OrderTasks&Details';


function ClientRoutes() {
    return (
        <>
        <NavigationBar />
        <Routes>
            <Route path='/dashboard' element={<ClientDashboard />} />
            <Route path="/service/:id" element={<HomeCareService />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/messages" element={<MessagesPage userId={localStorage.getItem('userId')} token={localStorage.getItem('token')} />} />
            <Route path="/app/client/payment-success" element={<PaymentSuccess />} />
            <Route path="/my-order" element={<MyOrders />} />
            <Route path="/my-order/:orderId" element={<OrderDetails />} />


        </Routes>
        </>
    );
}

export default ClientRoutes;

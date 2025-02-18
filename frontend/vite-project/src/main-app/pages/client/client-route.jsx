import { Routes, Route } from 'react-router-dom';
import ClientDashboard from './client-dashboard/ClientDashboard';
import HomeCareService from './home-care-service/HomeCareService';
import NavigationBar from './ClientNavBar';
import PaymentPage from './payment/PaymentPage';
import Messages from '../Messages';


function ClientRoutes() {
    return (
        <>
        <NavigationBar />
        <Routes>
            <Route path='/dashboard' element={<ClientDashboard />} />
            <Route path="/service/:id" element={<HomeCareService />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/message" element={<Messages />} />

        </Routes>
        </>
    );
}

export default ClientRoutes;

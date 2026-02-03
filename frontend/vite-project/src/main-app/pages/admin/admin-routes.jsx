import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminNavigationBar from './admin-dashboard/AdminNavigationBar';
import WithdrawalManagement from './withdrawal-management/WithdrawalManagement';
import UsersManagement from './users-management/UsersManagement';
import CaregiverManagement from './caregiver-management/CaregiverManagement';
import ClientManagement from './client-management/ClientManagement';
import NotificationCenter from './notification-center/NotificationCenter';
import TrainingMaterialsUpload from './training-materials/TrainingMaterialsUpload';
import GigsManagement from './gigs-management/GigsManagement';
import OrdersManagement from './orders-management/OrdersManagement';
import EmailComposer from './email-composer/EmailComposer';
import CertificateManagement from './certificate-management/CertificateManagement';
import VerificationManagement from './verification-management/VerificationManagement';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DojahDataViewer from '../../components/admin/DojahDataViewer';
import DojahAdminDashboard from '../../components/admin/DojahAdminDashboard';
import WebhookDataAdmin from '../../components/admin/WebhookDataAdmin';
import NotFoundPage from '../../../pages/NotFoundPage';
function AdminRoutes() {
    const navigate = useNavigate();
    
    useEffect(() => {
        // Check if user has admin role
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const userRole = userDetails?.role;

        if (userRole !== "Admin") {
            navigate('/unauthorized', { replace: true });
        }
    }, [navigate]);
    
    return (
        <>
        <AdminNavigationBar />
        <Routes>
            <Route path='/dashboard' element={<AdminDashboard />} />
            <Route path='/question-bank' element={<QuestionBankManager />} />
            <Route path='/withdrawals' element={<WithdrawalManagement />} />
            <Route path='/users' element={<UsersManagement />} />
            <Route path='/caregivers' element={<CaregiverManagement />} />
            <Route path='/clients' element={<ClientManagement />} />
            <Route path='/notifications' element={<NotificationCenter />} />
            <Route path='/training-materials' element={<TrainingMaterialsUpload />} />
            <Route path='/gigs' element={<GigsManagement />} />
            <Route path='/orders' element={<OrdersManagement />} />
            <Route path='/emails' element={<EmailComposer />} />
            <Route path='/certificates' element={<CertificateManagement />} />
            <Route path='/dojah-data' element={<DojahDataViewer />} />
            <Route path="dojah-admin" element={<VerificationManagement />} />
            <Route path="webhook-data" element={<WebhookDataAdmin />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </>
    );
}

export default AdminRoutes;

import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminSidebar from './admin-dashboard/AdminSidebar';
import WithdrawalManagement from './withdrawal-management/WithdrawalManagement';
import UsersManagement from './users-management/UsersManagement';
import CaregiverManagement from './caregiver-management/CaregiverManagement';
import ClientManagement from './client-management/ClientManagement';
import NotificationCenter from './notification-center/NotificationCenter';
import TrainingMaterials from './training-materials/TrainingMaterials';
import AdminUserManagement from './users-management/AdminUserManagement';
import ChatCompliance from './chat-compliance/ChatCompliance';
import BookingCommitments from './booking-commitments/BookingCommitments';
import GigsManagement from './gigs-management/GigsManagement';
import OrdersManagement from './orders-management/OrdersManagement';
import EmailComposer from './email-composer/EmailComposer';
import CertificateManagement from './certificate-management/CertificateManagement';
import VerificationManagement from './verification-management/VerificationManagement';
import AdminCareRequestDetail from './care-requests/AdminCareRequestDetail';
import SubscriptionAdmin from './subscriptions/SubscriptionAdmin';
import DisputesManagement from './disputes-management/DisputesManagement';
import RefundManagement from './refund-management/RefundManagement';
import PaymentResolution from './payment-resolution/PaymentResolution';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import MiddleNameFix from './data-tools/MiddleNameFix';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DojahDataViewer from '../../components/admin/DojahDataViewer';
import DojahAdminDashboard from '../../components/admin/DojahAdminDashboard';
import WebhookDataAdmin from '../../components/admin/WebhookDataAdmin';
import NotFoundPage from '../../../pages/NotFoundPage';
import './admin-dashboard/admin-sidebar.css';

function AdminRoutes() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    useEffect(() => {
        // Check if user has admin role
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const userRole = userDetails?.role;

        if (userRole !== "Admin" && userRole !== "SuperAdmin") {
            navigate('/unauthorized', { replace: true });
        }
    }, [navigate]);
    
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="admin-layout-content">
                {/* Mobile-only topbar with hamburger */}
                <header className="admin-mobile-topbar">
                    <button
                        className="admin-mobile-hamburger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation menu"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                    <a href="/app/admin/dashboard" className="admin-mobile-topbar-logo">
                        <i className="fas fa-shield-alt"></i>
                        CarePro Admin
                    </a>
                </header>

                <Routes>
                    <Route path='/dashboard' element={<AdminDashboard />} />
                    <Route path='/question-bank' element={<QuestionBankManager />} />
                    <Route path='/withdrawals' element={<WithdrawalManagement />} />
                    <Route path='/users' element={<UsersManagement />} />
                    <Route path='/caregivers' element={<CaregiverManagement />} />
                    <Route path='/clients' element={<ClientManagement />} />
                    <Route path='/notifications' element={<NotificationCenter />} />
                    <Route path='/training-materials' element={<TrainingMaterials />} />
                    <Route path='/admin-users' element={<AdminUserManagement />} />
                    <Route path='/chat-compliance' element={<ChatCompliance />} />
                    <Route path='/booking-commitments' element={<BookingCommitments />} />
                    <Route path='/gigs' element={<GigsManagement />} />
                    <Route path='/orders' element={<OrdersManagement />} />
                    <Route path='/emails' element={<EmailComposer />} />
                    <Route path='/certificates' element={<CertificateManagement />} />
                    <Route path='/dojah-data' element={<DojahDataViewer />} />
                    <Route path="dojah-admin" element={<VerificationManagement />} />
                    <Route path="webhook-data" element={<WebhookDataAdmin />} />
                    <Route path="subscriptions" element={<SubscriptionAdmin />} />
                    <Route path="disputes" element={<DisputesManagement />} />
                    <Route path="refunds" element={<RefundManagement />} />
                    <Route path="payment-resolution" element={<PaymentResolution />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="data-tools/middle-name-fix" element={<MiddleNameFix />} />
                    <Route path="care-requests/:requestId" element={<AdminCareRequestDetail />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </div>
        </div>
    );
}

export default AdminRoutes;

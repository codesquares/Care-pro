import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminNavigationBar from './admin-dashboard/AdminNavigationBar';
import WithdrawalManagement from './withdrawal-management/WithdrawalManagement';
import UsersManagement from './users-management/UsersManagement';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DojahDataViewer from '../../components/admin/DojahDataViewer';
import DojahAdminDashboard from '../../components/admin/DojahAdminDashboard';

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
            <Route path='/dojah-data' element={<DojahDataViewer />} />
            <Route path="dojah-admin" element={<DojahAdminDashboard />} />

        </Routes>
        </>
    );
}

export default AdminRoutes;

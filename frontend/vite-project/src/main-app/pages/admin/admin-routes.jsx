import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminNavigationBar from './admin-dashboard/AdminNavigationBar';
import WithdrawalManagement from './withdrawal-management/WithdrawalManagement';
import UsersManagement from './users-management/UsersManagement';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminRoutes() {
    const navigate = useNavigate();
    
    useEffect(() => {
        // Check if user has admin role
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const userRole = userDetails?.role;

        if (userRole !== "Client" || userRole !== "Admin") {
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
        </Routes>
        </>
    );
}

export default AdminRoutes;

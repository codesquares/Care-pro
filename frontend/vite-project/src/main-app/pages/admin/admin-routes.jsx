import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminNavigationBar from './admin-dashboard/AdminNavigationBar';
import WithdrawalManagement from './withdrawal-management/WithdrawalManagement';

function AdminRoutes() {
    return (
        <>
        <AdminNavigationBar />
        <Routes>
            <Route path='/dashboard' element={<AdminDashboard />} />
            <Route path='/question-bank' element={<QuestionBankManager />} />
            <Route path='/withdrawals' element={<WithdrawalManagement />} />
        </Routes>
        </>
    );
}

export default AdminRoutes;

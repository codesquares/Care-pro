import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './admin-dashboard/AdminDashboard';
import QuestionBankManager from './question-bank/QuestionBankManager';
import AdminNavigationBar from './admin-dashboard/AdminNavigationBar';

function AdminRoutes() {
    return (
        <>
        <AdminNavigationBar />
        <Routes>
            <Route path='/dashboard' element={<AdminDashboard />} />
            <Route path='/question-bank' element={<QuestionBankManager />} />
        </Routes>
        </>
    );
}

export default AdminRoutes;

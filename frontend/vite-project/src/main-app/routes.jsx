import { Routes, Route } from 'react-router-dom';
import CareGiverRoutes from './pages/care-giver/care-giver-routes';
import ClientRoutes from './pages/client/client-route';
import AdminRoutes from './pages/admin/admin-routes';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';


function MainAppRoutes() {
    return (
        <Routes>
            <Route path='caregiver/*' element={
                <RoleBasedRoute allowedRoles={['Caregiver']}>
                    <CareGiverRoutes />
                </RoleBasedRoute>
            } />
            <Route path='client/*' element={
                <RoleBasedRoute allowedRoles={['Client']}>
                    <ClientRoutes />
                </RoleBasedRoute>
            } />
            <Route path='admin/*' element={
                <RoleBasedRoute allowedRoles={['Admin', 'SuperAdmin']}>
                    <AdminRoutes />
                </RoleBasedRoute>
            } />
            <Route path='unauthorized' element={<UnauthorizedPage />} />
        </Routes>
    );
}

export default MainAppRoutes;

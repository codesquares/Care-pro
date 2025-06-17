import { Routes, Route } from 'react-router-dom';
import CareGiverRoutes from './pages/care-giver/care-giver-routes';
import ClientRoutes from './pages/client/client-route';
import AdminRoutes from './pages/admin/admin-routes';


function MainAppRoutes() {
    return (
        <Routes>
            <Route path='caregiver/*' element= {<CareGiverRoutes/>} />
            <Route path='client/*' element= {<ClientRoutes/>} />
            <Route path='admin/*' element= {<AdminRoutes/>} />
        </Routes>
        
    );
}

export default MainAppRoutes;

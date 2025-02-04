import { Routes, Route } from 'react-router-dom';
import CareGiverRoutes from './pages/care-giver/care-giver-routes';
import ClientRoutes from './pages/client/client-route';


function MainAppRoutes() {
    return (
        <Routes>
            <Route path='caregiver/*' element= {<CareGiverRoutes/>} />
            <Route path='client/*' element= {<ClientRoutes/>} />
        </Routes>
        
    );
}

export default MainAppRoutes;

import { Routes, Route } from 'react-router-dom';
import CareGiverRoutes from './pages/care-giver/care-giver-routes';


function MainAppRoutes() {
    return (
        <Routes>
            <Route path='caregiver/*' element= {<CareGiverRoutes/>} />
        </Routes>
    );
}

export default MainAppRoutes;

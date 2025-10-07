
import { Link } from 'react-router-dom';
import './unauthorized.css';

const UnauthorizedPage = () => {
    // Get user info from localStorage
    const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    const userRole = userDetails?.role || 'Guest';

    return (
        <div className="unauthorized-page">
            <div className="unauthorized-container">
                <div className="icon-container">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h1>Access Denied</h1>
                <p>You don't have permission to access this page.</p>
                <p className="role-info">Current role: <span>{userRole}</span></p>
                <p className="help-text">This area requires administrator privileges.</p>
                
                <div className="action-buttons">
                    <Link to="/" className="btn primary-btn">Go to Home</Link>
                    {userRole === 'Client' && (
                        <Link to="/app/client/dashboard" className="btn secondary-btn">Go to Client Dashboard</Link>
                    )}
                    {userRole === 'Caregiver' && (
                        <Link to="/app/caregiver/dashboard" className="btn secondary-btn">Go to Caregiver Dashboard</Link>
                    )}
                </div>
                
                <div className="support-info">
                    <p>If you believe you should have access to this page, please contact support.</p>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;

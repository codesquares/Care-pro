
import { Link } from 'react-router-dom';
import './unauthorized.css';

const UnauthorizedPage = () => {
    return (
        <div className="unauthorized-page">
            <div className="unauthorized-content">
                <div className="text-section">
                    <h1 className="error-heading">401! Hold up!</h1>
                    <p className="error-message">Sorry, but you are not authorized to view this page.</p>
                    
                    <div className="action-buttons">
                        <Link to="/" className="btn primary-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Home
                        </Link>
                        <Link to="/contact" className="btn secondary-btn">Contact Us</Link>
                    </div>
                </div>
                
                <div className="illustration-section">
                    <div className="shield-icon">
                        <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 10L30 40V100C30 150 100 200 100 200C100 200 170 150 170 100V40L100 10Z" fill="#5DCED8" fillOpacity="0.9"/>
                            <circle cx="100" cy="110" r="25" fill="#2C3E50"/>
                            <rect x="95" y="135" width="10" height="30" rx="2" fill="#2C3E50"/>
                        </svg>
                    </div>
                    
                    <div className="guard-illustration">
                        <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Security Guard */}
                            <ellipse cx="150" cy="80" rx="30" ry="35" fill="#2C3E50"/>
                            <path d="M130 75 Q130 65 140 65 L160 65 Q170 65 170 75 L170 85 Q170 95 160 95 L140 95 Q130 95 130 85 Z" fill="#5DCED8"/>
                            <rect x="120" y="110" width="60" height="100" rx="10" fill="#5DCED8"/>
                            <rect x="100" y="150" width="30" height="80" rx="8" fill="#5DCED8"/>
                            <rect x="170" y="150" width="30" height="80" rx="8" fill="#5DCED8"/>
                            <rect x="120" y="210" width="25" height="90" rx="8" fill="#5DCED8"/>
                            <rect x="155" y="210" width="25" height="90" rx="8" fill="#5DCED8"/>
                            <circle cx="130" cy="300" r="12" fill="#2C3E50"/>
                            <circle cx="170" cy="300" r="12" fill="#2C3E50"/>
                            <rect x="140" y="180" width="20" height="8" fill="#F4C430"/>
                            
                            {/* Dog */}
                            <ellipse cx="240" cy="280" rx="25" ry="20" fill="#2C3E50"/>
                            <ellipse cx="250" cy="260" rx="18" ry="22" fill="#2C3E50"/>
                            <path d="M235 255 L230 245 L237 248 Z" fill="#2C3E50"/>
                            <path d="M265 255 L270 245 L263 248 Z" fill="#2C3E50"/>
                            <rect x="225" y="280" width="10" height="25" rx="5" fill="#2C3E50"/>
                            <rect x="245" y="280" width="10" height="25" rx="5" fill="#2C3E50"/>
                            <path d="M220 275 Q210 275 205 278 L200 280" stroke="#2C3E50" strokeWidth="8" strokeLinecap="round"/>
                            <rect x="242" y="265" width="18" height="6" rx="3" fill="#F4C430"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;


import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './admin-navigation-bar.css';

const AdminNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const userName = user?.firstName || 'Admin';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Early return if no user data - prevents errors during logout
  if (!user) {
    return null;
  }
  
  // Handle logout
  const handleAdminLogout = () => {
    handleLogout();
    navigate('/', { replace: true });
  };

  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav-container">
        <div className="admin-nav-logo">
          <Link to="/app/admin/dashboard" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="logo-content">
              <span className="logo-text">CarePro</span>
              <span className="logo-subtitle">Admin Portal</span>
            </div>
          </Link>
        </div>
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <div className={`admin-nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="admin-nav-links">
            <li>
              <Link 
                to="/app/admin/dashboard" 
                className={`nav-link ${isActive('/app/admin/dashboard') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-chart-line"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/caregivers" 
                className={`nav-link ${isActive('/app/admin/caregivers') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-user-nurse"></i>
                <span>Caregivers</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/clients" 
                className={`nav-link ${isActive('/app/admin/clients') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-user-friends"></i>
                <span>Clients</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/notifications" 
                className={`nav-link ${isActive('/app/admin/notifications') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-bell"></i>
                <span>Notifications</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/training-materials" 
                className={`nav-link ${isActive('/app/admin/training-materials') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-graduation-cap"></i>
                <span>Training</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/gigs" 
                className={`nav-link ${isActive('/app/admin/gigs') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-briefcase"></i>
                <span>Gigs</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/orders" 
                className={`nav-link ${isActive('/app/admin/orders') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-shopping-cart"></i>
                <span>Orders</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/emails" 
                className={`nav-link ${isActive('/app/admin/emails') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-envelope"></i>
                <span>Emails</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/certificates" 
                className={`nav-link ${isActive('/app/admin/certificates') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-certificate"></i>
                <span>Certificates</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/withdrawals" 
                className={`nav-link ${isActive('/app/admin/withdrawals') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-wallet"></i>
                <span>Withdrawals</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/question-bank" 
                className={`nav-link ${isActive('/app/admin/question-bank') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-clipboard-list"></i>
                <span>Question Bank</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/app/admin/dojah-admin" 
                className={`nav-link ${isActive('/app/admin/dojah-admin') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="fas fa-id-badge"></i>
                <span>Verifications</span>
              </Link>
            </li>
          </ul>
          
          <div className="admin-nav-user">
            <div className="user-avatar">
              <span>{userInitials}</span>
            </div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">Administrator</span>
            </div>
            <button className="logout-button" onClick={handleAdminLogout} title="Logout">
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigationBar;

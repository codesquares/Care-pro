import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './admin-navigation-bar.css';

const AdminNavigationBar = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  
  const userName = user?.firstName || 'Admin';

  // Early return if no user data - prevents errors during logout
  if (!user) {
    return null;
  }
  
  // Handle logout
  const handleAdminLogout = () => {
    const navInfo = handleLogout();
    if (navInfo.shouldNavigate) {
      navigate(navInfo.path, { replace: true });
    }
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav-container">
        <div className="admin-nav-logo">
          <Link to="/app/admin/dashboard">
            <span className="logo-text">Care Pro Admin</span>
          </Link>
        </div>
        
        <ul className="admin-nav-links">
          <li>
            <Link to="/app/admin/dashboard" className="nav-link">
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/app/admin/question-bank" className="nav-link">
              <i className="fas fa-question-circle"></i>
              <span>Question Bank</span>
            </Link>
          </li>
          <li>
            <Link to="/app/admin/withdrawals" className="nav-link">
              <i className="fas fa-money-bill-wave"></i>
              <span>Withdrawals</span>
            </Link>
          </li>
          <li>
            <Link to="/app/admin/users" className="nav-link">
              <i className="fas fa-users"></i>
              <span>Users</span>
            </Link>
          </li>
          <li>
            <Link to="/app/admin/reports" className="nav-link">
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </Link>
          </li>
          <li>
            <Link to="/app/admin/settings" className="nav-link">
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
        
        <div className="admin-nav-user">
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">Administrator</span>
          </div>
          <button className="logout-button" onClick={handleAdminLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigationBar;

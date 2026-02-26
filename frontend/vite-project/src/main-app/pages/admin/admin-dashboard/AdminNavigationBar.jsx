
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getInitials } from '../../../utils/avatarHelpers';
import './admin-navigation-bar.css';

const navItems = [
  { to: '/app/admin/dashboard',          icon: 'fa-chart-line',     label: 'Dashboard' },
  { to: '/app/admin/caregivers',         icon: 'fa-user-nurse',     label: 'Caregivers' },
  { to: '/app/admin/clients',            icon: 'fa-user-friends',   label: 'Clients' },
  { to: '/app/admin/notifications',      icon: 'fa-bell',           label: 'Notifications' },
  { to: '/app/admin/training-materials', icon: 'fa-graduation-cap', label: 'Training' },
  { to: '/app/admin/gigs',               icon: 'fa-briefcase',      label: 'Gigs' },
  { to: '/app/admin/orders',             icon: 'fa-shopping-cart',  label: 'Orders' },
  { to: '/app/admin/emails',             icon: 'fa-envelope',       label: 'Emails' },
  { to: '/app/admin/certificates',       icon: 'fa-certificate',    label: 'Certificates' },
  { to: '/app/admin/withdrawals',        icon: 'fa-wallet',         label: 'Withdrawals' },
  { to: '/app/admin/subscriptions',      icon: 'fa-sync-alt',       label: 'Subscriptions' },
  { to: '/app/admin/question-bank',      icon: 'fa-clipboard-list', label: 'Question Bank' },
  { to: '/app/admin/dojah-admin',        icon: 'fa-id-badge',       label: 'Verifications' },
];

const AdminNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Admin';
  const userInitials = getInitials(userName);

  if (!user) return null;

  const handleAdminLogout = () => {
    handleLogout();
    navigate('/', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="admin-header">
      {/* ── Top bar: logo · user info · logout · hamburger ── */}
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/app/admin/dashboard" className="admin-topbar-logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="logo-content">
              <span className="logo-text">CarePro</span>
              <span className="logo-subtitle">Admin Portal</span>
            </div>
          </Link>

          <div className="admin-topbar-right">
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

            <button
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab nav strip (desktop / tablet) ── */}
      <nav className="admin-tab-nav" aria-label="Admin navigation">
        <div className="admin-tab-nav-inner">
          <ul className="admin-tab-links">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`tab-link ${isActive(to) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <i className={`fas ${icon}`}></i>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobile drawer (hamburger controlled) ── */}
      <div className={`admin-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`} aria-hidden={!isMobileMenuOpen}>
        <ul className="mobile-nav-links">
          {navItems.map(({ to, icon, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className={`fas ${icon}`}></i>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default AdminNavigationBar;

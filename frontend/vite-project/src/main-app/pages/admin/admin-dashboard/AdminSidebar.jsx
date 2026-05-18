import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getInitials } from '../../../utils/avatarHelpers';
import './admin-sidebar.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/app/admin/dashboard', icon: 'fa-chart-line',     label: 'Dashboard' },
      { to: '/app/admin/analytics', icon: 'fa-chart-bar',      label: 'Analytics' },
    ],
  },
  {
    label: 'Users',
    items: [
      { to: '/app/admin/caregivers', icon: 'fa-user-nurse',    label: 'Caregivers' },
      { to: '/app/admin/clients',    icon: 'fa-user-friends',  label: 'Clients' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/app/admin/orders',     icon: 'fa-shopping-cart', label: 'Orders' },
      { to: '/app/admin/gigs',       icon: 'fa-briefcase',     label: 'Gigs' },
      { to: '/app/admin/withdrawals',         icon: 'fa-wallet',          label: 'Withdrawals' },
      { to: '/app/admin/refunds',             icon: 'fa-money-bill-wave', label: 'Refunds' },
      { to: '/app/admin/payment-resolution',  icon: 'fa-wrench',          label: 'Payment Resolution' },
      { to: '/app/admin/disputes',            icon: 'fa-gavel',           label: 'Disputes' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { to: '/app/admin/certificates',  icon: 'fa-certificate',   label: 'Certificates' },
      { to: '/app/admin/dojah-admin',   icon: 'fa-id-badge',      label: 'Verifications' },
      { to: '/app/admin/question-bank', icon: 'fa-clipboard-list',label: 'Question Bank' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { to: '/app/admin/notifications', icon: 'fa-bell',      label: 'Notifications' },
      { to: '/app/admin/emails',        icon: 'fa-envelope',  label: 'Emails' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/app/admin/training-materials', icon: 'fa-graduation-cap', label: 'Training' },
      { to: '/app/admin/subscriptions',      icon: 'fa-sync-alt',       label: 'Subscriptions' },
    ],
  },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Admin';
  const userInitials = getInitials(userName);

  const isActive = (path) => location.pathname === path;

  const handleAdminLogout = () => {
    handleLogout();
    navigate('/', { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}${isOpen ? ' admin-sidebar--mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link to="/app/admin/dashboard" onClick={handleNavClick} className="sidebar-logo-link">
            <div className="sidebar-logo-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            {!collapsed && (
              <div className="sidebar-logo-text">
                <span className="sidebar-brand">CarePro</span>
                <span className="sidebar-brand-sub">Admin Portal</span>
              </div>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="sidebar-group">
              {!collapsed && (
                <span className="sidebar-group-label">{group.label}</span>
              )}
              <ul className="sidebar-group-items">
                {group.items.map(({ to, icon, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={handleNavClick}
                      className={`sidebar-nav-item${isActive(to) ? ' sidebar-nav-item--active' : ''}`}
                      title={collapsed ? label : undefined}
                    >
                      <i className={`fas ${icon} sidebar-nav-icon`}></i>
                      {!collapsed && <span className="sidebar-nav-label">{label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userInitials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{userName}</span>
                <span className="sidebar-user-role">Administrator</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleAdminLogout}
            title="Logout"
            aria-label="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

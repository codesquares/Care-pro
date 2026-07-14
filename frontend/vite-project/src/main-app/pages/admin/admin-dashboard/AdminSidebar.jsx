import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getInitials } from '../../../utils/avatarHelpers';
import { hasPolicy } from '../../../utils/adminPermissions';
import './admin-sidebar.css';

// policy values match adminPermissions.js hasPolicy() keys
// undefined / null = visible to all authenticated admins
const ALL_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/app/admin/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { to: '/app/admin/analytics', icon: 'fa-chart-bar',  label: 'Analytics', policy: 'analytics' },
    ],
  },
  {
    label: 'Users',
    items: [
      { to: '/app/admin/caregivers',  icon: 'fa-user-nurse',   label: 'Caregivers',  policy: 'operations' },
      { to: '/app/admin/clients',     icon: 'fa-user-friends', label: 'Clients',     policy: 'operations' },
      { to: '/app/admin/admin-users', icon: 'fa-user-shield',  label: 'Admin Users', policy: 'superAdmin' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/app/admin/orders',              icon: 'fa-shopping-cart',  label: 'Orders',              policy: 'finance' },
      { to: '/app/admin/gigs',                icon: 'fa-briefcase',      label: 'Gigs',                policy: 'operations' },
      { to: '/app/admin/withdrawals',         icon: 'fa-wallet',         label: 'Withdrawals',         policy: 'finance' },
      { to: '/app/admin/refunds',             icon: 'fa-money-bill-wave',label: 'Refunds',             policy: 'financeOrOperations' },
        { to: '/app/admin/referrals',           icon: 'fa-user-plus',      label: 'Referrals',           policy: 'finance' },
      { to: '/app/admin/payment-resolution',  icon: 'fa-wrench',         label: 'Payment Resolution',  policy: 'financeOrOperations' },
      { to: '/app/admin/disputes',            icon: 'fa-gavel',          label: 'Disputes',            policy: 'operations' },
      { to: '/app/admin/booking-commitments', icon: 'fa-handshake',      label: 'Booking Commitments', policy: 'financeOrOperations' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { to: '/app/admin/certificates',  icon: 'fa-certificate',    label: 'Certificates',  policy: 'operations' },
      { to: '/app/admin/dojah-admin',   icon: 'fa-id-badge',       label: 'Verifications', policy: 'operations' },
      { to: '/app/admin/question-bank', icon: 'fa-clipboard-list', label: 'Question Bank', policy: 'operations' },
      { to: '/app/admin/chat-compliance',icon: 'fa-shield-virus',  label: 'Chat Compliance',policy: 'operations' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { to: '/app/admin/notifications', icon: 'fa-bell',     label: 'Notifications', policy: 'superAdmin' },
      { to: '/app/admin/emails',        icon: 'fa-envelope', label: 'Emails',        policy: 'superAdmin' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/app/admin/training-materials', icon: 'fa-graduation-cap', label: 'Training',      policy: 'operations' },
      { to: '/app/admin/subscriptions',      icon: 'fa-sync-alt',       label: 'Subscriptions', policy: 'superAdmin' },
    ],
  },
  {
    label: 'Data Tools',
    items: [
      { to: '/app/admin/data-tools/middle-name-fix', icon: 'fa-broom', label: 'Fix Middle Names', policy: 'operations' },
      { to: '/app/admin/data-tools/default-address-cleanup', icon: 'fa-map-marked-alt', label: 'Default Address Cleanup', policy: 'superAdmin' },
    ],
  },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role       = user?.role       || '';
  const department = user?.department  || user?.Department || '';

  // Filter nav groups/items to only those the current user can access
  const NAV_GROUPS = useMemo(() => {
    return ALL_NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item => hasPolicy(item.policy, role, department)),
      }))
      .filter(group => group.items.length > 0);
  }, [role, department]);

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
                <span className="sidebar-user-role">
                  {role === 'SuperAdmin' ? 'Super Admin' : department || 'Administrator'}
                </span>
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

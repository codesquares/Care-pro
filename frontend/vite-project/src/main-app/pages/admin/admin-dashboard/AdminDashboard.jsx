import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './admin-dashboard.css';
import adminService from '../../../services/adminService';
import { hasPolicy, isSuperAdmin, deptLabel } from '../../../utils/adminPermissions';

const AdminDashboard = () => {
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const role        = userDetails.role       || '';
  const department  = userDetails.department || userDetails.Department || '';
  const firstName   = userDetails.firstName  || userDetails.FirstName  || '';
  const isSuper     = isSuperAdmin(role);

  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(isSuper); // only load for SuperAdmin
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!isSuper) return; // stats endpoint is SuperAdmin-only

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await adminService.getDashboardStats();
        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('An unexpected error occurred while loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSuper]);

  // Quick action cards — each has a policy gate; undefined = all admins
  const ALL_QUICK_ACTIONS = [
    { to: '/app/admin/notifications',    icon: 'fa-bell',           title: 'Send Notifications',     desc: 'Broadcast messages to caregivers and clients',  policy: 'superAdmin' },
    { to: '/app/admin/emails',           icon: 'fa-envelope',       title: 'Send Emails',            desc: 'Send custom or bulk emails to users',           policy: 'superAdmin' },
    { to: '/app/admin/certificates',     icon: 'fa-certificate',    title: 'Review Certificates',    desc: 'Approve or reject caregiver certificates',       policy: 'operations' },
    { to: '/app/admin/dojah-admin',      icon: 'fa-id-badge',       title: 'Verifications',          desc: 'Review identity verification requests',          policy: 'operations' },
    { to: '/app/admin/training-materials',icon: 'fa-graduation-cap',title: 'Training Materials',     desc: 'Manage training resources for caregivers',       policy: 'operations' },
    { to: '/app/admin/withdrawals',      icon: 'fa-wallet',         title: 'Withdrawals',            desc: 'Process caregiver withdrawal requests',          policy: 'finance' },
    { to: '/app/admin/orders',           icon: 'fa-shopping-cart',  title: 'Manage Orders',          desc: 'View and track all orders and transactions',     policy: 'finance' },
    { to: '/app/admin/gigs',             icon: 'fa-briefcase',      title: 'Manage Gigs',            desc: 'View and monitor all gigs in the system',        policy: 'operations' },
    { to: '/app/admin/disputes',         icon: 'fa-gavel',          title: 'Disputes',               desc: 'Resolve open disputes',                          policy: 'operations' },
    { to: '/app/admin/refunds',          icon: 'fa-money-bill-wave',title: 'Refunds',                desc: 'Process refund requests',                        policy: 'financeOrOperations' },
    { to: '/app/admin/analytics',        icon: 'fa-chart-bar',      title: 'Analytics',              desc: 'View platform performance analytics',            policy: 'analytics' },
    { to: '/app/admin/caregivers',       icon: 'fa-user-nurse',     title: 'Manage Caregivers',      desc: 'View caregiver profiles and performance',        policy: 'operations' },
    { to: '/app/admin/clients',          icon: 'fa-user-friends',   title: 'Manage Clients',         desc: 'View and manage client accounts',                policy: 'operations' },
    { to: '/app/admin/question-bank',    icon: 'fa-clipboard-list', title: 'Question Bank',          desc: 'Manage assessment questions for caregivers',     policy: 'operations' },
    { to: '/app/admin/chat-compliance',  icon: 'fa-shield-virus',   title: 'Chat Compliance',        desc: 'Monitor and review chat policy violations',      policy: 'operations' },
    { to: '/app/admin/subscriptions',    icon: 'fa-sync-alt',       title: 'Subscriptions',          desc: 'Manage subscription plans and status',           policy: 'superAdmin' },
    { to: '/app/admin/admin-users',      icon: 'fa-user-shield',    title: 'Admin Users',            desc: 'Create and manage admin accounts',               policy: 'superAdmin' },
    { to: '/app/admin/data-tools/middle-name-fix', icon: 'fa-broom', title: 'Fix Middle Names',      desc: 'Clear "testing" placeholder middle names',       policy: 'operations' },
    { to: '/app/admin/data-tools/default-address-cleanup', icon: 'fa-map-marked-alt', title: 'Default Address Cleanup', desc: 'Preview and clean legacy placeholder addresses', policy: 'superAdmin' },
  ];

  const visibleActions = ALL_QUICK_ACTIONS.filter(a => hasPolicy(a.policy, role, department));

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>
          {firstName ? `Welcome back, ${firstName}` : 'Admin Dashboard'}
        </h1>
        <p>
          {isSuper
            ? 'Full access — Care Pro administration panel'
            : `${deptLabel(department)} — Care Pro administration panel`}
        </p>
      </header>

      {/* SuperAdmin: platform-wide stats */}
      {isSuper && (
        <>
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading dashboard data...</p>
            </div>
          ) : stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-users"></i></div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">{(stats.totalCaregivers || 0) + (stats.totalClients || 0)}</p>
                  <div className="stat-breakdown">
                    <span>Caregivers: {stats.totalCaregivers || 0}</span>
                    <span>Clients: {stats.totalClients || 0}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-shopping-cart"></i></div>
                <div className="stat-content">
                  <h3>Orders</h3>
                  <p className="stat-number">{stats.totalOrders || 0}</p>
                  <div className="stat-breakdown"><span>Total Orders</span></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-briefcase"></i></div>
                <div className="stat-content">
                  <h3>Gigs</h3>
                  <p className="stat-number">{stats.totalGigs || 0}</p>
                  <div className="stat-breakdown"><span>Total Gigs</span></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-certificate"></i></div>
                <div className="stat-content">
                  <h3>Pending Certificates</h3>
                  <p className="stat-number">{stats.pendingCertificates || 0}</p>
                  <div className="stat-breakdown"><span>Awaiting Review</span></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-credit-card"></i></div>
                <div className="stat-content">
                  <h3>Subscriptions</h3>
                  <p className="stat-number">{stats.activeSubscriptions || 0}</p>
                  <div className="stat-breakdown"><span>Active</span></div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
                <div className="stat-content">
                  <h3>Pending Withdrawals</h3>
                  <p className="stat-number">{stats.pendingWithdrawals || 0}</p>
                  <div className="stat-breakdown">
                    <span>Admins: {stats.totalAdmins || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick actions — filtered by the current admin's department */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        {visibleActions.length === 0 ? (
          <p style={{ color: '#666', padding: '1rem' }}>
            No actions available for your current role. Contact a SuperAdmin if you believe this is incorrect.
          </p>
        ) : (
          <div className="actions-grid">
            {visibleActions.map(({ to, icon, title, desc }) => (
              <Link key={to} to={to} className="action-card">
                <div className="action-icon">
                  <i className={`fas ${icon}`}></i>
                </div>
                <div className="action-content">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

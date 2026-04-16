import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './admin-dashboard.css';
import adminService from '../../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCaregivers: 0,
    totalClients: 0,
    totalOrders: 0,
    totalGigs: 0,
    pendingCertificates: 0,
    activeSubscriptions: 0,
    pendingWithdrawals: 0,
    totalAdmins: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await adminService.getDashboardStats();
        
        if (result.success) {
          setStats(prevStats => ({
            ...prevStats,
            ...result.data
          }));
        } else {
          setError(result.error || 'Failed to fetch dashboard data');
          console.error('Error fetching dashboard stats:', result.error);
        }
        
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('An unexpected error occurred while loading dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the Care Pro administration panel</p>
      </header>
      
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
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.totalCaregivers + stats.totalClients}</p>
                <div className="stat-breakdown">
                  <span>Caregivers: {stats.totalCaregivers}</span>
                  <span>Clients: {stats.totalClients}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="stat-content">
                <h3>Orders</h3>
                <p className="stat-number">{stats.totalOrders}</p>
                <div className="stat-breakdown">
                  <span>Total Orders</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="stat-content">
                <h3>Gigs</h3>
                <p className="stat-number">{stats.totalGigs}</p>
                <div className="stat-breakdown">
                  <span>Total Gigs</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-certificate"></i>
              </div>
              <div className="stat-content">
                <h3>Pending Certificates</h3>
                <p className="stat-number">{stats.pendingCertificates}</p>
                <div className="stat-breakdown">
                  <span>Awaiting Review</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-credit-card"></i>
              </div>
              <div className="stat-content">
                <h3>Subscriptions</h3>
                <p className="stat-number">{stats.activeSubscriptions}</p>
                <div className="stat-breakdown">
                  <span>Active Subscriptions</span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <h3>Pending Withdrawals</h3>
                <p className="stat-number">{stats.pendingWithdrawals}</p>
                <div className="stat-breakdown">
                  <span>Admins: {stats.totalAdmins}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/app/admin/notifications" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-bell"></i>
                </div>
                <div className="action-content">
                  <h3>Send Notifications</h3>
                  <p>Broadcast messages to caregivers and clients</p>
                </div>
              </Link>
              
              <Link to="/app/admin/emails" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="action-content">
                  <h3>Send Emails</h3>
                  <p>Send custom emails to users or bulk emails</p>
                </div>
              </Link>
              
              <Link to="/app/admin/certificates" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-certificate"></i>
                </div>
                <div className="action-content">
                  <h3>Review Certificates</h3>
                  <p>Review and approve caregiver certificates</p>
                </div>
              </Link>
              
              <Link to="/app/admin/training-materials" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="action-content">
                  <h3>Upload Training Materials</h3>
                  <p>Add training resources for caregivers and cleaners</p>
                </div>
              </Link>
              
              <Link to="/app/admin/gigs" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Gigs</h3>
                  <p>View and monitor all gigs in the system</p>
                </div>
              </Link>
              
              <Link to="/app/admin/orders" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Orders</h3>
                  <p>View and track all orders and transactions</p>
                </div>
              </Link>
              
              <Link to="/app/admin/users" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-user-edit"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Users</h3>
                  <p>View and manage user accounts</p>
                </div>
              </Link>
              
              <Link to="/app/admin/caregivers" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-user-nurse"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Caregivers</h3>
                  <p>View caregiver profiles and performance</p>
                </div>
              </Link>
              
              <Link to="/app/admin/clients" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-user-friends"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Clients</h3>
                  <p>View and manage client accounts</p>
                </div>
              </Link>
              
              <Link to="/app/admin/question-bank" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-question-circle"></i>
                </div>
                <div className="action-content">
                  <h3>Question Bank</h3>
                  <p>Manage assessment questions</p>
                </div>
              </Link>
              
              <Link to="/app/admin/reports" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="action-content">
                  <h3>View Reports</h3>
                  <p>Access analytics and performance reports</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

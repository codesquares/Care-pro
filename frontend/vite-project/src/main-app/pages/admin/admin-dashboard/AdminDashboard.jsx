import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './admin-dashboard.css';
import adminService from '../../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      caregivers: 0,
      clients: 0,
      activeCaregivers: 0,
      availableCaregivers: 0,
      activeClients: 0
    },
    caregivers: {
      total: 0,
      active: 0,
      inactive: 0,
      available: 0,
      totalEarnings: 0,
      totalOrders: 0,
      totalHours: 0
    },
    clients: {
      total: 0,
      active: 0,
      inactive: 0
    },
    assessments: {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0
    },
    questions: {
      total: 0,
      caregiver: 0,
      cleaner: 0
    },
    withdrawals: {
      total: 0,
      pending: 0,
      verified: 0,
      completed: 0,
      rejected: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch real dashboard statistics using admin service
        const result = await adminService.getDashboardStats();
        
        if (result.success) {
          setStats(prevStats => ({
            ...prevStats,
            users: result.data.users,
            caregivers: result.data.caregivers,
            clients: result.data.clients
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
                <p className="stat-number">{stats.users.total}</p>
                <div className="stat-breakdown">
                  <span>Caregivers: {stats.users.caregivers}</span>
                  <span>Clients: {stats.users.clients}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-nurse"></i>
              </div>
              <div className="stat-content">
                <h3>Caregivers</h3>
                <p className="stat-number">{stats.caregivers.total}</p>
                <div className="stat-breakdown">
                  <span>Active: {stats.caregivers.active}</span>
                  <span>Available: {stats.caregivers.available}</span>
                  <span>Total Earnings: ${stats.caregivers.totalEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-friends"></i>
              </div>
              <div className="stat-content">
                <h3>Clients</h3>
                <p className="stat-number">{stats.clients.total}</p>
                <div className="stat-breakdown">
                  <span>Active: {stats.clients.active}</span>
                  <span>Inactive: {stats.clients.inactive}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="stat-content">
                <h3>Orders & Hours</h3>
                <p className="stat-number">{stats.caregivers.totalOrders}</p>
                <div className="stat-breakdown">
                  <span>Total Orders: {stats.caregivers.totalOrders}</span>
                  <span>Total Hours: {stats.caregivers.totalHours}</span>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './admin-dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      caregivers: 0,
      clients: 0,
      cleaners: 0
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
  
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      // Mock data for development
      setStats({
        users: {
          total: 245,
          caregivers: 148,
          clients: 92,
          cleaners: 5
        },
        assessments: {
          total: 127,
          passed: 89,
          failed: 32,
          pending: 6
        },
        questions: {
          total: 200,
          caregiver: 150,
          cleaner: 50
        },
        withdrawals: {
          total: 43,
          pending: 12,
          verified: 8,
          completed: 20,
          rejected: 3
        }
      });
      setLoading(false);
    }, 1000);
  }, []);
  
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the Care Pro administration panel</p>
      </header>
      
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
                  <span>Cleaners: {stats.users.cleaners}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="stat-content">
                <h3>Assessments</h3>
                <p className="stat-number">{stats.assessments.total}</p>
                <div className="stat-breakdown">
                  <span>Passed: {stats.assessments.passed}</span>
                  <span>Failed: {stats.assessments.failed}</span>
                  <span>Pending: {stats.assessments.pending}</span>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <h3>Withdrawals</h3>
                <p className="stat-number">{stats.withdrawals.total}</p>
                <div className="stat-breakdown">
                  <span>Pending: {stats.withdrawals.pending}</span>
                  <span>Verified: {stats.withdrawals.verified}</span>
                  <span>Completed: {stats.withdrawals.completed}</span>
                </div>
                <a href="/app/admin/withdrawals" className="view-all-link">
                  Manage Withdrawals &rarr;
                </a>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-question-circle"></i>
              </div>
              <div className="stat-content">
                <h3>Question Bank</h3>
                <p className="stat-number">{stats.questions.total}</p>
                <div className="stat-breakdown">
                  <span>Caregiver: {stats.questions.caregiver}</span>
                  <span>Cleaner: {stats.questions.cleaner}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/app/admin/question-bank" className="action-card">
                <div className="action-icon">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div className="action-content">
                  <h3>Manage Question Bank</h3>
                  <p>Add, edit or remove assessment questions</p>
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
          
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <i className="fas fa-clipboard-check"></i>
                </div>
                <div className="activity-content">
                  <p><strong>New Assessment Completed</strong> by John Smith</p>
                  <span className="activity-time">5 minutes ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="activity-content">
                  <p><strong>New Caregiver Registered</strong> - Sarah Johnson</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">
                  <i className="fas fa-question-circle"></i>
                </div>
                <div className="activity-content">
                  <p><strong>10 New Questions Added</strong> to the question bank</p>
                  <span className="activity-time">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

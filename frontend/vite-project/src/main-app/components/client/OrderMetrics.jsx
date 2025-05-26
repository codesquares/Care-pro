import React, { useState, useEffect } from 'react';
import ClientOrderService from '../../services/clientOrderService';
import './OrderMetrics.css';

/**
 * Order Metrics Component
 * 
 * Displays spending metrics based on client orders
 * Shows total spending, monthly averages, and spending by category
 */
const OrderMetrics = ({ clientId }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderMetrics = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        const orders = await ClientOrderService.getOrderHistory(clientId);
        const calculatedMetrics = ClientOrderService.calculateSpendingMetrics(orders);
        setMetrics(calculatedMetrics);
        setError(null);
      } catch (err) {
        console.error("Error fetching order metrics:", err);
        setError("Failed to load spending metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderMetrics();
  }, [clientId]);

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="order-metrics-container loading">
        <div className="loader-container">
          <div className="metrics-loader"></div>
          <p>Loading spending metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-metrics-container error">
        <div className="metrics-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="order-metrics-container empty">
        <div className="metrics-empty">
          <i className="fas fa-info-circle"></i>
          <p>No spending data available</p>
        </div>
      </div>
    );
  }

  // Calculate month over month change percentage
  const monthlyChangePercent = metrics.lastMonth > 0 
    ? ((metrics.thisMonth - metrics.lastMonth) / metrics.lastMonth) * 100 
    : 0;

  // Determine if spending increased or decreased
  const spendingTrend = monthlyChangePercent > 0 
    ? 'increase' 
    : monthlyChangePercent < 0 ? 'decrease' : 'same';

  // Get top categories by spending
  const topCategories = Object.entries(metrics.categories)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .slice(0, 3);

  return (
    <div className="order-metrics-container">
      <h2 className="metrics-title">Spending Metrics</h2>
      
      <div className="metrics-summary">
        <div className="metric-card total">
          <div className="metric-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="metric-detail">
            <h3>Total Spending</h3>
            <p className="metric-value">{formatCurrency(metrics.total)}</p>
          </div>
        </div>
        
        <div className="metric-card monthly">
          <div className="metric-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="metric-detail">
            <h3>This Month</h3>
            <p className="metric-value">{formatCurrency(metrics.thisMonth)}</p>
            <p className={`trend ${spendingTrend}`}>
              <i className={`fas ${spendingTrend === 'increase' ? 'fa-arrow-up' : spendingTrend === 'decrease' ? 'fa-arrow-down' : 'fa-equals'}`}></i>
              {Math.abs(monthlyChangePercent).toFixed(1)}% from last month
            </p>
          </div>
        </div>
        
        <div className="metric-card average">
          <div className="metric-icon">
            <i className="fas fa-calculator"></i>
          </div>
          <div className="metric-detail">
            <h3>Monthly Average</h3>
            <p className="metric-value">{formatCurrency(metrics.average)}</p>
          </div>
        </div>
      </div>
      
      <div className="categories-section">
        <h3 className="section-title">Top Spending Categories</h3>
        {topCategories.length > 0 ? (
          <div className="category-bars">
            {topCategories.map(([category, amount], index) => (
              <div key={category} className="category-item">
                <div className="category-header">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">{formatCurrency(amount)}</span>
                </div>
                <div className="category-progress-container">
                  <div 
                    className="category-progress" 
                    style={{ 
                      width: `${(amount / metrics.total) * 100}%`,
                      backgroundColor: `var(--category-color-${index % 5 + 1})`
                    }}
                  ></div>
                </div>
                <span className="category-percent">{((amount / metrics.total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-categories">No category data available</p>
        )}
      </div>
    </div>
  );
};

export default OrderMetrics;

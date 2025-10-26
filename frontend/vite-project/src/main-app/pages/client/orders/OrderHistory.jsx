import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderHistory.css';
import ClientOrderService from '../../../services/clientOrderService';

/**
 * OrderHistory component displays the client's order history and total spending
 * It shows a summary of expenses and a detailed list of orders
 */
const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [spendingMetrics, setSpendingMetrics] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    average: 0,
    categories: {}
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        if (!userDetails.id) {
          throw new Error("No client ID found in local storage.");
        }
        const clientId = userDetails.id;

        // Use our service to fetch orders
        const ordersData = await ClientOrderService.getOrderHistory(clientId);
        setOrders(ordersData);
        
        // Calculate spending metrics
        const metrics = ClientOrderService.calculateSpendingMetrics(ordersData);
        setSpendingMetrics(metrics);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch order history:', err);
        setError('Failed to load order history. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle view order details
  const handleViewOrder = (orderId) => {
    navigate(`/app/client/my-order/${orderId}`);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'in progress':
        return 'status-progress';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };
  
  // Render star rating
  const renderRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={`fas fa-star ${i <= rating ? 'filled' : ''}`}
        ></i>
      );
    }
    return <div className="order-rating">{stars}</div>;
  };

  return (
    <div className="order-history-container">
      <h1 className="page-title">Order History</h1>
      
      {isLoading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Spending Summary */}
          <div className="spending-summary">
            <h2 className="section-title">Spending Summary</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Spending</h3>
                <p className="summary-amount">{formatCurrency(spendingMetrics.total)}</p>
              </div>
              
              <div className="summary-card">
                <h3>This Month</h3>
                <p className="summary-amount">{formatCurrency(spendingMetrics.thisMonth)}</p>
              </div>
              
              <div className="summary-card">
                <h3>Last Month</h3>
                <p className="summary-amount">{formatCurrency(spendingMetrics.lastMonth)}</p>
              </div>
              
              <div className="summary-card">
                <h3>Monthly Average</h3>
                <p className="summary-amount">{formatCurrency(spendingMetrics.average)}</p>
              </div>
            </div>
            
            {/* Category Breakdown */}
            {Object.keys(spendingMetrics.categories).length > 0 && (
              <div className="category-breakdown">
                <h3 className="subsection-title">Category Breakdown</h3>
                <div className="category-bars">
                  {Object.entries(spendingMetrics.categories).map(([category, amount]) => (
                    <div className="category-item" key={category}>
                      <div className="category-label">
                        <span>{category}</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                      <div className="category-bar-container">
                        <div 
                          className="category-bar"
                          style={{ width: `${(amount / spendingMetrics.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Orders List */}
          <div className="orders-list-section">
            <h2 className="section-title">Your Orders</h2>
            
            {orders.length === 0 ? (
              <div className="no-orders">
                <i className="fas fa-shopping-bag"></i>
                <p>You haven't placed any orders yet.</p>
                <button 
                  className="browse-button"
                  onClick={() => navigate('/app/client/dashboard')}
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Service</th>
                      <th>Provider</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.orderNumber}</td>
                        <td>{formatDate(order.orderDate)}</td>
                        <td>{order.serviceType}</td>
                        <td>{order.providerName}</td>
                        <td className="amount-cell">{formatCurrency(order.amount)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{renderRating(order.rating)}</td>
                        <td>
                          <button 
                            className="view-details-button"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderHistory;

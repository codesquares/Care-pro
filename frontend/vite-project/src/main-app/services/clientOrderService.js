/**
 * Client Order Service
 * Handles order-related operations for clients
 */
const ClientOrderService = {
  /**
   * Get order history for a client
   * @param {string} clientId - The client's ID
   * @returns {Promise<Array>} - Array of order objects
   */
  async getOrderHistory(clientId) {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/Orders/client/${clientId}`;
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Error fetching order history: ${response.status}`);
      }
      
      const data = await response.json();
      return data || [];
      
    } catch (error) {
      console.error("Error in getOrderHistory:", error);
      // Return mock data as fallback
      return this.getMockOrders();
    }
  },
  
  /**
   * Calculate spending metrics from orders
   * @param {Array} orders - Array of order objects
   * @returns {Object} - Object containing spending metrics
   */
  calculateSpendingMetrics(orders) {
    if (!orders || orders.length === 0) {
      return {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        average: 0,
        categories: {}
      };
    }
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const metrics = {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      categories: {}
    };
    
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const amount = parseFloat(order.amount) || 0;
      
      // Total spending
      metrics.total += amount;
      
      // This month spending
      if (orderDate >= thisMonthStart && orderDate <= now) {
        metrics.thisMonth += amount;
      }
      
      // Last month spending
      if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
        metrics.lastMonth += amount;
      }
      
      // Categories spending
      if (order.serviceType) {
        if (!metrics.categories[order.serviceType]) {
          metrics.categories[order.serviceType] = 0;
        }
        metrics.categories[order.serviceType] += amount;
      }
    });
    
    // Calculate average monthly spending
    const firstOrderDate = new Date(orders[orders.length - 1]?.orderDate || now);
    const months = (now.getMonth() - firstOrderDate.getMonth()) + 
                  12 * (now.getFullYear() - firstOrderDate.getFullYear()) || 1;
    
    metrics.average = metrics.total / Math.max(1, months);
    
    return metrics;
  },
  
  /**
   * Get mock orders for testing
   * @returns {Array} - Array of mock order objects
   */
  getMockOrders() {
    return [
      {
        id: "ord-001",
        orderNumber: "ORD-2025-001",
        orderDate: "2025-05-01T10:00:00",
        serviceType: "Home Care",
        providerName: "Maria Johnson",
        amount: 120.00,
        status: "Completed",
        rating: 5
      },
      {
        id: "ord-002",
        orderNumber: "ORD-2025-002",
        orderDate: "2025-04-22T14:30:00",
        serviceType: "Elder Care",
        providerName: "John Smith",
        amount: 180.00,
        status: "Completed",
        rating: 4
      },
      {
        id: "ord-003",
        orderNumber: "ORD-2025-003",
        orderDate: "2025-04-15T09:00:00",
        serviceType: "Home Care",
        providerName: "Maria Johnson",
        amount: 120.00,
        status: "Completed",
        rating: 5
      },
      {
        id: "ord-004",
        orderNumber: "ORD-2025-004",
        orderDate: "2025-03-28T16:00:00",
        serviceType: "Child Care",
        providerName: "Lisa Anderson",
        amount: 90.00,
        status: "Completed",
        rating: 4
      },
      {
        id: "ord-005",
        orderNumber: "ORD-2025-005",
        orderDate: "2025-03-15T11:00:00",
        serviceType: "Post-Surgery Care",
        providerName: "Robert Williams",
        amount: 220.00,
        status: "Completed",
        rating: 5
      }
    ];
  }
};

export default ClientOrderService;

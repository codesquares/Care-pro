import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Orders.scss";

const statusColors = {
  "In Progress": "yellow",
  Completed: "cyan",
  Cancelled: "red",
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleOrderClick = (orderId) => {
    navigate(`/app/client/my-order/${orderId}`); // Navigate to details page
  };

  // Retrieve user details from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const clientUserId = userDetails?.id; // Ensure this matches your API user ID

  useEffect(() => {
    if (!clientUserId) {
      setError("User ID not found.");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders/clientUserId?clientUserId=${clientUserId}`
        );
        setOrders(response.data); // Ensure the API returns the expected format
      } catch (err) {
        setError("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [clientUserId]);

  const filteredOrders =
    filter === "All orders"
      ? orders
      : orders.filter((order) => order.clientOrderStatus  === filter);

  return (
    <div className="client-orders-page">
      <div className="client-orders-container">
        <h2 className="page-title">My Orders</h2>

        <div className="tabs">
          {["All orders", "In Progress", "Completed", "Cancelled"].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab} {filter === tab && <span className="underline"></span>}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order, index) => (
              <div key={index} className="client-order-card"
              onClick={() => handleOrderClick(order.id)}
              style={{ cursor: "pointer" }}
              >
                <img src={order.gigImage || "default-image.png"} alt="Order-info" className="client-order-image" />
                <div className="client-order-details">
                  <h3>{order.gigTitle}</h3>
                  <p>{order.caregiverName || "Unknown Client"}</p>
                  <div className="client-order-meta">
                    <span className={`status ${statusColors[order.status] || ""}`}>
                      {order.clientOrderStatus}
                    </span>
                    <span className="rating">⭐⭐⭐⭐⭐ {order.rating || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;

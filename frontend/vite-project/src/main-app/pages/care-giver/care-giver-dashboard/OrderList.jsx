import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import "./OrderList.css";



const OrderList = ({ filter }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    // Retrieve user details from localStorage
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    const caregiverId = userDetails?.id;

    const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders/caregiverId?caregiverId=${caregiverId}`;
  

  

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data); // Ensure API response matches expected structure
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

  // Filter orders based on the selected filter option
  const filteredOrders = orders.filter((order) =>
    filter === "All Orders" || order.clientOrderStatus === filter
  );

  return (
    <div className="order-list">
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order, index) => (
          <OrderCard
            key={index}
            title={order.gigTitle} // Ensure API response contains "title"
            user={order.clientName} // Ensure API response contains "user"
            price={order.amount} // Ensure API response contains "price"
            status={order.clientOrderStatus} // Ensure API response contains "status"
            image={order.gigImage || "https://via.placeholder.com/150"} // Fallback image
          />
        ))
      ) : (
        <p>No orders available</p>
      )}
    </div>
  );
};

export default OrderList;

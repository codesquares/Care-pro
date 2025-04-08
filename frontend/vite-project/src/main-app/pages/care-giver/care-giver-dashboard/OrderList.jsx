import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import "./OrderList.css";

const caregiverId = "67729731c002ee2ec46d82bd"; // Replace with dynamic ID if needed
const API_URL = `https://carepro-api20241118153443.azurewebsites.net/api/ClientOrders/caregiverId?caregiverId=${caregiverId}`;

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="order-list">
      {orders.length > 0 ? (
        orders.map((order, index) => (
          <OrderCard
            key={index}
            title={order.title}  // Ensure API response contains "title"
            user={order.user}    // Ensure API response contains "user"
            price={order.price}  // Ensure API response contains "price"
            status={order.status} // Ensure API response contains "status"
            image={order.image || "https://via.placeholder.com/150"} // Fallback image
          />
        ))
      ) : (
        <p>No orders available</p>
      )}
    </div>
  );
};

export default OrderList;

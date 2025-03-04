import React, { useState } from "react";
import Navbar from '../../../components/Navbar';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);

  return (
    <div>
      <Navbar />
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders available</p>
      ) : (
        <ul>
          {orders.map((order, index) => (
            <li key={index}>{order}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyOrders;
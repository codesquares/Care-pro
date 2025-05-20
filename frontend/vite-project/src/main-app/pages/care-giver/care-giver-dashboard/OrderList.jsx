import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import "./OrderList.css";

const OrderList = ({ filter, orders, loading, error }) => {



  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

  // Filter orders based on the selected filter option
  const filteredOrders = orders.filter((order) =>
    !filter || filter === "All Orders" || order.clientOrderStatus === filter
  );

  return (
    <div className="order-list">
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order, index) => (
          <OrderCard
            key={index}
            title={order.gigTitle}
            user={order.clientName}
            price={order.amount}
            status={order.clientOrderStatus}
            image={order.gigImage || "https://via.placeholder.com/150"}
          />
        ))
      ) : (
        <p>No orders available</p>
      )}
    </div>
  );
};

export default OrderList;

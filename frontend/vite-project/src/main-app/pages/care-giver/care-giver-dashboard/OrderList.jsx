import React from "react";
import OrderCard from "./OrderCard";
import EmptyState from "../../../../components/EmptyState";
import emptyOrdersImage from "../../../../assets/main-app/emptyOrder.png"; // Ensure you have an empty orders image in your assets
import "./OrderList.css";

const OrderList = ({ filter, orders, loading, error }) => {
  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

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
        <EmptyState
          logo={<img src={emptyOrdersImage} alt="No Orders" style={{ width: 100 }} />}
          title="You have no orders available"
          description="You would be updated immediately you have an order"
        />
      )}
    </div>
  );
};

export default OrderList;

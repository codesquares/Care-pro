import React from "react";
 import OrderCard from "./OrderCard";
import "./OrderList.css";

const orders = [
  {
    title: "I will clean your house and do laundry for ₦3,000 per hour",
    user: "Sarah Adebayo",
    price: "₦14,000",
    status: "In Progress",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Training and taking care of your pets",
    user: "Mark Roberts",
    price: "₦14,000",
    status: "In Progress",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Support and companionship for elders",
    user: "Anthonia Marwa",
    price: "₦14,000",
    status: "In Progress",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Cooking local and international dishes",
    user: "Sarah Adebayo",
    price: "₦14,000",
    status: "In Progress",
    image: "https://via.placeholder.com/150",
  },
];

const OrderList = () => {
  return (
    <div className="order-list">
      {orders.map((order, index) => (
        <OrderCard
          key={index}
          title={order.title}
          user={order.user}
          price={order.price}
          status={order.status}
          image={order.image}
        />
      ))}
    </div>
  );
};

export default OrderList;

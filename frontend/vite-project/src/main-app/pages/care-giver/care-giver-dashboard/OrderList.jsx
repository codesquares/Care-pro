import React from "react";
 import OrderCard from "./OrderCard";
import "./OrderList.css";
import caregiver1 from "../../../../assets/caregiver1.png";
import caregiver2 from "../../../../assets/caregiver2.png";
import caregiver3 from "../../../../assets/caregiver3.png";
import caregiver4 from "../../../../assets/caregiver4.png";

const orders = [
  {
    title: "I will clean your house and do laundry for ₦3,000 per hour",
    user: "Sarah Adebayo",
    price: "₦14,000",
    status: "In Progress",
    image: caregiver1,
  },
  {
    title: "Training and taking care of your pets",
    user: "Mark Roberts",
    price: "₦14,000",
    status: "In Progress",
    image: caregiver2,
  },
  {
    title: "Support and companionship for elders",
    user: "Anthonia Marwa",
    price: "₦14,000",
    status: "In Progress",
    image: caregiver3,
  },
  {
    title: "Cooking local and international dishes",
    user: "Sarah Adebayo",
    price: "₦14,000",
    status: "In Progress",
    image: caregiver4,
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

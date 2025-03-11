import React, { useState } from "react";
import Navbar from "../../../components/Navbar";
import "./Orders.scss";

const orders = [
  {
    title: "I will clean your house and do laundry for ₦3,000 per hour",
    status: "In Progress",
    image: "template1.png",
    rating: 4.5,
  },
  {
    title: "I will train and take care of your pets",
    status: "Completed",
    image: "template2.png",
    rating: 4.5,
  },
  {
    title: "Support and companionship for the elderly",
    status: "Cancelled",
    image: "template3.png",
    rating: 4.5,
  },
  {
    title: "I will cook local and international dishes",
    status: "Completed",
    image: "template4.png",
    rating: 4.5,
  },
];

const statusColors = {
  "In Progress": "yellow",
  Completed: "cyan",
  Cancelled: "red",
};

const MyOrders = () => {
  const [filter, setFilter] = useState("All orders");

  const filteredOrders =
    filter === "All orders"
      ? orders
      : orders.filter((order) => order.status === filter);

  return (
    <div className="orders-page">
      <Navbar />
      <div className="orders-container">
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
        <div className="orders-list">
          {filteredOrders.map((order, index) => (
            <div key={index} className="order-card">
              <img src={order.image} alt={index} className="order-image" />
              <div className="order-details">
                <h3>{order.title}</h3>
                <p>Ahmed Rufai</p>
                <div className="order-meta">
                  <span
                    className={`status ${statusColors[order.status] || ""}`}
                  >
                    {order.status}
                  </span>
                  <span className="rating">⭐ {order.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
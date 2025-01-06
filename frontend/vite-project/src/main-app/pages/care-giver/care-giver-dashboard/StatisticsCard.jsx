import React from "react";
import "./StatisticsCard.css";

const StatisticsCard = () => {
  return (
    <div className="statistics-card">
      <div className="stat">
        <span className="icon">🕒</span>
        <div className="stat-details">
          <p className="stat-title">Total Earnings</p>
          <h4 className="stat-value">₦350,500.00</h4>
        </div>
      </div>
      <div className="stat">
        <span className="icon">📋</span>
        <div className="stat-details">
          <p className="stat-title">No. of Orders</p>
          <h4 className="stat-value">1250</h4>
        </div>
      </div>
      <div className="stat">
        <span className="icon">⏳</span>
        <div className="stat-details">
          <p className="stat-title">Hours Spent</p>
          <h4 className="stat-value">32.5 hours</h4>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;

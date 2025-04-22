import React from "react";
import "./StatisticsCard.css";
import StatisticCard1 from "../../../../assets/statisticCard1.png";
import StatisticCard2 from "../../../../assets/statisticCard2.png";
import StatisticCard3 from "../../../../assets/statisticCard3.png";

const StatisticsCard = ({totalOrders, totalErnings}) => {
  return (
    <div className="statistics-card">
      <div className="stat">
        <img src={StatisticCard1} alt="card1" className="card-image" />  
        <div className="stat-details">
          <p className="stat-title">Total Earnings</p>
          <h4 className="stat-value">₦{totalErnings}</h4>
        </div>
      </div>
      <div className="stat">
        <img src={StatisticCard2} alt="card2" className="card-image" />  
        <div className="stat-details">
          <p className="stat-title">No. of Orders</p>
          <h4 className="stat-value">{totalOrders}</h4>
        </div>
      </div>
      <div className="stat">
        <img src={StatisticCard3} alt="card3" className="card-image" />  
        <div className="stat-details">
          <p className="stat-title">Hours Spent</p>
          <h4 className="stat-value">32.5 hours</h4>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;

import React from "react";
import "./banner.css";

const Banner = ({ name }) => {
  return (
    <div className="banner">
      <div className="welcome-section">
        <div className="avatar-circle">
          <span className="avatar-initial">{name.charAt(0)}</span>
        </div>
        <h2 className="welcome-text" style={{ color: "white" }}>Welcome back, {name.split(" ")[0]}</h2>
      </div>

      {/* <div className="search-box">
        <div className="search-info">
          <span className="search-icon">⭐</span>
          <div>
            <h4 className="search-title">Relax and get matched with caregivers easily!</h4>
            <p className="search-subtitle">Let carepro do the searching</p>
          </div>
        </div>
        <button className="view-orders">🧾 View your active orders</button>
      </div> */}
    </div>
  );
};

export default Banner;

import React from "react";
import "./banner.css";

const Banner = ({ name }) => (
  <div className="banner">
    <div>
      <h2>Welcome back, {name}</h2>
      <p>Let CarePro do the searching</p>
    </div>
    {/* <button className="btn-yellow">View your orders</button> */}
  </div>
);

export default Banner;

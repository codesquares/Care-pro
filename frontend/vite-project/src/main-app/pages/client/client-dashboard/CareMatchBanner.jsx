// src/components/CareMatchBanner.js
import "./CareMatchBanner.css";
import star from "../../../../assets/main-app/starc.svg";

const CareMatchBanner = () => {
  return (
    <div className="care-match-banner">
      <div className="banner-content">
      <div className="icon"><img src={star} alt="Icon" /></div>
      <div className="content">
        <h4>Relax and get matched with caregivers easily!</h4>
        <p>Let carepro do the searching</p>
      </div>
      </div>
      <button className="view-orders-button" onClick={() => window.location.href = "/app/client/my-order"}>
        <i className="fas fa-clipboard-list"></i> View your active orders
      </button>
    </div>
  );
};

export default CareMatchBanner;

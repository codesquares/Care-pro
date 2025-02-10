import { useState } from "react";
import "./HomeCareService.css";

const HomeCareService = () => {
  const [selectedPlan, setSelectedPlan] = useState("standard");

  const plans = [
    { name: "Basic", price: "NGN60,000/month", features: ["Washing clothes", "Tiding up your kids' room"] },
    { name: "Standard", price: "NGN80,000/month", features: ["Washing clothes", "Tiding up your kids' room", "Doing laundry"] },
    { name: "Premium", price: "NGN100,000/month", features: ["Washing clothes", "Tiding up your kids' room", "Doing laundry", "Taking care of your kids and baby"] }
  ];

  return (
    <div className="container">
      <h1 className="title">I will clean your house and do your laundry twice a week</h1>
      
      <div className="profile">
        <img src="/avatar.jpg" alt="Ahmed Rufai" className="avatar" />
        <div>
          <p className="name">Ahmed Rufai</p>
          <span className="rating">⭐⭐⭐⭐ 4.5 (210)</span>
        </div>
      </div>

      <div className="video-container">
        <button className="play-button">▶️</button>
      </div>

      <p className="description">Lorem ipsum text description about the service.</p>

      <button className="message-button">Message Ahmed Rufai</button>

      <div className="card pricing-card">
        <div className="plans">
          {plans.map((plan) => (
            <button
              key={plan.name}
              className={`plan-button ${selectedPlan === plan.name.toLowerCase() ? "active" : ""}`}
              onClick={() => setSelectedPlan(plan.name.toLowerCase())}
            >
              {plan.name}
            </button>
          ))}
        </div>
        <div className="plan-details">
          <h2 className="price">{plans.find(p => p.name.toLowerCase() === selectedPlan)?.price}</h2>
          <ul className="features">
            {plans.find(p => p.name.toLowerCase() === selectedPlan)?.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <button className="hire-button">Hire Ahmed Rufai</button>
        </div>
      </div>

      <div className="reviews">
        <h3 className="review-title">Reviews</h3>
        {[1, 2].map((_, i) => (
          <div key={i} className="card review-card">
            <div className="review-header">
              <img src="/avatar.jpg" alt="User" className="review-avatar" />
              <div>
                <p className="reviewer-name">Josiah Ruben</p>
                <div className="stars">
                  {"★".repeat(5)}
                </div>
              </div>
            </div>
            <p className="review-text">Lorem ipsum review text about the service quality and experience.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeCareService;

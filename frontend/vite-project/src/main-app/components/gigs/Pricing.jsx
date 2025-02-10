import React, { useState } from "react";
import "./Pricing.scss";

const PricingTable = ({ onPricingChange }) => {
  const [pricing, setPricing] = useState({
    Basic: { name: "", details: "", deliveryTime: "", amount: "" },
    Standard: { name: "", details: "", deliveryTime: "", amount: "" },
    Premium: { name: "", details: "", deliveryTime: "", amount: "" },
  });

  const handleInputChange = (plan, field, value) => {
    const updatedPricing = { ...pricing, [plan]: { ...pricing[plan], [field]: value } };
    setPricing(updatedPricing);
    onPricingChange(updatedPricing);
  };
  

  return (
    <div className="pricing-table">
      <div className="pricing-table-header">
        <h3>Price and Packages</h3>
        <p>Create packages and select prices for each offering.</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Basic</th>
            <th>Standard</th>
            <th>Premium</th>
          </tr>
        </thead>
        <tbody>
          {/* Name Your Package */}
          <tr>
            <td>
              <input
                type="text"
                value={pricing.Basic.name}
                onChange={(e) => handleInputChange("Basic", "name", e.target.value)}
                placeholder="Basic Package"
              />
            </td>
            <td>
              <input
                type="text"
                value={pricing.Standard.name}
                onChange={(e) => handleInputChange("Standard", "name", e.target.value)}
                placeholder="Standard Package"
              />
            </td>
            <td>
              <input
                type="text"
                value={pricing.Premium.name}
                onChange={(e) => handleInputChange("Premium", "name", e.target.value)}
                placeholder="Premium Package"
              />
            </td>
          </tr>

          {/* Describe Details */}
          <tr>
            <td>
              <textarea
                value={pricing.Basic.details}
                onChange={(e) => handleInputChange("Basic", "details", e.target.value)}
                placeholder="Describe your Basic package"
              />
            </td>
            <td>
              <textarea
                value={pricing.Standard.details}
                onChange={(e) => handleInputChange("Standard", "details", e.target.value)}
                placeholder="Describe your Standard package"
              />
            </td>
            <td>
              <textarea
                value={pricing.Premium.details}
                onChange={(e) => handleInputChange("Premium", "details", e.target.value)}
                placeholder="Describe your Premium package"
              />
            </td>
          </tr>

          {/* Delivery Time */}
          <tr>
            <td>
              <select
                value={pricing.Basic.deliveryTime}
                onChange={(e) => handleInputChange("Basic", "deliveryTime", e.target.value)}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 Day">1 Day</option>
                <option value="3 Days">3 Days</option>
                <option value="7 Days">7 Days</option>
              </select>
            </td>
            <td>
              <select
                value={pricing.Standard.deliveryTime}
                onChange={(e) => handleInputChange("Standard", "deliveryTime", e.target.value)}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 Day">1 Day</option>
                <option value="3 Days">3 Days</option>
                <option value="7 Days">7 Days</option>
              </select>
            </td>
            <td>
              <select
                value={pricing.Premium.deliveryTime}
                onChange={(e) => handleInputChange("Premium", "deliveryTime", e.target.value)}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 Day">1 Day</option>
                <option value="3 Days">3 Days</option>
                <option value="7 Days">7 Days</option>
              </select>
            </td>
          </tr>

          {/* Minimum Amount */}
          <tr>
            <td>
              <input
                type="number"
                value={pricing.Basic.amount}
                onChange={(e) => handleInputChange("Basic", "amount", e.target.value)}
                placeholder="0.00"
              />
            </td>
            <td>
              <input
                type="number"
                value={pricing.Standard.amount}
                onChange={(e) => handleInputChange("Standard", "amount", e.target.value)}
                placeholder="0.00"
              />
            </td>
            <td>
              <input
                type="number"
                value={pricing.Premium.amount}
                onChange={(e) => handleInputChange("Premium", "amount", e.target.value)}
                placeholder="0.00"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;

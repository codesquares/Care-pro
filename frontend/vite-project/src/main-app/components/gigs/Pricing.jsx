import React from "react";
import "./Pricing.scss";
import PackageDetailsInput from "./PackageDetailsInput";

const PricingTable = ({ pricing, onPricingChange, onFieldFocus, onFieldBlur, onFieldHover, onFieldLeave, validationErrors = {} }) => {
  const handleInputChange = (plan, field, value) => {
    const updatedPricing = { ...pricing, [plan]: { ...pricing[plan], [field]: value } };
    onPricingChange(updatedPricing);
  };

  const getFieldError = (plan, field) => {
    return validationErrors[plan.toLowerCase()]?.[field];
  };

  const hasFieldError = (plan, field) => {
    return !!getFieldError(plan, field);
  };

  return (
    <div className="pricing-table">
      <div className="pricing-table-header">
        <h3>Pricing & Package</h3>
        <p>Create your service package and set your pricing.</p>
        {validationErrors.general && (
          <div className="general-error">
            {validationErrors.general}
          </div>
        )}
      </div>

      <div className="pricing-form-container">
        <div className="pricing-field">
          <label>Package Name</label>
          <input
            type="text"
            value={pricing.Basic.name}
            onChange={(e) => handleInputChange("Basic", "name", e.target.value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-name')}
            onBlur={onFieldBlur}
            placeholder="Basic Package"
            className={hasFieldError("Basic", "name") ? 'error' : ''}
          />
          {getFieldError("Basic", "name") && (
            <div className="validation-error">
              {getFieldError("Basic", "name")}
            </div>
          )}
        </div>

        <div className="pricing-field">
          <label>Package Details</label>
          <PackageDetailsInput
            value={pricing.Basic.details}
            onChange={(value) => handleInputChange("Basic", "details", value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-details')}
            onBlur={onFieldBlur}
            placeholder="Enter a task and press Enter (e.g., medication assistance, vital checks)"
            className={hasFieldError("Basic", "details") ? 'error' : ''}
          />
          {getFieldError("Basic", "details") && (
            <div className="validation-error">
              {getFieldError("Basic", "details")}
            </div>
          )}
        </div>

        <div className="pricing-field">
          <label>Service Frequency</label>
          <select
            value={pricing.Basic.deliveryTime}
            onChange={(e) => handleInputChange("Basic", "deliveryTime", e.target.value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-delivery')}
            onBlur={onFieldBlur}
            className={hasFieldError("Basic", "deliveryTime") ? 'error' : ''}
          >
            <option value="">Select Service Frequency</option>
            <option value="1 Day Per Week">1 Day Per Week Service</option>
            <option value="3 Days Per Week">3 Days Per Week Service</option>
            <option value="5+ Days Per Week">5+ Days Per Week Service</option>
          </select>
          {getFieldError("Basic", "deliveryTime") && (
            <div className="validation-error">
              {getFieldError("Basic", "deliveryTime")}
            </div>
          )}
        </div>

        <div className="pricing-field">
          <label>Price (₦)</label>
          <input
            type="number"
            value={pricing.Basic.amount}
            onChange={(e) => handleInputChange("Basic", "amount", e.target.value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-amount')}
            onBlur={onFieldBlur}
            placeholder="₦0.00"
            className={hasFieldError("Basic", "amount") ? 'error' : ''}
          />
          {getFieldError("Basic", "amount") && (
            <div className="validation-error">
              {getFieldError("Basic", "amount")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingTable;

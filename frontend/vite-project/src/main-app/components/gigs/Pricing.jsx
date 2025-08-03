import React, { useState } from "react";
import "./Pricing.scss";

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
        <h3>Price and Packages</h3>
        <p>Create packages and select prices for each offering.</p>
        {validationErrors.general && (
          <div className="validation-error general-error">
            {validationErrors.general}
          </div>
        )}
        {validationErrors.progression && (
          <div className="validation-error general-error">
            {validationErrors.progression}
          </div>
        )}
      </div>

      <table className="table-styles">
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
                onFocus={() => onFieldFocus('pricing-basic-name')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-basic-name', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Basic Package"
                className={hasFieldError("Basic", "name") ? 'error' : ''}
              />
              {getFieldError("Basic", "name") && (
                <div className="validation-error">
                  {getFieldError("Basic", "name")}
                </div>
              )}
            </td>
            <td>
              <input
                type="text"
                value={pricing.Standard.name}
                onChange={(e) => handleInputChange("Standard", "name", e.target.value)}
                onFocus={() => onFieldFocus('pricing-standard-name')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-standard-name', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Standard Package"
                className={hasFieldError("Standard", "name") ? 'error' : ''}
              />
              {getFieldError("Standard", "name") && (
                <div className="validation-error">
                  {getFieldError("Standard", "name")}
                </div>
              )}
            </td>
            <td>
              <input
                type="text"
                value={pricing.Premium.name}
                onChange={(e) => handleInputChange("Premium", "name", e.target.value)}
                onFocus={() => onFieldFocus('pricing-premium-name')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-premium-name', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Premium Package"
                className={hasFieldError("Premium", "name") ? 'error' : ''}
              />
              {getFieldError("Premium", "name") && (
                <div className="validation-error">
                  {getFieldError("Premium", "name")}
                </div>
              )}
            </td>
          </tr>

          {/* Describe Details */}
          <tr>
            <td>
              <textarea
                value={pricing.Basic.details}
                onChange={(e) => handleInputChange("Basic", "details", e.target.value)}
                onFocus={() => onFieldFocus('pricing-basic-details')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-basic-details', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Describe tasks for Basic package and sepreate with ;"
                className={hasFieldError("Basic", "details") ? 'error' : ''}
              />
              {getFieldError("Basic", "details") && (
                <div className="validation-error">
                  {getFieldError("Basic", "details")}
                </div>
              )}
            </td>
            <td>
              <textarea
                value={pricing.Standard.details}
                onChange={(e) => handleInputChange("Standard", "details", e.target.value)}
                onFocus={() => onFieldFocus('pricing-standard-details')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-standard-details', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Describe tasks for Standard package and sepreate with ;"
                className={hasFieldError("Standard", "details") ? 'error' : ''}
              />
              {getFieldError("Standard", "details") && (
                <div className="validation-error">
                  {getFieldError("Standard", "details")}
                </div>
              )}
            </td>
            <td>
              <textarea
                value={pricing.Premium.details}
                onChange={(e) => handleInputChange("Premium", "details", e.target.value)}
                onFocus={() => onFieldFocus('pricing-premium-details')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-premium-details', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="Describe tasks for Premium package and sepreate with ;"
                className={hasFieldError("Premium", "details") ? 'error' : ''}
              />
              {getFieldError("Premium", "details") && (
                <div className="validation-error">
                  {getFieldError("Premium", "details")}
                </div>
              )}
            </td>
          </tr>

          {/* Delivery Time */}
          <tr>
            <td>
              <select
                value={pricing.Basic.deliveryTime}
                onChange={(e) => handleInputChange("Basic", "deliveryTime", e.target.value)}
                onFocus={() => onFieldFocus('pricing-basic-delivery')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-basic-delivery', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                className={hasFieldError("Basic", "deliveryTime") ? 'error' : ''}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 day (once per week)">1 day (once per week)</option>
                <option value="3 days (3 times per week)">3 days (3 times per week)</option>
                <option value="5 days or more">5 days or more</option>
              </select>
              {getFieldError("Basic", "deliveryTime") && (
                <div className="validation-error">
                  {getFieldError("Basic", "deliveryTime")}
                </div>
              )}
            </td>
            <td>
              <select
                value={pricing.Standard.deliveryTime}
                onChange={(e) => handleInputChange("Standard", "deliveryTime", e.target.value)}
                onFocus={() => onFieldFocus('pricing-standard-delivery')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-standard-delivery', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                className={hasFieldError("Standard", "deliveryTime") ? 'error' : ''}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 day (once per week)">1 day (once per week)</option>
                <option value="3 days (3 times per week)">3 days (3 times per week)</option>
                <option value="5 days or more">5 days or more</option>
              </select>
              {getFieldError("Standard", "deliveryTime") && (
                <div className="validation-error">
                  {getFieldError("Standard", "deliveryTime")}
                </div>
              )}
            </td>
            <td>
              <select
                value={pricing.Premium.deliveryTime}
                onChange={(e) => handleInputChange("Premium", "deliveryTime", e.target.value)}
                onFocus={() => onFieldFocus('pricing-premium-delivery')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-premium-delivery', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                className={hasFieldError("Premium", "deliveryTime") ? 'error' : ''}
              >
                <option value="">Select Delivery Time</option>
                <option value="1 day (once per week)">1 day (once per week)</option>
                <option value="3 days (3 times per week)">3 days (3 times per week)</option>
                <option value="5 days or more">5 days or more</option>
              </select>
              {getFieldError("Premium", "deliveryTime") && (
                <div className="validation-error">
                  {getFieldError("Premium", "deliveryTime")}
                </div>
              )}
            </td>
          </tr>

          {/* Minimum Amount */}
          <tr>
            <td className="amount-row">
              <input
                type="number"
                value={pricing.Basic.amount}
                onChange={(e) => handleInputChange("Basic", "amount", e.target.value)}
                onFocus={() => onFieldFocus('pricing-basic-amount')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-basic-amount', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="₦0.00"
                className={hasFieldError("Basic", "amount") ? 'error' : ''}
              />
              {getFieldError("Basic", "amount") && (
                <div className="validation-error">
                  {getFieldError("Basic", "amount")}
                </div>
              )}
            </td>
            <td className="amount-row">
              <input
                type="number"
                value={pricing.Standard.amount}
                onChange={(e) => handleInputChange("Standard", "amount", e.target.value)}
                onFocus={() => onFieldFocus('pricing-standard-amount')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-standard-amount', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="₦0.00"
                className={hasFieldError("Standard", "amount") ? 'error' : ''}
              />
              {getFieldError("Standard", "amount") && (
                <div className="validation-error">
                  {getFieldError("Standard", "amount")}
                </div>
              )}
            </td>
            <td className="amount-row">
              <input
                type="number"
                value={pricing.Premium.amount}
                onChange={(e) => handleInputChange("Premium", "amount", e.target.value)}
                onFocus={() => onFieldFocus('pricing-premium-amount')}
                onBlur={onFieldBlur}
                onMouseEnter={(e) => onFieldHover && onFieldHover('pricing-premium-amount', e)}
                onMouseLeave={(e) => onFieldLeave && onFieldLeave(e)}
                placeholder="₦0.00"
                className={hasFieldError("Premium", "amount") ? 'error' : ''}
              />
              {getFieldError("Premium", "amount") && (
                <div className="validation-error">
                  {getFieldError("Premium", "amount")}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PricingTable;

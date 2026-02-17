import { useState } from "react";
import "./Pricing.css";
import PackageDetailsInput from "./PackageDetailsInput";
import PricingTemplates from "./PricingTemplates";

const PricingTable = ({ pricing, onPricingChange, onFieldFocus, onFieldBlur, onFieldHover, onFieldLeave, validationErrors = {}, category }) => {
  const [activeTab, setActiveTab] = useState("manual"); // "templates" or "manual"
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleInputChange = (plan, field, value) => {
    const updatedPricing = { ...pricing, [plan]: { ...pricing[plan], [field]: value } };
    onPricingChange(updatedPricing);
  };

  const handleApplyTemplate = (templatePackages) => {
    // Apply only the Basic package from the template
    const basicOnly = {
      Basic: templatePackages.Basic || Object.values(templatePackages)[0] || { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
      Standard: { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
      Premium: { name: "", details: "", deliveryTime: "1 Day Per Week", amount: "" },
    };
    onPricingChange(basicOnly);
    // Switch to manual tab after applying
    setActiveTab("manual");
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

      {/* Tab Navigation */}
      <div className="pricing-tabs">
        <button
          type="button"
          className={`pricing-tab ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          📋 Templates
        </button>
        <button
          type="button"
          className={`pricing-tab ${activeTab === "manual" ? "active" : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <PricingTemplates
          selectedTemplate={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
          onApplyTemplate={handleApplyTemplate}
          category={category}
        />
      )}

      {/* Manual Entry Tab */}
      {activeTab === "manual" && (
      <div className="pricing-form-container">
        <div className="pricing-field">
          <label>Package Name</label>
          <input
            type="text"
            value={pricing.Basic?.name || ""}
            onChange={(e) => handleInputChange("Basic", "name", e.target.value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-name')}
            onBlur={onFieldBlur}
            placeholder="e.g. Weekly Adult Care"
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
            value={pricing.Basic?.details || ""}
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
          <label>Delivery Schedule</label>
          <select
            value={pricing.Basic?.deliveryTime || ""}
            onChange={(e) => handleInputChange("Basic", "deliveryTime", e.target.value)}
            onFocus={() => onFieldFocus && onFieldFocus('basic-delivery')}
            onBlur={onFieldBlur}
          >
            <option value="">Select frequency</option>
            <option value="1 Day Per Week">1 Day Per Week</option>
            <option value="2 Days Per Week">2 Days Per Week</option>
            <option value="3 Days Per Week">3 Days Per Week</option>
            <option value="4 Days Per Week">4 Days Per Week</option>
            <option value="5 Days Per Week">5 Days Per Week</option>
            <option value="6 Days Per Week">6 Days Per Week</option>
            <option value="7 Days Per Week">7 Days Per Week</option>
          </select>
        </div>

        <div className="pricing-field">
          <label>Price (₦)</label>
          <input
            type="number"
            value={pricing.Basic?.amount || ""}
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
      )}
    </div>
  );
};

export default PricingTable;

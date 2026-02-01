import { pricingTemplates, getTemplateOptions, getPricingFromTemplate } from "../../constants/pricingTemplates";
import "./Pricing.css";

const PricingTemplates = ({ selectedTemplate, onTemplateSelect, onApplyTemplate, category }) => {
  const templateOptions = getTemplateOptions(category);

  const handleTemplateChange = (templateKey) => {
    onTemplateSelect(templateKey);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      const packages = getPricingFromTemplate(category, selectedTemplate);
      if (packages) {
        onApplyTemplate(packages);
      }
    }
  };

  return (
    <div className="pricing-templates">
      <div className="template-selector">
        <h4>Choose a Pricing Template</h4>
        <p>Select a template to quickly set up your pricing packages</p>

        <div className="template-options">
          {templateOptions.map((option) => (
            <div
              key={option.value}
              className={`template-option ${selectedTemplate === option.value ? 'selected' : ''}`}
              onClick={() => handleTemplateChange(option.value)}
            >
              <div className="template-header">
                <h5>{option.label}</h5>
                {selectedTemplate === option.value && (
                  <span className="selected-indicator">✓</span>
                )}
              </div>
              <p className="template-description">{option.description}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-secondary apply-template-btn"
          onClick={handleApplyTemplate}
          disabled={!selectedTemplate}
        >
          Apply Template
        </button>
      </div>
    </div>
  );
};

export default PricingTemplates;
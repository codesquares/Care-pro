import { getTemplateOptions, getPricingFromTemplate, getCategoryTemplateTier, getCategoryIcon } from "../../constants/pricingTemplates";
import { SERVICE_TIERS } from "../../constants/serviceClassification";
import "./Pricing.css";

const PricingTemplates = ({ selectedTemplate, onTemplateSelect, onApplyTemplate, category, sampleTasks = [] }) => {
  const templateOptions = getTemplateOptions(category);
  const categoryTier = getCategoryTemplateTier(category);
  const icon = getCategoryIcon(category);
  const isSpecialized = categoryTier === SERVICE_TIERS.SPECIALIZED;

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
        <h4>{icon} Pricing Templates {category ? `for ${category}` : ""}</h4>
        <p>Select a template to quickly set up your pricing, or use suggested tasks below in manual entry.</p>

        {sampleTasks.length > 0 && (
          <div className="api-suggested-tasks">
            <span className="sample-tasks-label">Suggested tasks for your subcategories:</span>
            <div className="sample-tasks-list">
              {sampleTasks.slice(0, 10).map((st) => (
                <span key={st.id} className="sample-task-chip" style={{ cursor: 'default', borderStyle: 'solid' }}>
                  {st.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {isSpecialized && (
          <div className="specialized-template-notice">
            <span className="notice-icon">🔒</span>
            <span>
              <strong>{category}</strong> is a specialized service. You'll need a specialized assessment &amp; relevant certificates to publish gigs in this category.
            </span>
          </div>
        )}

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
              {option.tasks && option.tasks.length > 0 && (
                <ul className="template-task-list">
                  {option.tasks.slice(0, 4).map((task, idx) => (
                    <li key={idx} className="template-task-item">• {task}</li>
                  ))}
                  {option.tasks.length > 4 && (
                    <li className="template-task-more">+{option.tasks.length - 4} more</li>
                  )}
                </ul>
              )}
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
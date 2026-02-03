import { useState } from "react";
import { packageTemplates, getTemplateCategories, getTemplatesForCategory } from "../../constants/packageTemplates";
import "./Pricing.css";

const PackageTemplates = ({ onApplyTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const categories = getTemplateCategories();
  const templates = selectedCategory ? getTemplatesForCategory(selectedCategory) : [];

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
  };

  const handleApplyTemplate = () => {
    if (selectedCategory && selectedTemplate) {
      const templateData = packageTemplates[selectedCategory].templates[selectedTemplate];
      onApplyTemplate(templateData);
    }
  };

  return (
    <div className="package-templates">
      <div className="template-selector">
        <h4>Choose Package Templates</h4>
        <p>Select predefined packages to quickly set up your service details</p>

        {/* Category Selection */}
        <div className="template-categories">
          <h5>Service Category</h5>
          <div className="category-grid">
            {categories.map((category) => (
              <div
                key={category.value}
                className={`category-card ${selectedCategory === category.value ? 'selected' : ''}`}
                onClick={() => handleCategorySelect(category.value)}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-content">
                  <h6>{category.label}</h6>
                  <p>{category.description}</p>
                </div>
                {selectedCategory === category.value && (
                  <span className="selected-indicator">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        {selectedCategory && (
          <div className="template-options-section">
            <h5>Package Templates</h5>
            <div className="template-options">
              {templates.map((template) => (
                <div
                  key={template.value}
                  className={`template-option ${selectedTemplate === template.value ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template.value)}
                >
                  <div className="template-header">
                    <h5>{template.label}</h5>
                    {selectedTemplate === template.value && (
                      <span className="selected-indicator">✓</span>
                    )}
                  </div>
                  <div className="template-details">
                    <div className="template-tasks">
                      <strong>Tasks:</strong>
                      <ul>
                        {template.tasks.slice(0, 3).map((task, index) => (
                          <li key={index}>{task}</li>
                        ))}
                        {template.tasks.length > 3 && (
                          <li>...and {template.tasks.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                    <div className="template-price">
                      <strong>Suggested Price:</strong> ₦{template.suggestedPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary apply-template-btn"
          onClick={handleApplyTemplate}
          disabled={!selectedCategory || !selectedTemplate}
        >
          Apply Package Template
        </button>
      </div>
    </div>
  );
};

export default PackageTemplates;
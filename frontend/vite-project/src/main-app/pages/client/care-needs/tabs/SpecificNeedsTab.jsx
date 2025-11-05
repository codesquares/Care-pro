import React, { useState } from 'react';
import './SpecificNeedsTab.css';

const SpecificNeedsTab = ({ careNeeds, updateCareNeeds, validationErrors }) => {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showAdvanced, setShowAdvanced] = useState({});

  // Helper functions to determine which sections to show
  const showMedicalNeeds = () => {
    const medicalCategories = ['Adult Care', 'Post Surgery Care', 'Special Needs Care', 'Medical Support', 'Mobility Support', 'Palliative'];
    return careNeeds?.serviceCategories?.some(category => medicalCategories.includes(category)) || false;
  };

  const showChildCareNeeds = () => {
    return careNeeds?.serviceCategories?.includes('Child Care') || false;
  };

  const showPetCareNeeds = () => {
    return careNeeds?.serviceCategories?.includes('Pet Care') || false;
  };

  const showHomeCareNeeds = () => {
    return careNeeds?.serviceCategories?.includes('Home Care') || false;
  };

  const showTherapyNeeds = () => {
    return careNeeds?.serviceCategories?.includes('Therapy & Wellness') || false;
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleAdvanced = (sectionId) => {
    setShowAdvanced(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const updateNestedField = (category, field, value) => {
    updateCareNeeds({
      [category]: {
        ...careNeeds[category],
        [field]: value
      }
    });
  };

  const handleMultiSelect = (category, field, item) => {
    const currentItems = careNeeds[category]?.[field] || [];
    let updatedItems;

    if (currentItems.includes(item)) {
      updatedItems = currentItems.filter(i => i !== item);
    } else {
      updatedItems = [...currentItems, item];
    }

    updateNestedField(category, field, updatedItems);
  };

  const shouldShowOthersInput = (category, field) => {
    const otherFieldName = `${field}Other`;
    const otherValue = careNeeds[category]?.[otherFieldName];
    return otherValue !== undefined && otherValue !== '';
  };

  const renderOthersOption = (category, field, placeholder, options) => (
    <div className="others-option">
      <div className="checkbox-item">
        <input
          type="checkbox"
          id={`${category}-${field}-others`}
          checked={shouldShowOthersInput(category, field)}
          onChange={(e) => {
            if (!e.target.checked) {
              updateNestedField(category, `${field}Other`, '');
            } else {
              updateNestedField(category, `${field}Other`, ' ');
            }
          }}
        />
        <label htmlFor={`${category}-${field}-others`}>Others (specify)</label>
      </div>
      
      {shouldShowOthersInput(category, field) && (
        <div className="others-input">
          <input
            type="text"
            placeholder={placeholder}
            value={careNeeds[category]?.[`${field}Other`]?.trim() || ''}
            onChange={(e) => updateNestedField(category, `${field}Other`, e.target.value)}
            className="form-input"
          />
        </div>
      )}
    </div>
  );

  // Data for form options
  const medicalConditions = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Arthritis', 'Dementia',
    'Alzheimer\'s', 'Stroke Recovery', 'Cancer Care', 'COPD', 'Kidney Disease'
  ];

  const mobilityLevels = [
    'Fully Mobile', 'Needs Assistance Walking', 'Uses Walker/Cane', 
    'Wheelchair Bound', 'Bed Bound'
  ];

  const assistanceLevels = [
    'Minimal Assistance', 'Moderate Assistance', 'Significant Assistance', 
    'Total Care Required'
  ];

  const dietaryRestrictions = [
    'Diabetic Diet', 'Low Sodium', 'Heart Healthy', 'Vegetarian', 
    'Vegan', 'Gluten Free', 'Kosher', 'Halal'
  ];

  const ageRanges = [
    '0-2 years (Infant)', '3-5 years (Toddler)', '6-12 years (Child)', 
    '13-17 years (Teen)'
  ];

  const supervisionLevels = [
    'Light Supervision', 'Moderate Supervision', 'Constant Supervision', 
    'Overnight Care'
  ];

  const petTypes = [
    'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig'
  ];

  const petSizes = ['Small', 'Medium', 'Large', 'Extra Large'];

  const exerciseNeeds = [
    'Daily Walks', 'Playtime', 'Exercise', 'Grooming', 'Training'
  ];

  const homeFocusAreas = [
    'Kitchen', 'Bathrooms', 'Living Areas', 'Bedrooms', 'Laundry', 
    'Outdoor Areas', 'Garage', 'Basement'
  ];

  const therapyTypes = [
    'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 
    'Massage Therapy', 'Mental Health Support'
  ];

  const petCareNeedsContent = (
    <div className="needs-content">
      <div className="basic-section">
        <h4>Essential Information</h4>
        <div className="form-group">
          <label>Pet Types *</label>
          <div className="checkbox-grid">
            {petTypes.map(type => (
              <div key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`pet-${type.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={careNeeds.petCareNeeds?.petTypes?.includes(type) || false}
                  onChange={() => handleMultiSelect('petCareNeeds', 'petTypes', type)}
                />
                <label htmlFor={`pet-${type.replace(/\s+/g, '-').toLowerCase()}`}>{type}</label>
              </div>
            ))}
          </div>
          {renderOthersOption('petCareNeeds', 'petTypes', 'Please specify other pet types...')}
          {validationErrors.petTypes && (
            <span className="field-error">{validationErrors.petTypes}</span>
          )}
        </div>
        <div className="form-group">
          <label>Number of Pets *</label>
          <select
            value={careNeeds.petCareNeeds?.numberOfPets || ''}
            onChange={(e) => updateNestedField('petCareNeeds', 'numberOfPets', e.target.value)}
            className={validationErrors.numberOfPets ? 'error' : ''}
          >
            <option value="">Select number of pets</option>
            <option value="1">1 pet</option>
            <option value="2">2 pets</option>
            <option value="3">3 pets</option>
            <option value="4">4 pets</option>
            <option value="5+">5+ pets</option>
          </select>
          {validationErrors.numberOfPets && (
            <span className="field-error">{validationErrors.numberOfPets}</span>
          )}
        </div>
      </div>
    </div>
  );

  const homeCareNeedsContent = (
    <div className="needs-content">
      <div className="basic-section">
        <h4>Essential Information</h4>
        <div className="form-group">
          <label>Focus Areas</label>
          <div className="checkbox-grid">
            {homeFocusAreas.map(area => (
              <div key={area} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`area-${area.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={careNeeds.homeCareNeeds?.focusAreas?.includes(area) || false}
                  onChange={() => handleMultiSelect('homeCareNeeds', 'focusAreas', area)}
                />
                <label htmlFor={`area-${area.replace(/\s+/g, '-').toLowerCase()}`}>{area}</label>
              </div>
            ))}
          </div>
          {renderOthersOption('homeCareNeeds', 'focusAreas', 'Please specify other areas...')}
        </div>
      </div>
    </div>
  );

  const therapyNeedsContent = (
    <div className="needs-content">
      <div className="basic-section">
        <h4>Essential Information</h4>
        <div className="form-group">
          <label>Therapy Types</label>
          <div className="checkbox-grid">
            {therapyTypes.map(type => (
              <div key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`therapy-${type.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={careNeeds.therapyNeeds?.therapyTypes?.includes(type) || false}
                  onChange={() => handleMultiSelect('therapyNeeds', 'therapyTypes', type)}
                />
                <label htmlFor={`therapy-${type.replace(/\s+/g, '-').toLowerCase()}`}>{type}</label>
              </div>
            ))}
          </div>
          {renderOthersOption('therapyNeeds', 'therapyTypes', 'Please specify other therapy types...')}
        </div>
      </div>
    </div>
  );

  const renderSection = (id, title, icon, content, isRequired = false) => {
    const isExpanded = expandedSections.has(id);
    const hasError = Object.keys(validationErrors).some(key => key.startsWith(id));

    return (
      <div className={`need-section ${isExpanded ? 'expanded' : ''} ${hasError ? 'has-error' : ''}`}>
        <div 
          className="section-header"
          onClick={() => toggleSection(id)}
        >
          <div className="section-info">
            <span className="section-icon">{icon}</span>
            <div>
              <h3 className="section-title">
                {title}
                {isRequired && <span className="required-indicator">*</span>}
              </h3>
              <p className="section-subtitle">
                {isExpanded ? 'Click to collapse' : 'Click to expand and configure'}
              </p>
            </div>
          </div>
          <div className="expand-indicator">
            {isExpanded ? '−' : '+'}
          </div>
        </div>

        {isExpanded && (
          <div className="section-content">
            {content}
          </div>
        )}
      </div>
    );
  };

  const medicalNeedsContent = (
    <div className="needs-content">
      {/* Basic Medical Needs */}
      <div className="basic-section">
        <h4>Essential Information</h4>
        
        <div className="form-group">
          <label>Primary Condition *</label>
          <select
            value={careNeeds.medicalNeeds?.primaryCondition || ''}
            onChange={(e) => updateNestedField('medicalNeeds', 'primaryCondition', e.target.value)}
            className={validationErrors.primaryCondition ? 'error' : ''}
          >
            <option value="">Select primary condition</option>
            {medicalConditions.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
          {validationErrors.primaryCondition && (
            <span className="field-error">{validationErrors.primaryCondition}</span>
          )}
        </div>

        <div className="form-group">
          <label>Assistance Level *</label>
          <select
            value={careNeeds.medicalNeeds?.assistanceLevel || ''}
            onChange={(e) => updateNestedField('medicalNeeds', 'assistanceLevel', e.target.value)}
            className={validationErrors.assistanceLevel ? 'error' : ''}
          >
            <option value="">Select assistance level</option>
            {assistanceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {validationErrors.assistanceLevel && (
            <span className="field-error">{validationErrors.assistanceLevel}</span>
          )}
        </div>

        <div className="form-group">
          <label>Mobility Level</label>
          <select
            value={careNeeds.medicalNeeds?.mobilityLevel || ''}
            onChange={(e) => updateNestedField('medicalNeeds', 'mobilityLevel', e.target.value)}
          >
            <option value="">Select mobility level</option>
            {mobilityLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Medical Needs */}
      <div className="advanced-toggle">
        <button
          type="button"
          className="toggle-button"
          onClick={() => toggleAdvanced('medical')}
        >
          {showAdvanced.medical ? '← Hide Advanced Options' : 'Show Advanced Options →'}
        </button>
      </div>

      {showAdvanced.medical && (
        <div className="advanced-section">
          <h4>Additional Medical Details</h4>
          
          <div className="form-group">
            <label>Additional Conditions</label>
            <div className="checkbox-grid">
              {medicalConditions.slice(1).map(condition => (
                <div key={condition} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.medicalNeeds?.additionalConditions?.includes(condition) || false}
                    onChange={() => handleMultiSelect('medicalNeeds', 'additionalConditions', condition)}
                  />
                  <label htmlFor={`condition-${condition.replace(/\s+/g, '-').toLowerCase()}`}>
                    {condition}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('medicalNeeds', 'additionalConditions', 'Please specify other conditions...')}
          </div>

          <div className="form-group">
            <label>Dietary Restrictions</label>
            <div className="checkbox-grid">
              {dietaryRestrictions.map(diet => (
                <div key={diet} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`diet-${diet.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.medicalNeeds?.dietaryRestrictions?.includes(diet) || false}
                    onChange={() => handleMultiSelect('medicalNeeds', 'dietaryRestrictions', diet)}
                  />
                  <label htmlFor={`diet-${diet.replace(/\s+/g, '-').toLowerCase()}`}>
                    {diet}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('medicalNeeds', 'dietaryRestrictions', 'Please specify other dietary restrictions...')}
          </div>

          <div className="form-group">
            <label>Care Requirements</label>
            <div className="checkbox-list">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="medication-management"
                  checked={careNeeds.medicalNeeds?.medicationManagement || false}
                  onChange={(e) => updateNestedField('medicalNeeds', 'medicationManagement', e.target.checked)}
                />
                <label htmlFor="medication-management">Medication Management Required</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="frequent-monitoring"
                  checked={careNeeds.medicalNeeds?.frequentMonitoring || false}
                  onChange={(e) => updateNestedField('medicalNeeds', 'frequentMonitoring', e.target.checked)}
                />
                <label htmlFor="frequent-monitoring">Frequent Health Monitoring Required</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const childCareNeedsContent = (
    <div className="needs-content">
      {/* Basic Child Care Needs */}
      <div className="basic-section">
        <h4>Essential Information</h4>
        
        <div className="form-group">
          <label>Age Ranges *</label>
          <div className="checkbox-grid">
            {ageRanges.map(age => (
              <div key={age} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`age-${age.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={careNeeds.childCareNeeds?.ageRanges?.includes(age) || false}
                  onChange={() => handleMultiSelect('childCareNeeds', 'ageRanges', age)}
                />
                <label htmlFor={`age-${age.replace(/\s+/g, '-').toLowerCase()}`}>
                  {age}
                </label>
              </div>
            ))}
          </div>
          {renderOthersOption('childCareNeeds', 'ageRanges', 'Please specify other age ranges...')}
          {validationErrors.ageRanges && (
            <span className="field-error">{validationErrors.ageRanges}</span>
          )}
        </div>

        <div className="form-group">
          <label>Number of Children</label>
          <select
            value={careNeeds.childCareNeeds?.numberOfChildren || ''}
            onChange={(e) => updateNestedField('childCareNeeds', 'numberOfChildren', e.target.value)}
          >
            <option value="">Select number of children</option>
            <option value="1">1 child</option>
            <option value="2">2 children</option>
            <option value="3">3 children</option>
            <option value="4">4 children</option>
            <option value="5+">5+ children</option>
          </select>
        </div>

        <div className="form-group">
          <label>Supervision Level *</label>
          <select
            value={careNeeds.childCareNeeds?.supervisionLevel || ''}
            onChange={(e) => updateNestedField('childCareNeeds', 'supervisionLevel', e.target.value)}
            className={validationErrors.supervisionLevel ? 'error' : ''}
          >
            <option value="">Select supervision level</option>
            {supervisionLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {validationErrors.supervisionLevel && (
            <span className="field-error">{validationErrors.supervisionLevel}</span>
          )}
        </div>
      </div>

      {/* Advanced Child Care Needs */}
      <div className="advanced-toggle">
        <button
          type="button"
          className="toggle-button"
          onClick={() => toggleAdvanced('childcare')}
        >
          {showAdvanced.childcare ? '← Hide Advanced Options' : 'Show Advanced Options →'}
        </button>
      </div>

      {showAdvanced.childcare && (
        <div className="advanced-section">
          <h4>Additional Child Care Details</h4>
          
          <div className="form-group">
            <label>Special Needs</label>
            <div className="checkbox-grid">
              {['ADHD', 'Autism', 'Learning Disabilities', 'Physical Disabilities', 'Behavioral Issues', 'Food Allergies'].map(need => (
                <div key={need} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`special-${need.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.childCareNeeds?.specialNeeds?.includes(need) || false}
                    onChange={() => handleMultiSelect('childCareNeeds', 'specialNeeds', need)}
                  />
                  <label htmlFor={`special-${need.replace(/\s+/g, '-').toLowerCase()}`}>
                    {need}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('childCareNeeds', 'specialNeeds', 'Please specify other special needs...')}
          </div>

          <div className="form-group">
            <label>Activity Preferences</label>
            <div className="checkbox-grid">
              {['Reading', 'Arts & Crafts', 'Outdoor Play', 'Educational Games', 'Music', 'Sports', 'Swimming', 'Technology/Tablets'].map(activity => (
                <div key={activity} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`activity-${activity.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.childCareNeeds?.activitiesPreferences?.includes(activity) || false}
                    onChange={() => handleMultiSelect('childCareNeeds', 'activitiesPreferences', activity)}
                  />
                  <label htmlFor={`activity-${activity.replace(/\s+/g, '-').toLowerCase()}`}>
                    {activity}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('childCareNeeds', 'activitiesPreferences', 'Please specify other activities...')}
          </div>

          <div className="form-group">
            <label>Emergency Contact Information</label>
            <textarea
              value={careNeeds.childCareNeeds?.emergencyContacts || ''}
              onChange={(e) => updateNestedField('childCareNeeds', 'emergencyContacts', e.target.value)}
              placeholder="Provide emergency contact details..."
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={careNeeds.childCareNeeds?.additionalNotes || ''}
              onChange={(e) => updateNestedField('childCareNeeds', 'additionalNotes', e.target.value)}
              placeholder="Any additional information about child care needs..."
              className="form-input"
              rows="3"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="specific-needs-tab">
      <div className="tab-header">
        <h2>Your Specific Care Needs</h2>
        <p>Configure detailed requirements based on your selected services.</p>
      </div>

      <div className="needs-sections">
        {showMedicalNeeds() && renderSection(
          'medical',
          'Medical & Health Needs',
          '⚕️',
          medicalNeedsContent,
          true
        )}

        {showChildCareNeeds() && renderSection(
          'childcare',
          'Child Care Requirements',
          '👶',
          childCareNeedsContent,
          true
        )}

        {showPetCareNeeds() && renderSection(
          'petcare',
          'Pet Care Requirements',
          '🐕',
          petCareNeedsContent,
          true
        )}

        {showHomeCareNeeds() && renderSection(
          'homecare',
          'Home Care Services',
          '🏠',
          homeCareNeedsContent
        )}

        {showTherapyNeeds() && renderSection(
          'therapy',
          'Therapy & Wellness',
          '🧘',
          therapyNeedsContent
        )}
      </div>

      {(!showMedicalNeeds() && !showChildCareNeeds() && !showPetCareNeeds() && !showHomeCareNeeds() && !showTherapyNeeds()) && (
        <div className="no-services-message">
          <div className="message-content">
            <span className="message-icon">📋</span>
            <h3>No Specific Services Selected</h3>
            <p>Go back to the Service Selection tab to choose your care services first.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificNeedsTab;
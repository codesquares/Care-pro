import React, { useState } from 'react';
import './CaregiverPreferencesTab.css';

const CaregiverPreferencesTab = ({ careNeeds, updateCareNeeds, validationErrors }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data for form options
  const certificationOptions = [
    'CNA (Certified Nursing Assistant)', 'LPN (Licensed Practical Nurse)', 'RN (Registered Nurse)',
    'CMA (Certified Medical Assistant)', 'HHA (Home Health Aide)', 'PCA (Personal Care Assistant)',
    'CPR Certified', 'First Aid Certified', 'Alzheimer\'s Care Certified', 'Hospice Care Certified'
  ];

  const experienceLevelOptions = [
    'Entry Level (0-1 years)', 'Some Experience (1-3 years)', 'Experienced (3-5 years)',
    'Very Experienced (5-10 years)', 'Expert (10+ years)'
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Urdu', 'Tagalog'
  ];

  const personalityTraitOptions = [
    'Patient', 'Compassionate', 'Reliable', 'Gentle', 'Energetic', 'Calm',
    'Professional', 'Friendly', 'Respectful', 'Understanding', 'Trustworthy', 'Flexible'
  ];

  const availabilityOptions = [
    'Morning (6 AM - 12 PM)', 'Afternoon (12 PM - 6 PM)', 'Evening (6 PM - 12 AM)',
    'Night (12 AM - 6 AM)', 'Weekdays Only', 'Weekends Only', 'Holiday Availability',
    'Emergency On-Call', '24/7 Live-in', 'Flexible Schedule'
  ];

  const specialSkillOptions = [
    'Medication Management', 'Mobility Assistance', 'Transfer Techniques', 'Wound Care',
    'Diabetic Care', 'Dementia/Alzheimer\'s Care', 'Post-Surgery Care', 'Physical Therapy Support',
    'Mental Health Support', 'Pediatric Care', 'Geriatric Care', 'Hospice/Palliative Care'
  ];

  const updateCaregiverRequirement = (field, value) => {
    updateCareNeeds({
      caregiverRequirements: {
        ...careNeeds.caregiverRequirements,
        [field]: value
      }
    });
  };

  const handleMultiSelect = (field, item) => {
    const currentItems = careNeeds.caregiverRequirements?.[field] || [];
    let updatedItems;

    if (currentItems.includes(item)) {
      updatedItems = currentItems.filter(i => i !== item);
    } else {
      updatedItems = [...currentItems, item];
    }

    updateCaregiverRequirement(field, updatedItems);
  };

  const shouldShowOthersInput = (field) => {
    const otherFieldName = `${field}Other`;
    const otherValue = careNeeds.caregiverRequirements?.[otherFieldName];
    return otherValue !== undefined && otherValue !== '';
  };

  const renderOthersOption = (field, placeholder) => (
    <div className="others-option">
      <div className="checkbox-item">
        <input
          type="checkbox"
          id={`${field}-others`}
          checked={shouldShowOthersInput(field)}
          onChange={(e) => {
            if (!e.target.checked) {
              updateCaregiverRequirement(`${field}Other`, '');
            } else {
              updateCaregiverRequirement(`${field}Other`, ' ');
            }
          }}
        />
        <label htmlFor={`${field}-others`}>Others (specify)</label>
      </div>
      
      {shouldShowOthersInput(field) && (
        <div className="others-input">
          <input
            type="text"
            placeholder={placeholder}
            value={careNeeds.caregiverRequirements?.[`${field}Other`]?.trim() || ''}
            onChange={(e) => updateCaregiverRequirement(`${field}Other`, e.target.value)}
            className="form-input"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="caregiver-preferences-tab">
      <div className="tab-header">
        <h2>Caregiver Preferences</h2>
        <p>Specify your preferences for caregiver qualifications and attributes.</p>
      </div>

      <div className="preferences-content">
        {/* Basic Preferences */}
        <div className="basic-section">
          <h3>Essential Qualifications</h3>
          
          {/* Required Certifications */}
          <div className="form-group">
            <label>Required Certifications</label>
            <div className="checkbox-grid">
              {certificationOptions.map(cert => (
                <div key={cert} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`cert-${cert.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.caregiverRequirements?.certifications?.includes(cert) || false}
                    onChange={() => handleMultiSelect('certifications', cert)}
                  />
                  <label htmlFor={`cert-${cert.replace(/\s+/g, '-').toLowerCase()}`}>
                    {cert}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('certifications', 'Please specify other required certifications...')}
          </div>

          {/* Experience Level */}
          <div className="form-group">
            <label>Minimum Experience Level</label>
            <select
              value={careNeeds.caregiverRequirements?.experienceLevel || ''}
              onChange={(e) => updateCaregiverRequirement('experienceLevel', e.target.value)}
              className="form-select"
            >
              <option value="">Select minimum experience level</option>
              {experienceLevelOptions.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Languages */}
          <div className="form-group">
            <label>Preferred Languages</label>
            <div className="checkbox-grid">
              {languageOptions.map(language => (
                <div key={language} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`lang-${language.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={careNeeds.caregiverRequirements?.languages?.includes(language) || false}
                    onChange={() => handleMultiSelect('languages', language)}
                  />
                  <label htmlFor={`lang-${language.replace(/\s+/g, '-').toLowerCase()}`}>
                    {language}
                  </label>
                </div>
              ))}
            </div>
            {renderOthersOption('languages', 'Please specify other languages...')}
          </div>
        </div>

        {/* Advanced Preferences Toggle */}
        <div className="advanced-toggle">
          <button
            type="button"
            className="toggle-button"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '← Hide Advanced Preferences' : 'Show Advanced Preferences →'}
          </button>
        </div>

        {/* Advanced Preferences */}
        {showAdvanced && (
          <div className="advanced-section">
            <h3>Additional Preferences</h3>

            {/* Personality Traits */}
            <div className="form-group">
              <label>Desired Personality Traits</label>
              <div className="checkbox-grid">
                {personalityTraitOptions.map(trait => (
                  <div key={trait} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`trait-${trait.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={careNeeds.caregiverRequirements?.personalityTraits?.includes(trait) || false}
                      onChange={() => handleMultiSelect('personalityTraits', trait)}
                    />
                    <label htmlFor={`trait-${trait.replace(/\s+/g, '-').toLowerCase()}`}>
                      {trait}
                    </label>
                  </div>
                ))}
              </div>
              {renderOthersOption('personalityTraits', 'Please specify other personality traits...')}
            </div>

            {/* Availability Requirements */}
            <div className="form-group">
              <label>Availability Requirements</label>
              <div className="checkbox-grid">
                {availabilityOptions.map(availability => (
                  <div key={availability} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`avail-${availability.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={careNeeds.caregiverRequirements?.availability?.includes(availability) || false}
                      onChange={() => handleMultiSelect('availability', availability)}
                    />
                    <label htmlFor={`avail-${availability.replace(/\s+/g, '-').toLowerCase()}`}>
                      {availability}
                    </label>
                  </div>
                ))}
              </div>
              {renderOthersOption('availability', 'Please specify other availability requirements...')}
            </div>

            {/* Special Skills */}
            <div className="form-group">
              <label>Required Special Skills</label>
              <div className="checkbox-grid">
                {specialSkillOptions.map(skill => (
                  <div key={skill} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`skill-${skill.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={careNeeds.caregiverRequirements?.specialSkills?.includes(skill) || false}
                      onChange={() => handleMultiSelect('specialSkills', skill)}
                    />
                    <label htmlFor={`skill-${skill.replace(/\s+/g, '-').toLowerCase()}`}>
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
              {renderOthersOption('specialSkills', 'Please specify other required skills...')}
            </div>

            {/* Gender Preference */}
            <div className="form-group">
              <label>Gender Preference (Optional)</label>
              <select
                value={careNeeds.caregiverRequirements?.genderPreference || ''}
                onChange={(e) => updateCaregiverRequirement('genderPreference', e.target.value)}
                className="form-select"
              >
                <option value="">No preference</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>

            {/* Age Preference */}
            <div className="form-group">
              <label>Age Preference (Optional)</label>
              <select
                value={careNeeds.caregiverRequirements?.agePreference || ''}
                onChange={(e) => updateCaregiverRequirement('agePreference', e.target.value)}
                className="form-select"
              >
                <option value="">No preference</option>
                <option value="Young Adult (18-30)">Young Adult (18-30)</option>
                <option value="Adult (30-50)">Adult (30-50)</option>
                <option value="Mature Adult (50+)">Mature Adult (50+)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {(careNeeds.caregiverRequirements?.certifications?.length > 0 || 
        careNeeds.caregiverRequirements?.languages?.length > 0 ||
        careNeeds.caregiverRequirements?.experienceLevel) && (
        <div className="preferences-summary">
          <h3>Your Caregiver Preferences Summary</h3>
          <div className="summary-grid">
            {careNeeds.caregiverRequirements?.experienceLevel && (
              <div className="summary-item">
                <strong>Experience:</strong> {careNeeds.caregiverRequirements.experienceLevel}
              </div>
            )}
            {careNeeds.caregiverRequirements?.certifications?.length > 0 && (
              <div className="summary-item">
                <strong>Certifications:</strong> {careNeeds.caregiverRequirements.certifications.length} selected
              </div>
            )}
            {careNeeds.caregiverRequirements?.languages?.length > 0 && (
              <div className="summary-item">
                <strong>Languages:</strong> {careNeeds.caregiverRequirements.languages.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tab-footer">
        <div className="help-text">
          <p>💡 <strong>Tip:</strong> More specific preferences help us find better caregiver matches, but may reduce the number of available options.</p>
        </div>
      </div>
    </div>
  );
};

export default CaregiverPreferencesTab;
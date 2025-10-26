import { useState, useEffect } from 'react';
import './CareNeedsSettings.css';
import { toast } from 'react-toastify';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';
import CaregiverRecommendations from './CaregiverRecommendations';

/**
 * CareNeedsSettings component for managing client care needs
 * Allows clients to specify their care requirements in detail
 */
const CareNeedsSettings = () => {
  const [careNeeds, setCareNeeds] = useState({
    primaryCondition: '',
    additionalConditions: [],
    mobilityLevel: '',
    assistanceLevel: '',
    dietaryRestrictions: [],
    medicationManagement: false,
    frequentMonitoring: false,
    specialEquipment: [],
    additionalNotes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Dropdown options
  const conditionOptions = [
    'Alzheimer\'s/Dementia',
    'Arthritis',
    'Cancer',
    'Diabetes',
    'Heart Disease',
    'Hypertension',
    'Mobility Issues',
    'Parkinson\'s',
    'Post-Surgery',
    'Respiratory Issues',
    'Stroke Recovery',
    'Other'
  ];

  const mobilityOptions = [
    'Independent',
    'Uses Walking Aid',
    'Wheelchair - Partial',
    'Wheelchair - Full Time',
    'Bedridden - Partial',
    'Bedridden - Full Time'
  ];

  const assistanceLevelOptions = [
    'Minimal - Just checking in',
    'Low - Help with some tasks',
    'Moderate - Regular assistance',
    'High - Consistent monitoring',
    'Complete - Full-time care'
  ];

  const dietaryOptions = [
    'Diabetic',
    'Low Sodium',
    'Gluten-Free',
    'Vegetarian',
    'Vegan',
    'Kosher',
    'Halal',
    'Dairy-Free',
    'Nut-Free',
    'Soft Foods',
    'Pureed Foods',
    'Tube Feeding'
  ];

  const equipmentOptions = [
    'Hospital Bed',
    'Oxygen Equipment',
    'Lift',
    'Wheelchair Ramp',
    'Bathroom Modifications',
    'Monitoring Devices',
    'Feeding Tube Equipment',
    'Specialized Mattress',
    'None'
  ];

  // Load care needs from service on component mount
  useEffect(() => {
    const fetchCareNeeds = async () => {
      try {
        setIsLoading(true);
        
        // Get care needs from our service
        const needs = await ClientCareNeedsService.getCareNeeds();
        setCareNeeds(needs);
        
        // Show recommendations if primary condition is already set
        if (needs && needs.primaryCondition) {
          setShowRecommendations(true);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading care needs:', err);
        setError('Failed to load your care needs. Please try again.');
        toast.error('Failed to load care needs');
        setIsLoading(false);
      }
    };
    
    fetchCareNeeds();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCareNeeds(prev => ({
      ...prev,
      [name]: value
    }));
    setUnsavedChanges(true);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCareNeeds(prev => ({
      ...prev,
      [name]: checked
    }));
    setUnsavedChanges(true);
  };

  // Handle multi-select changes
  const handleMultiSelect = (name, item) => {
    setCareNeeds(prev => {
      // Check if the item is already selected
      const currentItems = prev[name];
      let updatedItems;
      
      if (currentItems.includes(item)) {
        // Remove item if already selected
        updatedItems = currentItems.filter(i => i !== item);
      } else {
        // Add item if not already selected
        updatedItems = [...currentItems, item];
      }
      
      return {
        ...prev,
        [name]: updatedItems
      };
    });
    
    setUnsavedChanges(true);
  };

  // Validate care needs before saving
  const validateCareNeeds = () => {
    // Check if primary condition is selected
    if (!careNeeds.primaryCondition) {
      setError('Please select a primary condition');
      return false;
    }
    
    // Check if mobility level is selected
    if (!careNeeds.mobilityLevel) {
      setError('Please select a mobility level');
      return false;
    }
    
    // Check if assistance level is selected
    if (!careNeeds.assistanceLevel) {
      setError('Please select an assistance level');
      return false;
    }
    
    return true;
  };

  // Save care needs
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Validate care needs before saving
      if (!validateCareNeeds()) {
        setIsLoading(false);
        return;
      }
      
      // Save care needs using our service
      await ClientCareNeedsService.saveCareNeeds(careNeeds);
      
      setSuccess('Your care needs have been saved successfully!');
      toast.success('Care needs updated successfully!');
      setUnsavedChanges(false);
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
      // Show recommendations after successful save
      setShowRecommendations(true);
    } catch (err) {
      console.error('Error saving care needs:', err);
      setError('Failed to save changes. Please try again.');
      toast.error('Failed to save changes');
      setIsLoading(false);
    }
  };

  // Reset care needs to last saved state
  const handleReset = () => {
    const storedNeeds = localStorage.getItem('careNeeds');
    
    if (storedNeeds) {
      setCareNeeds(JSON.parse(storedNeeds));
    } else {
      // Reset to default values
      setCareNeeds({
        primaryCondition: '',
        additionalConditions: [],
        mobilityLevel: '',
        assistanceLevel: '',
        dietaryRestrictions: [],
        medicationManagement: false,
        frequentMonitoring: false,
        specialEquipment: [],
        additionalNotes: ''
      });
    }
    
    setUnsavedChanges(false);
    setError('');
    setSuccess('');
    setShowRecommendations(false);
  };

  // Prevent navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // This is needed for Chrome
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

  return (
    <div className="care-needs-settings">
      <h1>Care Needs Settings</h1>
      <p className="settings-description">
        Specify your care requirements to help us match you with the most suitable caregivers.
      </p>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="care-needs-form">
        {/* Primary Condition */}
        <div className="form-group">
          <label htmlFor="primaryCondition">Primary Condition</label>
          <select 
            id="primaryCondition"
            name="primaryCondition"
            value={careNeeds.primaryCondition}
            onChange={handleChange}
          >
            <option value="">Select Primary Condition</option>
            {conditionOptions.map((condition, index) => (
              <option key={index} value={condition}>{condition}</option>
            ))}
          </select>
        </div>
        
        {/* Additional Conditions */}
        <div className="form-group">
          <label>Additional Conditions</label>
          <div className="checkbox-group">
            {conditionOptions.map((condition, index) => (
              condition !== careNeeds.primaryCondition && (
                <div key={index} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`condition-${index}`}
                    checked={careNeeds.additionalConditions.includes(condition)}
                    onChange={() => handleMultiSelect('additionalConditions', condition)}
                  />
                  <label htmlFor={`condition-${index}`}>{condition}</label>
                </div>
              )
            ))}
          </div>
        </div>
        
        {/* Mobility Level */}
        <div className="form-group">
          <label htmlFor="mobilityLevel">Mobility Level</label>
          <select 
            id="mobilityLevel"
            name="mobilityLevel"
            value={careNeeds.mobilityLevel}
            onChange={handleChange}
          >
            <option value="">Select Mobility Level</option>
            {mobilityOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        {/* Assistance Level */}
        <div className="form-group">
          <label htmlFor="assistanceLevel">Assistance Level</label>
          <select 
            id="assistanceLevel"
            name="assistanceLevel"
            value={careNeeds.assistanceLevel}
            onChange={handleChange}
          >
            <option value="">Select Assistance Level</option>
            {assistanceLevelOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        {/* Dietary Restrictions */}
        <div className="form-group">
          <label>Dietary Restrictions</label>
          <div className="checkbox-group">
            {dietaryOptions.map((option, index) => (
              <div key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`diet-${index}`}
                  checked={careNeeds.dietaryRestrictions.includes(option)}
                  onChange={() => handleMultiSelect('dietaryRestrictions', option)}
                />
                <label htmlFor={`diet-${index}`}>{option}</label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Medication Management */}
        <div className="form-group">
          <div className="checkbox-item single-option">
            <input
              type="checkbox"
              id="medicationManagement"
              name="medicationManagement"
              checked={careNeeds.medicationManagement}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="medicationManagement">Requires Medication Management</label>
          </div>
        </div>
        
        {/* Frequent Monitoring */}
        <div className="form-group">
          <div className="checkbox-item single-option">
            <input
              type="checkbox"
              id="frequentMonitoring"
              name="frequentMonitoring"
              checked={careNeeds.frequentMonitoring}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="frequentMonitoring">Requires Frequent Monitoring</label>
          </div>
        </div>
        
        {/* Special Equipment */}
        <div className="form-group">
          <label>Special Equipment</label>
          <div className="checkbox-group">
            {equipmentOptions.map((option, index) => (
              <div key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`equipment-${index}`}
                  checked={careNeeds.specialEquipment.includes(option)}
                  onChange={() => handleMultiSelect('specialEquipment', option)}
                />
                <label htmlFor={`equipment-${index}`}>{option}</label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Additional Notes */}
        <div className="form-group">
          <label htmlFor="additionalNotes">Additional Notes</label>
          <textarea
            id="additionalNotes"
            name="additionalNotes"
            value={careNeeds.additionalNotes}
            onChange={handleChange}
            rows="4"
            placeholder="Any additional requirements or information about care needs"
          />
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </button>
          <button 
            type="button" 
            className="save-button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      
      {/* Caregiver Recommendations */}
      <CaregiverRecommendations 
        careNeeds={careNeeds} 
        visible={showRecommendations} 
      />
    </div>
  );
};

export default CareNeedsSettings;

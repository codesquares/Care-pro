import { useState, useEffect } from 'react';
import './CareNeedsSettings.css';
import { toast } from 'react-toastify';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';
import CaregiverRecommendations from './CaregiverRecommendations';
import CareNeedsWizard from './CareNeedsWizard';

/**
 * CareNeedsSettings component for managing client care needs
 * Allows clients to specify their care requirements in detail
 */
const CareNeedsSettings = () => {
  // Initialize all hooks first (before any conditional logic)
  const [careNeeds, setCareNeeds] = useState({
    // Service categories (always required first)
    serviceCategories: [],
    specificServices: {},
    
    // Medical needs (only for medical-related categories)
    medicalNeeds: {
      primaryCondition: '',
      additionalConditions: [],
      mobilityLevel: '',
      assistanceLevel: '',
      dietaryRestrictions: [],
      medicationManagement: false,
      frequentMonitoring: false,
      specialEquipment: [],
      additionalNotes: ''
    },
    
    // Child care specific needs
    childCareNeeds: {
      ageRanges: [],
      numberOfChildren: '',
      specialNeeds: [],
      activitiesPreferences: [],
      supervisionLevel: '',
      emergencyContacts: '',
      additionalNotes: ''
    },
    
    // Pet care specific needs
    petCareNeeds: {
      petTypes: [],
      numberOfPets: '',
      petSizes: [],
      specialCareRequirements: [],
      exerciseNeeds: [],
      dietaryRequirements: [],
      behavioralNotes: '',
      additionalNotes: ''
    },
    
    // Home care specific needs
    homeCareNeeds: {
      homeSize: '',
      focusAreas: [],
      serviceFrequency: '',
      specialEquipment: [],
      accessibilityNeeds: [],
      additionalNotes: ''
    },
    
    // Therapy & wellness specific needs
    therapyNeeds: {
      therapyTypes: [],
      currentLimitations: [],
      therapyGoals: [],
      equipmentAvailable: [],
      previousExperience: '',
      additionalNotes: ''
    },
    
    // Caregiver requirements (always visible)
    caregiverRequirements: {
      certifications: [],
      experienceLevel: '',
      languages: [],
      personalityTraits: [],
      availability: [],
      specialSkills: []
    }
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

  // Service categories and their specific services
  const serviceCategories = {
    "Adult Care": [
      "Companionship", "Meal preparation", "Mobility assistance", "Medication reminders",
      "Bathing and grooming", "Dressing assistance", "Toileting and hygiene support",
      "Incontinence care", "Overnight supervision", "Chronic illness management"
    ],
    "Post Surgery Care": [
      "Wound care", "Medication management", "Post-surgery care",
      "Mobility assistance", "Home safety assessment", "Feeding assistance"
    ],
    "Child Care": [
      "Respite", "Babysitting", "Meal preparation", "Recreational activities assistance",
      "Emotional support and check-ins"
    ],
    "Pet Care": [
      "Pet minding", "Dog walking", "Feeding assistance", "Companionship"
    ],
    "Home Care": [
      "Light housekeeping", "Cleaning", "Cooking", "Home safety assessment",
      "Errands and shopping", "Transportation to appointments"
    ],
    "Special Needs Care": [
      "Dementia care", "Autism support", "Behavioral support", "Disability support services",
      "Assistive device training", "Language or communication support"
    ],
    "Medical Support": [
      "Nursing care", "Medication reminders", "Medical appointment coordination",
      "Palliative care support", "Chronic illness management"
    ],
    "Mobility Support": [
      "Mobility assistance", "Fall prevention monitoring", "Exercise and fitness support",
      "Assistive device training", "Transportation to appointments"
    ],
    "Therapy & Wellness": [
      "Physical therapy support", "Cognitive stimulation activities", "Emotional support and check-ins",
      "Recreational activities assistance", "Acupuncture", "Massage therapy"
    ],
    "Palliative": [
      "Palliative care support", "Overnight supervision", "Emotional support and check-ins",
      "Home safety assessment"
    ]
  };

  // Caregiver requirement options
  const certificationOptions = [
    'CNA (Certified Nursing Assistant)',
    'RN (Registered Nurse)',
    'LPN (Licensed Practical Nurse)',
    'First Aid Certified',
    'CPR Certified',
    'AED Certified',
    'Home Health Aide',
    'Physical Therapy Assistant',
    'Occupational Therapy Assistant',
    'Medication Administration Certified',
    'Dementia Care Specialist',
    'Hospice Care Certified'
  ];

  const experienceLevelOptions = [
    'Entry Level (0-1 years)',
    'Some Experience (1-3 years)',
    'Experienced (3-5 years)',
    'Very Experienced (5-10 years)',
    'Expert (10+ years)'
  ];

  const languageOptions = [
    'English', 'Spanish', 'French', 'Yoruba', 'Hausa', 'Igbo', 
    'Pidgin English', 'Arabic', 'Portuguese', 'Mandarin'
  ];

  const personalityTraitOptions = [
    'Patient', 'Gentle', 'Energetic', 'Calm', 'Cheerful', 
    'Compassionate', 'Reliable', 'Detail-oriented', 'Flexible', 'Professional'
  ];

  const availabilityOptions = [
    'Weekdays', 'Weekends', 'Evenings', 'Nights', 'Holidays', 
    '24/7 Available', 'Emergency On-call', 'Flexible Schedule'
  ];

  const specialSkillOptions = [
    'Wound care', 'IV therapy', 'Tube feeding', 'Catheter care', 
    'Tracheostomy care', 'Dialysis support', 'Ventilator care', 
    'Mental health support', 'Autism spectrum support', 'Sign language'
  ];

  // Category-specific options
  const childAgeRanges = [
    'Newborn (0-3 months)', 'Infant (3-12 months)', 'Toddler (1-3 years)', 
    'Preschool (3-5 years)', 'School Age (5-12 years)', 'Teenager (13-17 years)'
  ];

  const childSupervisionLevels = [
    'Full-time supervision', 'Partial supervision', 'Check-ins only', 
    'After-school care', 'Overnight care', 'Emergency backup'
  ];

  const childActivitiesOptions = [
    'Educational activities', 'Arts and crafts', 'Outdoor play', 'Sports', 
    'Music/dance', 'Reading', 'Screen time management', 'Homework help'
  ];

  const petTypes = [
    'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Reptile', 'Other'
  ];

  const petSizes = [
    'Small (under 25 lbs)', 'Medium (25-60 lbs)', 'Large (60-100 lbs)', 'Extra Large (over 100 lbs)'
  ];

  const petExerciseNeeds = [
    'High energy (2+ hours daily)', 'Moderate (1-2 hours daily)', 
    'Low (30 minutes daily)', 'Minimal (indoor only)', 'Special needs assistance'
  ];

  const homeSizes = [
    'Studio/1 bedroom', '2-3 bedrooms', '4-5 bedrooms', '6+ bedrooms', 'Multi-story home'
  ];

  const homeFocusAreas = [
    'Kitchen', 'Bathrooms', 'Living areas', 'Bedrooms', 'Laundry', 
    'Outdoor areas', 'Garage', 'Basement', 'Stairs'
  ];

  const therapyTypes = [
    'Physical therapy', 'Occupational therapy', 'Speech therapy', 'Massage therapy',
    'Acupuncture', 'Mental health support', 'Cognitive therapy', 'Recreational therapy'
  ];

  const therapyGoals = [
    'Pain management', 'Mobility improvement', 'Strength building', 'Balance training',
    'Speech improvement', 'Cognitive enhancement', 'Stress relief', 'Recovery support'
  ];

  // Helper functions to determine which sections to show
  const showMedicalNeeds = () => {
    const medicalCategories = ['Adult Care', 'Post Surgery Care', 'Special Needs Care', 'Medical Support', 'Mobility Support', 'Palliative'];
    return careNeeds.serviceCategories?.some(category => medicalCategories.includes(category)) || false;
  };

  const showChildCareNeeds = () => {
    return careNeeds.serviceCategories?.includes('Child Care') || false;
  };

  const showPetCareNeeds = () => {
    return careNeeds.serviceCategories?.includes('Pet Care') || false;
  };

  const showHomeCareNeeds = () => {
    return careNeeds.serviceCategories?.includes('Home Care') || false;
  };

  const showTherapyNeeds = () => {
    return careNeeds.serviceCategories?.includes('Therapy & Wellness') || false;
  };

  // Helper function to check if "Others" text input should be shown
  const shouldShowOthersInput = (category, field) => {
    const otherFieldName = `${field}Other`;
    const otherValue = category ? careNeeds[category]?.[otherFieldName] : careNeeds.caregiverRequirements?.[otherFieldName];
    return otherValue !== undefined && otherValue !== '';
  };

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

  // For testing the new wizard - you can toggle this flag
  const USE_NEW_WIZARD = true;
  
  if (USE_NEW_WIZARD) {
    return <CareNeedsWizard />;
  }

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
      const currentItems = prev[name] || [];
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

  // Handle service category selection
  const handleServiceCategoryChange = (category) => {
    setCareNeeds(prev => {
      const currentCategories = prev.serviceCategories || [];
      const currentSpecificServices = { ...prev.specificServices };
      
      let updatedCategories;
      if (currentCategories.includes(category)) {
        // Remove category and its specific services
        updatedCategories = currentCategories.filter(c => c !== category);
        delete currentSpecificServices[category];
      } else {
        // Add category
        updatedCategories = [...currentCategories, category];
        currentSpecificServices[category] = [];
      }
      
      return {
        ...prev,
        serviceCategories: updatedCategories,
        specificServices: currentSpecificServices
      };
    });
    
    setUnsavedChanges(true);
  };

  // Handle specific service selection within a category
  const handleSpecificServiceChange = (category, service) => {
    setCareNeeds(prev => {
      const currentServices = prev.specificServices[category] || [];
      let updatedServices;
      
      if (currentServices.includes(service)) {
        updatedServices = currentServices.filter(s => s !== service);
      } else {
        updatedServices = [...currentServices, service];
      }
      
      return {
        ...prev,
        specificServices: {
          ...prev.specificServices,
          [category]: updatedServices
        }
      };
    });
    
    setUnsavedChanges(true);
  };

  // Handle caregiver requirements changes
  const handleCaregiverRequirementChange = (field, value) => {
    setCareNeeds(prev => {
      const currentValues = prev.caregiverRequirements?.[field] || [];
      let updatedValues;
      
      if (Array.isArray(currentValues)) {
        // For multi-select fields
        if (currentValues.includes(value)) {
          updatedValues = currentValues.filter(v => v !== value);
        } else {
          updatedValues = [...currentValues, value];
        }
      } else {
        // For single-select fields
        updatedValues = value;
      }
      
      return {
        ...prev,
        caregiverRequirements: {
          ...prev.caregiverRequirements,
          [field]: updatedValues
        }
      };
    });
    
    setUnsavedChanges(true);
  };

  // Handle category-specific needs changes
  const handleCategorySpecificChange = (category, field, value) => {
    setCareNeeds(prev => {
      const currentValues = prev[category]?.[field] || [];
      let updatedValues;
      
      if (Array.isArray(currentValues)) {
        // For multi-select fields
        if (currentValues.includes(value)) {
          updatedValues = currentValues.filter(v => v !== value);
        } else {
          updatedValues = [...currentValues, value];
        }
      } else {
        // For single-select fields
        updatedValues = value;
      }
      
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: updatedValues
        }
      };
    });
    
    setUnsavedChanges(true);
  };

  // Handle text input changes for category-specific needs
  const handleCategorySpecificTextChange = (category, field, value) => {
    setCareNeeds(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    
    setUnsavedChanges(true);
  };

  // Validate care needs before saving
  const validateCareNeeds = () => {
    // Check if at least one service category is selected
    if (!careNeeds.serviceCategories || careNeeds.serviceCategories.length === 0) {
      setError('Please select at least one service category');
      return false;
    }

    // Validate medical needs if medical categories are selected
    if (showMedicalNeeds()) {
      if (!careNeeds.medicalNeeds?.primaryCondition) {
        setError('Please select a primary condition for medical care services');
        return false;
      }
      if (!careNeeds.medicalNeeds?.mobilityLevel) {
        setError('Please select a mobility level for medical care services');
        return false;
      }
      if (!careNeeds.medicalNeeds?.assistanceLevel) {
        setError('Please select an assistance level for medical care services');
        return false;
      }
    }

    // Validate child care needs if child care is selected
    if (showChildCareNeeds()) {
      if (!careNeeds.childCareNeeds?.ageRanges || careNeeds.childCareNeeds.ageRanges.length === 0) {
        setError('Please select age range(s) for child care services');
        return false;
      }
      if (!careNeeds.childCareNeeds?.supervisionLevel) {
        setError('Please select supervision level for child care services');
        return false;
      }
    }

    // Validate pet care needs if pet care is selected
    if (showPetCareNeeds()) {
      if (!careNeeds.petCareNeeds?.petTypes || careNeeds.petCareNeeds.petTypes.length === 0) {
        setError('Please select pet type(s) for pet care services');
        return false;
      }
      if (!careNeeds.petCareNeeds?.numberOfPets) {
        setError('Please specify number of pets for pet care services');
        return false;
      }
    }

    // Validate home care needs if home care is selected
    if (showHomeCareNeeds()) {
      if (!careNeeds.homeCareNeeds?.homeSize) {
        setError('Please select home size for home care services');
        return false;
      }
      if (!careNeeds.homeCareNeeds?.focusAreas || careNeeds.homeCareNeeds.focusAreas.length === 0) {
        setError('Please select focus areas for home care services');
        return false;
      }
    }

    // Validate therapy needs if therapy & wellness is selected
    if (showTherapyNeeds()) {
      if (!careNeeds.therapyNeeds?.therapyTypes || careNeeds.therapyNeeds.therapyTypes.length === 0) {
        setError('Please select therapy type(s) for therapy & wellness services');
        return false;
      }
    }

    return true;
  };

  // Save care needs
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('=== CARE NEEDS SAVE DEBUG ===');
      console.log('1. careNeeds object before validation:', JSON.stringify(careNeeds, null, 2));
      
      // Validate care needs before saving
      if (!validateCareNeeds()) {
        console.log('2. Validation failed, aborting save');
        setIsLoading(false);
        return;
      }
      
      console.log('2. Validation passed, proceeding with save');
      console.log('3. careNeeds object being sent to service:', JSON.stringify(careNeeds, null, 2));
      
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

  return (
    <div className="care-needs-settings">
      <h1>Care Needs Settings</h1>
      <p className="settings-description">
        Specify your care requirements to help us match you with the most suitable caregivers.
      </p>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="care-needs-form">
        {/* Service Categories - Always shown first */}
        <div className="form-group">
          <label>Service Categories Needed</label>
          <p className="form-description">Select the types of care services you need (choose all that apply)</p>
          <div className="checkbox-grid">
            {Object.keys(serviceCategories).map(category => (
              <div key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                  checked={careNeeds.serviceCategories?.includes(category) || false}
                  onChange={() => handleServiceCategoryChange(category)}
                />
                <label htmlFor={`category-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Show message if no categories selected */}
        {(!careNeeds.serviceCategories || careNeeds.serviceCategories.length === 0) && (
          <div className="info-message">
            <p>👆 Please select at least one service category above to continue setting up your care needs.</p>
          </div>
        )}

        {/* Specific Services for Selected Categories */}
        {careNeeds.serviceCategories && careNeeds.serviceCategories.map(category => (
          <div key={`services-${category}`} className="form-group">
            <label>Specific {category} Services</label>
            <p className="form-description">Select the specific services you need in {category}</p>
            <div className="checkbox-grid">
              {serviceCategories[category].map(service => (
                <div key={service} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`service-${category}-${service.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={(careNeeds.specificServices[category] || []).includes(service)}
                    onChange={() => handleSpecificServiceChange(category, service)}
                  />
                  <label htmlFor={`service-${category}-${service.replace(/\s+/g, '-').toLowerCase()}`}>
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Caregiver Requirements - Always shown */}
        <div className="form-group">
          <label>Caregiver Requirements</label>
          <p className="form-description">Specify your preferences for caregiver qualifications and attributes</p>
        </div>

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
                  onChange={() => handleCaregiverRequirementChange('certifications', cert)}
                />
                <label htmlFor={`cert-${cert.replace(/\s+/g, '-').toLowerCase()}`}>
                  {cert}
                </label>
              </div>
            ))}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="cert-others"
                checked={shouldShowOthersInput(null, 'certifications')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleCaregiverRequirementChange('certificationsOther', '');
                  } else {
                    handleCaregiverRequirementChange('certificationsOther', ' ');
                  }
                }}
              />
              <label htmlFor="cert-others">Others (specify)</label>
            </div>
          </div>
          
          {shouldShowOthersInput(null, 'certifications') && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Please specify other required certifications..."
                value={careNeeds.caregiverRequirements?.certificationsOther?.trim() || ''}
                onChange={(e) => handleCaregiverRequirementChange('certificationsOther', e.target.value)}
                className="form-control"
              />
            </div>
          )}
        </div>

        {/* Experience Level */}
        <div className="form-group">
          <label htmlFor="experienceLevel">Preferred Experience Level</label>
          <select
            id="experienceLevel"
            value={careNeeds.caregiverRequirements?.experienceLevel || ''}
            onChange={(e) => handleCaregiverRequirementChange('experienceLevel', e.target.value)}
          >
            <option value="">Select experience level</option>
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
                  onChange={() => handleCaregiverRequirementChange('languages', language)}
                />
                <label htmlFor={`lang-${language.replace(/\s+/g, '-').toLowerCase()}`}>
                  {language}
                </label>
              </div>
            ))}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="lang-others"
                checked={shouldShowOthersInput(null, 'languages')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleCaregiverRequirementChange('languagesOther', '');
                  } else {
                    handleCaregiverRequirementChange('languagesOther', ' '); // Set non-empty to show input
                  }
                }}
              />
              <label htmlFor="lang-others">Others (specify)</label>
            </div>
          </div>
          
          {shouldShowOthersInput(null, 'languages') && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Please specify other languages..."
                value={careNeeds.caregiverRequirements?.languagesOther?.trim() || ''}
                onChange={(e) => handleCaregiverRequirementChange('languagesOther', e.target.value)}
                className="form-control"
              />
            </div>
          )}
        </div>

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
                  onChange={() => handleCaregiverRequirementChange('personalityTraits', trait)}
                />
                <label htmlFor={`trait-${trait.replace(/\s+/g, '-').toLowerCase()}`}>
                  {trait}
                </label>
              </div>
            ))}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="traits-others"
                checked={shouldShowOthersInput(null, 'personalityTraits')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleCaregiverRequirementChange('personalityTraitsOther', '');
                  } else {
                    handleCaregiverRequirementChange('personalityTraitsOther', ' ');
                  }
                }}
              />
              <label htmlFor="traits-others">Others (specify)</label>
            </div>
          </div>
          
          {shouldShowOthersInput(null, 'personalityTraits') && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Please specify other personality traits..."
                value={careNeeds.caregiverRequirements?.personalityTraitsOther?.trim() || ''}
                onChange={(e) => handleCaregiverRequirementChange('personalityTraitsOther', e.target.value)}
                className="form-control"
              />
            </div>
          )}
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
                  onChange={() => handleCaregiverRequirementChange('availability', availability)}
                />
                <label htmlFor={`avail-${availability.replace(/\s+/g, '-').toLowerCase()}`}>
                  {availability}
                </label>
              </div>
            ))}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="availability-others"
                checked={shouldShowOthersInput(null, 'availability')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleCaregiverRequirementChange('availabilityOther', '');
                  } else {
                    handleCaregiverRequirementChange('availabilityOther', ' ');
                  }
                }}
              />
              <label htmlFor="availability-others">Others (specify)</label>
            </div>
          </div>
          
          {shouldShowOthersInput(null, 'availability') && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Please specify other availability requirements..."
                value={careNeeds.caregiverRequirements?.availabilityOther?.trim() || ''}
                onChange={(e) => handleCaregiverRequirementChange('availabilityOther', e.target.value)}
                className="form-control"
              />
            </div>
          )}
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
                  onChange={() => handleCaregiverRequirementChange('specialSkills', skill)}
                />
                <label htmlFor={`skill-${skill.replace(/\s+/g, '-').toLowerCase()}`}>
                  {skill}
                </label>
              </div>
            ))}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="skills-others"
                checked={shouldShowOthersInput(null, 'specialSkills')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    handleCaregiverRequirementChange('specialSkillsOther', '');
                  } else {
                    handleCaregiverRequirementChange('specialSkillsOther', ' ');
                  }
                }}
              />
              <label htmlFor="skills-others">Others (specify)</label>
            </div>
          </div>
          
          {shouldShowOthersInput(null, 'specialSkills') && (
            <div className="form-group" style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Please specify other required skills..."
                value={careNeeds.caregiverRequirements?.specialSkillsOther?.trim() || ''}
                onChange={(e) => handleCaregiverRequirementChange('specialSkillsOther', e.target.value)}
                className="form-control"
              />
            </div>
          )}
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

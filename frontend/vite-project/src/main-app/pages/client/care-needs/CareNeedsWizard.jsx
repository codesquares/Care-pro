import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientCareNeedsService from '../../../services/clientCareNeedsService';
import './CareNeedsWizard.css';

// Tab Components
import ServiceSelectionTab from './tabs/ServiceSelectionTab';
import SpecificNeedsTab from './tabs/SpecificNeedsTab';
import CaregiverPreferencesTab from './tabs/CaregiverPreferencesTab';
import ReviewAndSaveTab from './tabs/ReviewAndSaveTab';

const CareNeedsWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [currentTab, setCurrentTab] = useState(0);
  const [careNeeds, setCareNeeds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [completedTabs, setCompletedTabs] = useState(new Set());

  const tabs = [
    {
      id: 0,
      title: 'Service Selection',
      subtitle: 'What services do you need?',
      icon: '🏥',
      required: true
    },
    {
      id: 1,
      title: 'Specific Needs',
      subtitle: 'Tell us about your specific requirements',
      icon: '📋',
      required: false
    },
    {
      id: 2,
      title: 'Caregiver Preferences',
      subtitle: 'Your caregiver requirements',
      icon: '👤',
      required: false
    },
    {
      id: 3,
      title: 'Review & Save',
      subtitle: 'Review and confirm your preferences',
      icon: '✅',
      required: true
    }
  ];

  // Load care needs on component mount
  useEffect(() => {
    const fetchCareNeeds = async () => {
      try {
        setIsLoading(true);
        const needs = await ClientCareNeedsService.getCareNeeds();
        setCareNeeds(needs);
        
        // Mark tabs as completed based on existing data
        updateCompletedTabs(needs);
        
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

  // Update completed tabs based on data
  const updateCompletedTabs = (needs) => {
    const completed = new Set();
    
    // Tab 0: Service Selection - required
    if (needs.serviceCategories && needs.serviceCategories.length > 0) {
      completed.add(0);
    }
    
    // Tab 1: Specific Needs - conditional
    const hasSpecificNeeds = hasAnySpecificNeeds(needs);
    if (hasSpecificNeeds) {
      completed.add(1);
    }
    
    // Tab 2: Caregiver Preferences - optional but mark if has data
    const hasCaregiverPrefs = hasAnyCaregiverPreferences(needs);
    if (hasCaregiverPrefs) {
      completed.add(2);
    }
    
    setCompletedTabs(completed);
  };

  // Helper functions to check completion
  const hasAnySpecificNeeds = (needs) => {
    return (
      (needs.medicalNeeds && Object.values(needs.medicalNeeds).some(val => 
        Array.isArray(val) ? val.length > 0 : val !== '' && val !== false
      )) ||
      (needs.childCareNeeds && Object.values(needs.childCareNeeds).some(val => 
        Array.isArray(val) ? val.length > 0 : val !== ''
      )) ||
      (needs.petCareNeeds && Object.values(needs.petCareNeeds).some(val => 
        Array.isArray(val) ? val.length > 0 : val !== ''
      )) ||
      (needs.homeCareNeeds && Object.values(needs.homeCareNeeds).some(val => 
        Array.isArray(val) ? val.length > 0 : val !== ''
      )) ||
      (needs.therapyNeeds && Object.values(needs.therapyNeeds).some(val => 
        Array.isArray(val) ? val.length > 0 : val !== ''
      ))
    );
  };

  const hasAnyCaregiverPreferences = (needs) => {
    if (!needs.caregiverRequirements) return false;
    return Object.values(needs.caregiverRequirements).some(val => 
      Array.isArray(val) ? val.length > 0 : val !== ''
    );
  };

  // Validate current tab
  const validateCurrentTab = () => {
    const errors = {};
    
    if (currentTab === 0) {
      // Service Selection validation
      if (!careNeeds.serviceCategories || careNeeds.serviceCategories.length === 0) {
        errors.serviceCategories = 'Please select at least one service category';
      }
    }
    
    if (currentTab === 1) {
      // Specific needs validation based on selected services
      if (careNeeds.serviceCategories?.some(cat => 
        ['Adult Care', 'Post Surgery Care', 'Special Needs Care', 'Medical Support', 'Mobility Support', 'Palliative'].includes(cat)
      )) {
        if (!careNeeds.medicalNeeds?.primaryCondition) {
          errors.primaryCondition = 'Please select a primary condition for medical care services';
        }
        if (!careNeeds.medicalNeeds?.assistanceLevel) {
          errors.assistanceLevel = 'Please select an assistance level for medical care services';
        }
      }
      
      if (careNeeds.serviceCategories?.includes('Child Care')) {
        if (!careNeeds.childCareNeeds?.ageRanges || careNeeds.childCareNeeds.ageRanges.length === 0) {
          errors.ageRanges = 'Please select age range(s) for child care services';
        }
        if (!careNeeds.childCareNeeds?.supervisionLevel) {
          errors.supervisionLevel = 'Please select supervision level for child care services';
        }
      }
      
      if (careNeeds.serviceCategories?.includes('Pet Care')) {
        if (!careNeeds.petCareNeeds?.petTypes || careNeeds.petCareNeeds.petTypes.length === 0) {
          errors.petTypes = 'Please select pet type(s) for pet care services';
        }
        if (!careNeeds.petCareNeeds?.numberOfPets) {
          errors.numberOfPets = 'Please specify number of pets for pet care services';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle tab navigation
  const handleTabChange = (tabIndex) => {
    if (tabIndex < currentTab || completedTabs.has(tabIndex)) {
      setCurrentTab(tabIndex);
      setError('');
      setValidationErrors({});
    } else if (tabIndex === currentTab + 1) {
      // Moving forward - validate current tab
      if (validateCurrentTab()) {
        setCurrentTab(tabIndex);
        setError('');
        setValidationErrors({});
        
        // Mark current tab as completed
        const newCompleted = new Set(completedTabs);
        newCompleted.add(currentTab);
        setCompletedTabs(newCompleted);
      }
    }
  };

  // Handle next button
  const handleNext = () => {
    if (validateCurrentTab()) {
      const newCompleted = new Set(completedTabs);
      newCompleted.add(currentTab);
      setCompletedTabs(newCompleted);
      
      if (currentTab < tabs.length - 1) {
        setCurrentTab(currentTab + 1);
      }
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  // Handle data updates
  const updateCareNeeds = (updates) => {
    setCareNeeds(prev => ({ ...prev, ...updates }));
    setUnsavedChanges(true);
    
    // Clear validation errors for updated fields
    const newErrors = { ...validationErrors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setValidationErrors(newErrors);
  };

  // Handle save
  const handleSave = async () => {
    if (!validateCurrentTab()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      await ClientCareNeedsService.saveCareNeeds(careNeeds);
      
      setUnsavedChanges(false);
      toast.success('Care needs saved successfully!');
      
      // Mark final tab as completed
      const newCompleted = new Set(completedTabs);
      newCompleted.add(3);
      setCompletedTabs(newCompleted);
      
      // Navigate back to where the user came from, or default to marketplace
      setTimeout(() => {
        if (returnTo) {
          navigate(returnTo);
        } else {
          // Default: redirect to marketplace with care needs filter
          const filterParams = new URLSearchParams();
          if (careNeeds.serviceCategories && careNeeds.serviceCategories.length > 0) {
            const categorySlug = careNeeds.serviceCategories[0]
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace('&', '');
            filterParams.set('category', categorySlug);
          }
          filterParams.set('matched', 'true');
          navigate(`/marketplace?${filterParams.toString()}`);
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error saving care needs:', err);
      setError('Failed to save care needs. Please try again.');
      toast.error('Failed to save care needs');
    } finally {
      setIsSaving(false);
    }
  };

  // Render current tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your care preferences...</p>
        </div>
      );
    }

    switch (currentTab) {
      case 0:
        return (
          <ServiceSelectionTab
            careNeeds={careNeeds}
            updateCareNeeds={updateCareNeeds}
            validationErrors={validationErrors}
          />
        );
      case 1:
        return (
          <SpecificNeedsTab
            careNeeds={careNeeds}
            updateCareNeeds={updateCareNeeds}
            validationErrors={validationErrors}
          />
        );
      case 2:
        return (
          <CaregiverPreferencesTab
            careNeeds={careNeeds}
            updateCareNeeds={updateCareNeeds}
            validationErrors={validationErrors}
          />
        );
      case 3:
        return (
          <ReviewAndSaveTab
            careNeeds={careNeeds}
            onEdit={setCurrentTab}
            onSave={handleSave}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="care-needs-wizard">
      {/* Header */}
      <div className="wizard-header">
        <button 
          className="wizard-back-btn"
          onClick={() => navigate(returnTo || '/app/client/dashboard')}
        >
          ← Back
        </button>
        <h1>Care Needs Setup</h1>
        <p>Let's set up your care preferences step by step</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentTab + 1) / tabs.length) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">
          Step {currentTab + 1} of {tabs.length}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`tab-button ${
              index === currentTab ? 'active' : ''
            } ${
              completedTabs.has(index) ? 'completed' : ''
            } ${
              index > currentTab && !completedTabs.has(index) ? 'disabled' : ''
            }`}
            onClick={() => handleTabChange(index)}
            disabled={index > currentTab && !completedTabs.has(index)}
          >
            <div className="tab-icon">{tab.icon}</div>
            <div className="tab-content">
              <div className="tab-title">{tab.title}</div>
              <div className="tab-subtitle">{tab.subtitle}</div>
            </div>
            {completedTabs.has(index) && (
              <div className="completion-indicator">✓</div>
            )}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content-container">
        {renderTabContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-navigation">
        <button
          className="nav-button secondary"
          onClick={handlePrevious}
          disabled={currentTab === 0}
        >
          ← Previous
        </button>
        
        <div className="nav-center">
          {unsavedChanges && (
            <span className="unsaved-indicator">
              • Unsaved changes
            </span>
          )}
        </div>
        
        {currentTab < tabs.length - 1 ? (
          <button
            className="nav-button primary"
            onClick={handleNext}
          >
            Next →
          </button>
        ) : (
          <button
            className="nav-button primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CareNeedsWizard;
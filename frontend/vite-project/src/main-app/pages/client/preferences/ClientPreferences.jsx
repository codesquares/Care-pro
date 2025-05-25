import React, { useState, useEffect } from 'react';
import './ClientPreferences.css';
import ClientPreferenceService from '../../../services/clientPreferenceService';

/**
 * ClientPreferences component for managing client service preferences and recommendations
 * This component leverages the clientAI service to provide personalized recommendations
 */
const ClientPreferences = () => {
  const [preferences, setPreferences] = useState({
    serviceType: '',
    location: '',
    schedule: '',
    needs: '',
    caregiverPreferences: {
      gender: '',
      ageRange: '',
      experience: '',
      languages: []
    },
    serviceFrequency: 'as-needed',
    budget: {
      min: '',
      max: ''
    },
    specialRequirements: ''
  });
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const serviceTypes = [
    'Home Care',
    'Elder Care',
    'Child Care',
    'Post-Surgery Care',
    'Special Needs Care',
    'Pet Care',
    'Rehabilitation'
  ];
  
  const locations = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Ibadan',
    'Kano',
    'Enugu',
    'Kaduna'
  ];
  
  const schedules = [
    'Morning (6am - 12pm)',
    'Afternoon (12pm - 6pm)',
    'Evening (6pm - 10pm)',
    'Night (10pm - 6am)',
    'Full Day (8am - 8pm)',
    '24 Hours',
    'Weekends Only',
    'Weekdays Only'
  ];
  
  const experiences = [
    'Any',
    '1+ years',
    '2+ years',
    '5+ years',
    '10+ years'
  ];
  
  const languages = [
    'English',
    'Yoruba',
    'Hausa',
    'Igbo',
    'Pidgin English',
    'French',
    'Arabic'
  ];
  
  // Fetch client's current preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
        if (!userDetails.id) {
          throw new Error("No client ID found in local storage.");
        }
        const clientId = userDetails.id;
        
        // Check for authentication token
        const token = localStorage.getItem("authToken");
        if (!token) {
          setOfflineMode(true);
          console.warn("No authentication token found, operating in offline mode");
        }
        
        // Attempt to fetch preferences from service
        const fetchedPreferences = await ClientPreferenceService.getPreferences(clientId);
        setPreferences(fetchedPreferences);
        
        // Check if we're using local storage (offline mode)
        const storedPreferences = localStorage.getItem(`client_preferences_${clientId}`);
        if (storedPreferences) {
          setOfflineMode(true);
        }
        
        // Get initial recommendations
        const initialRecommendations = await ClientPreferenceService.getRecommendations(
          clientId, 
          fetchedPreferences
        );
        setRecommendations(initialRecommendations);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching client preferences:', err);
        
        // More descriptive error messages based on error type
        if (err.message && err.message.includes('Authentication')) {
          setError('Authentication error: Please log in again to view your preferences.');
        } else if (err.message && err.message.includes('401')) {
          setError('Your session has expired. Please log in again.');
          setOfflineMode(true); // Set to offline mode when auth fails
        } else {
          setError('Failed to load your preferences from the Care Pro system. Using locally stored preferences instead.');
          setOfflineMode(true); // Fall back to offline mode on error
        }
        
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);
  
  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle caregiver preference changes
  const handleCaregiverPreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      caregiverPreferences: {
        ...prev.caregiverPreferences,
        [name]: value
      }
    }));
  };
  
  // Handle language selection
  const handleLanguageToggle = (language) => {
    setPreferences(prev => {
      const currentLanguages = prev.caregiverPreferences.languages || [];
      let newLanguages;
      
      if (currentLanguages.includes(language)) {
        newLanguages = currentLanguages.filter(l => l !== language);
      } else {
        newLanguages = [...currentLanguages, language];
      }
      
      return {
        ...prev,
        caregiverPreferences: {
          ...prev.caregiverPreferences,
          languages: newLanguages
        }
      };
    });
  };
  
  // Handle budget changes
  const handleBudgetChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [name]: value
      }
    }));
  };
  
  // Save preferences
  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
      if (!userDetails.id) {
        throw new Error("No client ID found in local storage.");
      }
      const clientId = userDetails.id;
      
      // Validate preferences before submission
      if (!preferences.serviceType) {
        setError('Please select a service type');
        setLoading(false);
        return;
      }
      
      // Submit preferences to Azure API
      await ClientPreferenceService.savePreferences(clientId, preferences);
      
      // Update recommendations based on new preferences
      const updatedRecommendations = await ClientPreferenceService.getRecommendations(
        clientId,
        preferences
      );
      setRecommendations(updatedRecommendations);
      
      setSuccess('Your preferences have been saved successfully to the Care Pro system!');
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error saving preferences:', err);
      
      // Provide more descriptive error messages based on the error type
      if (err.message && err.message.includes('Authentication')) {
        setError('Authentication error: Please log in again to save your preferences.');
      } else if (err.message && err.message.includes('401')) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message && err.message.includes('400')) {
        setError('Invalid preference data. Please check your inputs and try again.');
      } else if (err.message && err.message.includes('500')) {
        setError('Server error. Our team has been notified. Please try again later.');
      } else {
        setError('Failed to save your preferences to the Care Pro system. Please try again later.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="preferences-container">
      <h1 className="page-title">Service Preferences</h1>
      
      {offlineMode && (
        <div className="offline-banner">
          <i className="fas fa-info-circle"></i>
          <span>You're using offline mode. Your preferences are stored locally on this device.</span>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}
      
      <div className="preferences-content">
        <div className="preferences-form">
          <h2>Care Service Preferences</h2>
          
          {/* Basic Preferences */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="serviceType">Service Type</label>
              <select 
                id="serviceType" 
                name="serviceType" 
                value={preferences.serviceType} 
                onChange={handleInputChange}
              >
                <option value="">Select a service type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Preferred Location</label>
              <select 
                id="location" 
                name="location" 
                value={preferences.location} 
                onChange={handleInputChange}
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="schedule">Preferred Schedule</label>
              <select 
                id="schedule" 
                name="schedule" 
                value={preferences.schedule} 
                onChange={handleInputChange}
              >
                <option value="">Select a schedule</option>
                {schedules.map(schedule => (
                  <option key={schedule} value={schedule}>{schedule}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="serviceFrequency">Service Frequency</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="serviceFrequency" 
                    value="as-needed" 
                    checked={preferences.serviceFrequency === 'as-needed'}
                    onChange={handleInputChange}
                  />
                  <span>As Needed</span>
                </label>
                
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="serviceFrequency" 
                    value="recurring" 
                    checked={preferences.serviceFrequency === 'recurring'}
                    onChange={handleInputChange}
                  />
                  <span>Recurring</span>
                </label>
                
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="serviceFrequency" 
                    value="one-time" 
                    checked={preferences.serviceFrequency === 'one-time'}
                    onChange={handleInputChange}
                  />
                  <span>One-time</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Budget Range */}
          <div className="form-section">
            <h3>Budget Range (NGN)</h3>
            
            <div className="budget-inputs">
              <div className="form-group">
                <label htmlFor="min">Minimum</label>
                <input 
                  type="number"
                  id="min"
                  name="min"
                  value={preferences.budget.min}
                  onChange={handleBudgetChange}
                  placeholder="Min amount"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="max">Maximum</label>
                <input 
                  type="number"
                  id="max"
                  name="max"
                  value={preferences.budget.max}
                  onChange={handleBudgetChange}
                  placeholder="Max amount"
                />
              </div>
            </div>
          </div>
          
          {/* Caregiver Preferences */}
          <div className="form-section">
            <h3>Caregiver Preferences</h3>
            
            <div className="form-group">
              <label htmlFor="gender">Preferred Gender</label>
              <select 
                id="gender" 
                name="gender" 
                value={preferences.caregiverPreferences.gender} 
                onChange={handleCaregiverPreferenceChange}
              >
                <option value="">No preference</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="experience">Experience Level</label>
              <select 
                id="experience" 
                name="experience" 
                value={preferences.caregiverPreferences.experience} 
                onChange={handleCaregiverPreferenceChange}
              >
                <option value="">No preference</option>
                {experiences.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Languages</label>
              <div className="language-options">
                {languages.map(language => (
                  <label key={language} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={preferences.caregiverPreferences.languages?.includes(language) || false}
                      onChange={() => handleLanguageToggle(language)}
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Additional Needs */}
          <div className="form-section">
            <h3>Additional Information</h3>
            
            <div className="form-group">
              <label htmlFor="needs">Specific Care Needs</label>
              <textarea 
                id="needs"
                name="needs"
                value={preferences.needs}
                onChange={handleInputChange}
                placeholder="Describe any specific care needs or requirements you have"
                rows="4"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="specialRequirements">Special Requirements</label>
              <textarea 
                id="specialRequirements"
                name="specialRequirements"
                value={preferences.specialRequirements}
                onChange={handleInputChange}
                placeholder="Any special requirements or instructions for caregivers"
                rows="4"
              ></textarea>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="save-button"
              onClick={handleSavePreferences}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
        
        {/* Recommendations Section */}
        <div className="recommendations-section">
          <h2>Recommended Services</h2>
          
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading recommendations...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="recommendations-grid">
              {recommendations.map(service => (
                <div className="service-card" key={service.id}>
                  <div className="service-image">
                    <img src={service.image || 'https://via.placeholder.com/150'} alt={service.title} />
                  </div>
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <div className="service-provider">
                      <i className="fas fa-user"></i>
                      <span>{service.provider}</span>
                    </div>
                    <div className="service-rating">
                      <i className="fas fa-star"></i>
                      <span>{service.rating} ({service.reviewCount} reviews)</span>
                    </div>
                    <div className="service-price">
                      <i className="fas fa-tag"></i>
                      <span>₦{service.price}/{service.priceUnit}</span>
                    </div>
                    <div className="service-location">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{service.location}</span>
                    </div>
                    <button className="view-service-btn">View Service</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recommendations">
              <i className="fas fa-search"></i>
              <p>No recommendations available. Update your preferences to get personalized suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPreferences;

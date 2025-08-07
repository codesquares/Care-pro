import React, { useState, useEffect } from 'react';
import './ServiceFrequency.css';

const ServiceFrequency = ({ selectedFrequency, onFrequencyChange, service }) => {
  const [validationError, setValidationError] = useState('');

  if (!service) {
    return <div>Loading...</div>;
  }

  // Consolidated price calculation function
  const calculatePriceDetails = (basePrice, frequencyId) => {
    const details = getFrequencyDetails(frequencyId);
    const originalPrice = basePrice * details.visitsPerMonth;
    const discountAmount = originalPrice * (details.discountPercentage / 100);
    const calculatedPrice = originalPrice - discountAmount;
    
    return {
      frequencyId,
      basePrice,
      originalPrice,
      discountAmount,
      calculatedPrice,
      savings: discountAmount,
      visitsPerWeek: details.visitsPerWeek,
      visitsPerMonth: details.visitsPerMonth,
      discountPercentage: details.discountPercentage
    };
  };

  // Legacy calculatePrice function for backward compatibility
  const calculatePrice = (basePrice, frequencyId) => {
    return calculatePriceDetails(basePrice, frequencyId).calculatedPrice;
  };

  const getFrequencyDetails = (frequencyId) => {
    switch(frequencyId) {
      case 'weekly':
        return { visitsPerMonth: 4, discountPercentage: 0, visitsPerWeek: 1 };
      case 'thrice-weekly':
        return { visitsPerMonth: 12, discountPercentage: 5, visitsPerWeek: 3 };
      case 'everyday':
        return { visitsPerMonth: 20, discountPercentage: 20, visitsPerWeek: 5 };
      default:
        return { visitsPerMonth: 4, discountPercentage: 0, visitsPerWeek: 1 };
    }
  };

  const frequencyOptions = [
    {
      id: 'weekly',
      title: `One (1) service a week (4 in a month) - ₦${calculatePrice(service.price, 'weekly').toLocaleString()}`,
      description: 'Your caregiver visits once a week and performs their duty'
    },
    {
      id: 'thrice-weekly',
      title: `3 services a week (12 in a month) - ₦${calculatePrice(service.price, 'thrice-weekly').toLocaleString()} (5% discount)`,
      description: 'Your caregiver visits three times a week and performs their duty, you get this with a 5% discount'
    },
    {
      id: 'everyday',
      title: `Services at least 5 times (>20 in a month) a week - ₦${calculatePrice(service.price, 'everyday').toLocaleString()} (20% discount)`,
      description: 'Your caregiver visits at least 5 times a week and performs their duty, you get this with a 20% discount'
    }
  ];

  // Form validation
  const validateSelection = () => {
    if (!selectedFrequency) {
      setValidationError('Please select a service frequency');
      return false;
    }
    setValidationError('');
    return true;
  };

  // Handle frequency change with enhanced parent communication
  const handleFrequencyChange = (frequencyId) => {
    const priceData = calculatePriceDetails(service.price, frequencyId);
    onFrequencyChange(frequencyId, priceData); // Pass both ID and complete price data
    setValidationError(''); // Clear error when user makes selection
  };

  // Get current selection details for price breakdown
  const currentSelection = selectedFrequency ? getFrequencyDetails(selectedFrequency) : null;
  const currentPriceData = selectedFrequency ? calculatePriceDetails(service.price, selectedFrequency) : null;

  return (
    <div className="service-frequency">
      <h3 className="service-frequency__title">Select Service Frequency</h3>
      
      {/* Validation Error */}
      {validationError && (
        <div className="service-frequency__error">
          {validationError}
        </div>
      )}
      
      {/* Hidden form inputs for parent form submission */}
      <input 
        type="hidden" 
        name="selectedFrequency" 
        value={selectedFrequency || ''} 
      />
      {currentPriceData && (
        <>
          <input 
            type="hidden" 
            name="priceData" 
            value={JSON.stringify(currentPriceData)} 
          />
          <input 
            type="hidden" 
            name="calculatedPrice" 
            value={currentPriceData.calculatedPrice} 
          />
          <input 
            type="hidden" 
            name="basePrice" 
            value={currentPriceData.basePrice} 
          />
          <input 
            type="hidden" 
            name="originalPrice" 
            value={currentPriceData.originalPrice} 
          />
          <input 
            type="hidden" 
            name="savings" 
            value={currentPriceData.savings} 
          />
          <input 
            type="hidden" 
            name="visitsPerMonth" 
            value={currentPriceData.visitsPerMonth} 
          />
          <input 
            type="hidden" 
            name="discountPercentage" 
            value={currentPriceData.discountPercentage} 
          />
          <input 
            type="hidden" 
            name="visitsPerWeek" 
            value={currentPriceData.visitsPerWeek} 
          />
        </>
      )}
      
      <div className="service-frequency__options">
        {frequencyOptions.map((option) => (
          <div 
            key={option.id}
            className={`service-frequency__option ${selectedFrequency === option.id ? 'service-frequency__option--selected' : ''}`}
            onClick={() => handleFrequencyChange(option.id)}
          >
            <div className="service-frequency__option-content">
              <div className="service-frequency__option-title">
                {option.title}
              </div>
              <div className="service-frequency__option-description">
                {option.description}
              </div>
            </div>
            <div className="service-frequency__radio">
              <input 
                type="radio" 
                name="frequency" 
                checked={selectedFrequency === option.id}
                onChange={() => handleFrequencyChange(option.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Price Breakdown Display */}
      {/* {selectedFrequency && currentPriceData && (
        <div className="service-frequency__price-breakdown">
          <h4>Price Breakdown</h4>
          <div className="price-breakdown__details">
            <div className="price-breakdown__row">
              <span>Base Price per Service:</span>
              <span>₦{currentPriceData.basePrice.toLocaleString()}</span>
            </div>
            <div className="price-breakdown__row">
              <span>Visits per Week:</span>
              <span>{currentPriceData.visitsPerWeek}</span>
            </div>
            <div className="price-breakdown__row">
              <span>Visits per Month:</span>
              <span>{currentPriceData.visitsPerMonth}</span>
            </div>
            <div className="price-breakdown__row">
              <span>Original Price:</span>
              <span>₦{currentPriceData.originalPrice.toLocaleString()}</span>
            </div>
            {currentPriceData.discountPercentage > 0 && (
              <>
                <div className="price-breakdown__row price-breakdown__discount">
                  <span>Discount ({currentPriceData.discountPercentage}%):</span>
                  <span>-₦{currentPriceData.savings.toLocaleString()}</span>
                </div>
                <div className="price-breakdown__row price-breakdown__savings">
                  <span>You Save:</span>
                  <span>₦{currentPriceData.savings.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="price-breakdown__row price-breakdown__total">
              <span>Total Monthly Price:</span>
              <span>₦{currentPriceData.calculatedPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );

  // Export validation function for parent component use
  ServiceFrequency.validate = validateSelection;
};

// Export utility functions for reuse in other components
export const PriceCalculator = {
  getFrequencyDetails: (frequencyId) => {
    switch(frequencyId) {
      case 'weekly':
        return { visitsPerMonth: 4, discountPercentage: 0, visitsPerWeek: 1 };
      case 'thrice-weekly':
        return { visitsPerMonth: 12, discountPercentage: 5, visitsPerWeek: 3 };
      case 'everyday':
        return { visitsPerMonth: 20, discountPercentage: 20, visitsPerWeek: 5 };
      default:
        return { visitsPerMonth: 4, discountPercentage: 0, visitsPerWeek: 1 };
    }
  },

  calculatePrice: (basePrice, frequencyId) => {
    const details = PriceCalculator.getFrequencyDetails(frequencyId);
    const originalPrice = basePrice * details.visitsPerMonth;
    const discountAmount = originalPrice * (details.discountPercentage / 100);
    return originalPrice - discountAmount;
  },

  calculatePriceDetails: (basePrice, frequencyId) => {
    const details = PriceCalculator.getFrequencyDetails(frequencyId);
    const originalPrice = basePrice * details.visitsPerMonth;
    const discountAmount = originalPrice * (details.discountPercentage / 100);
    const calculatedPrice = originalPrice - discountAmount;
    
    return {
      frequencyId,
      basePrice,
      originalPrice,
      discountAmount,
      calculatedPrice,
      savings: discountAmount,
      visitsPerWeek: details.visitsPerWeek,
      visitsPerMonth: details.visitsPerMonth,
      discountPercentage: details.discountPercentage
    };
  },

  formatPrice: (price) => {
    return `₦${price.toLocaleString()}`;
  },

  getFrequencyDisplayName: (frequencyId) => {
    switch(frequencyId) {
      case 'weekly':
        return 'Weekly (4 visits/month)';
      case 'thrice-weekly':
        return 'Thrice Weekly (12 visits/month)';
      case 'everyday':
        return 'Daily (20+ visits/month)';
      default:
        return 'Unknown frequency';
    }
  }
};

export default ServiceFrequency;
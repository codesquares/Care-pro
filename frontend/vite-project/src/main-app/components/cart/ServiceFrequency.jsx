import { useState, useEffect } from 'react';
import './ServiceFrequency.css';

const ServiceFrequency = ({ selectedFrequency, frequencyPerWeek, onFrequencyChange, service }) => {
  const [validationError, setValidationError] = useState('');
  const [localFrequencyPerWeek, setLocalFrequencyPerWeek] = useState(frequencyPerWeek || 1);

  if (!service) {
    return <div>Loading...</div>;
  }

  // Service type options
  const serviceTypes = [
    {
      id: 'one-time',
      title: 'One-Time Service',
      description: 'A single service visit at the base price',
      showFrequencySelector: false
    },
    {
      id: 'weekly',
      title: 'Weekly Service',
      description: 'Recurring service - select how many times per week',
      showFrequencySelector: true
    },
    {
      id: 'monthly',
      title: 'Monthly Service',
      description: 'Monthly commitment - your weekly frequency × 4 weeks',
      showFrequencySelector: true
    }
  ];

  // Handle service type change
  const handleServiceTypeChange = (serviceType) => {
    const freq = serviceType === 'one-time' ? 1 : localFrequencyPerWeek;
    onFrequencyChange(serviceType, freq);
    setValidationError('');
  };

  // Handle frequency per week change
  const handleFrequencyPerWeekChange = (freq) => {
    const newFreq = parseInt(freq, 10);
    setLocalFrequencyPerWeek(newFreq);
    onFrequencyChange(selectedFrequency, newFreq);
  };

  // Calculate estimated price for display (informational only - backend calculates actual)
  const getEstimatedPrice = (serviceType, freq) => {
    const basePrice = service.price;
    switch (serviceType) {
      case 'one-time':
        return basePrice;
      case 'weekly':
        return basePrice * freq;
      case 'monthly':
        return basePrice * freq * 4;
      default:
        return basePrice;
    }
  };

  return (
    <div className="service-frequency">
      <h3 className="service-frequency__title">Select Service Type</h3>
      
      {/* Validation Error */}
      {validationError && (
        <div className="service-frequency__error">
          {validationError}
        </div>
      )}
      
      <div className="service-frequency__options">
        {serviceTypes.map((option) => (
          <div 
            key={option.id}
            className={`service-frequency__option ${selectedFrequency === option.id ? 'service-frequency__option--selected' : ''}`}
            onClick={() => handleServiceTypeChange(option.id)}
          >
            <div className="service-frequency__option-content">
              <div className="service-frequency__option-title">
                {option.title}
              </div>
              <div className="service-frequency__option-description">
                {option.description}
              </div>
              {/* Show estimated price */}
              <div className="service-frequency__option-price">
                Estimated: ₦{getEstimatedPrice(option.id, option.showFrequencySelector ? localFrequencyPerWeek : 1).toLocaleString()}
                {option.id !== 'one-time' && <span className="service-frequency__note"> (+ 10% service charge)</span>}
              </div>
            </div>
            <div className="service-frequency__radio">
              <input 
                type="radio" 
                name="serviceType" 
                checked={selectedFrequency === option.id}
                onChange={() => handleServiceTypeChange(option.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Frequency per week selector - only show for weekly/monthly */}
      {(selectedFrequency === 'weekly' || selectedFrequency === 'monthly') && (
        <div className="service-frequency__frequency-selector">
          <h4>How many times per week?</h4>
          <div className="service-frequency__frequency-options">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                className={`service-frequency__frequency-btn ${localFrequencyPerWeek === num ? 'service-frequency__frequency-btn--selected' : ''}`}
                onClick={() => handleFrequencyPerWeekChange(num)}
              >
                {num}x
              </button>
            ))}
          </div>
          <p className="service-frequency__frequency-info">
            {selectedFrequency === 'weekly' 
              ? `${localFrequencyPerWeek} visit${localFrequencyPerWeek > 1 ? 's' : ''} per week`
              : `${localFrequencyPerWeek} visit${localFrequencyPerWeek > 1 ? 's' : ''} per week × 4 weeks = ${localFrequencyPerWeek * 4} visits per month`
            }
          </p>
        </div>
      )}

      {/* Price note */}
      <div className="service-frequency__price-note">
        <p>💡 Final price including service charge (10%) and payment fees will be calculated securely at checkout.</p>
      </div>
    </div>
  );
};

export default ServiceFrequency;
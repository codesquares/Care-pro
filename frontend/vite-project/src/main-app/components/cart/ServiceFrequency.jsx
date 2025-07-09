import React from 'react';
import './ServiceFrequency.css';

const ServiceFrequency = ({ selectedFrequency, onFrequencyChange }) => {
  const frequencyOptions = [
    {
      id: 'weekly',
      title: 'One service a week - ₦41,000',
      description: 'Your caregiver visits once a week and performs their duty',
      selected: true
    },
    {
      id: 'thrice-weekly',
      title: '3 services a week - ₦110,000 (5% discount)',
      description: 'Your caregiver visits three times a week and performs their duty, you get this with a 5% discount',
      selected: false
    },
    {
      id: 'everyday',
      title: 'Services Everyday - ₦200,000 (20% discount)',
      description: 'Your caregiver visits everyday times a week and performs their duty, you get this with a 20% discount',
      selected: false
    }
  ];

  return (
    <div className="service-frequency">
      <h3 className="service-frequency__title">Select Service Frequency</h3>
      
      <div className="service-frequency__options">
        {frequencyOptions.map((option) => (
          <div 
            key={option.id}
            className={`service-frequency__option ${option.selected ? 'service-frequency__option--selected' : ''}`}
            onClick={() => onFrequencyChange(option.id)}
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
                checked={option.selected}
                onChange={() => onFrequencyChange(option.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceFrequency;
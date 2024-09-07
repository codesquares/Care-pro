import React from 'react';
import '../../styles/components/why-us.scss';

const WhyUsSection = () => {
  const features = [
    {
      icon: 'trust-icon.png',
      title: 'Trustworthiness',
      description: 'Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
    {
      icon: 'verified-icon.png',
      title: 'Verified Caregivers',
      description: 'Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
    {
      icon: 'health-expert-icon.png',
      title: 'Access to health experts',
      description: 'Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat aute irure dolor.',
    },
  ];

  return (
    <section className="why-us-section">
      <h2>Why Us?</h2>
      <div className="features">
        {features.map((feature, index) => (
          <div key={index} className="feature">
            <img src={`/${feature.icon}`} alt={feature.title} />
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyUsSection;

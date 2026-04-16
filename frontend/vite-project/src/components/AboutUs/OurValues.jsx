import React from 'react';
import '../../styles/components/why-us.css';
import { FiHeart, FiActivity, FiShield, FiUsers } from 'react-icons/fi';

const OurValues = () => {
  const features = [
    {
      icon: <FiHeart className="value-icon" />,
      title: 'Trust by Design',
      description: 'Trust is not a feature. It is architecture. We embed verification, transparency, structured categorization, and accountability directly into the platform.',
    },
    {
      icon: <FiActivity className="value-icon" />,
      title: 'Empowered Care Decisions',
      description: 'Care decisions should feel informed, not overwhelming. We provide clarity, visibility, and control so individuals, families, and representatives can confidently choose care that fits their needs.',
    },
    {
      icon: <FiShield className="value-icon" />,
      title: 'Respect & Opportunity',
      description: 'Caregivers are essential professionals. We create a structured digital environment where caregivers can showcase their expertise, access demand transparently, and build rewarding relationships.',
    },
    {
      icon: <FiUsers className="value-icon" />,
      title: 'Responsible Care',
      description: 'Home care is a societal necessity. We are committed to formalizing a fragmented sector in a way that promotes accountability, accessibility, and long-term sustainability. ',
    },
  ];

  return (
    <section className="why-us-section">
      <p className="section-label">OUR CORE VALUES</p>
      <div className="features">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="icon-wrapper">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OurValues;

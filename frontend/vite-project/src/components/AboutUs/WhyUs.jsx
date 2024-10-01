import React from 'react';
import '../../styles/components/why-us.scss';
import trustImg from '../../assets/trust-icon.png'
import verifiedImg from '../../assets/verified-icon.png'
import healthExpertImg from '../../assets/health-expert-icon.png'

const WhyUsSection = () => {
  const features = [
    {
      icon: trustImg,
      title: 'Devoted & Reliable',
      description: 'We prioritise your well-being always and provide compassionate care that supports you through all phases of your healthcare journey. ',
    },
    {
      icon: verifiedImg,
      title: 'Ethical',
      description: 'We uphold high ethical standards, with emphasis to your security, confidentiality, and respect. Your rights and dignity are always a priority.',
    },
    {
      icon: healthExpertImg,
      title: 'Professional',
      description: 'Our team of skilled professionals are highly vetted and dedicated to providing knowledgeable, respectful, and attentive care.',
    },
  ];

  return (
    <section className="why-us-section">
      <h2>Why Us?</h2>
      <div className="features">
        {features.map((feature, index) => (
          <div key={index} className="feature">
            <img src={feature.icon} alt={feature.title} />
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyUsSection;

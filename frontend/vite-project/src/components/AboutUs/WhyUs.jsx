import React from 'react';
import '../../styles/components/why-us.scss';
import trustImg from '../../assets/trust-icon.png'
import verifiedImg from '../../assets/verified-icon.png'
import healthExpertImg from '../../assets/health-expert-icon.png'

const WhyUsSection = () => {
  const features = [
    {
      icon: trustImg,
      title: 'Reliable',
      description: 'We believe in providing healthcare you trust and ensure you recieve the attention you deserve without barriers. ',
    },
    {
      icon: verifiedImg,
      title: 'Innovation',
      description: 'We are dedicated to continuosly improving the healthacre experience by embracing solutions that make healthcare faster,smarter, and more efficient.',
    },
    {
      icon: healthExpertImg,
      title: 'integrity',
      description: 'we uphold honesty,transparency,and high ethical conduct to give you healthacre that ensures your safety.',
    },
  ];

  return (
    <section className="why-us-section">
      <h2>Our Values?</h2>
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

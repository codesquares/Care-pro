import { Helmet } from 'react-helmet';
import GeneralBanner from '../components/GeneralBanner';
import '../styles/components/our-plans.css';

const Plans = () => {
  const servicePlans = [
    {
      id: 'weekly-1',
      title: '1 Service Weekly',
      subtitle: '4 visits per month',
      price: '₦40,000',
      priceNote: 'Starting from ₦10,000 per service',
      features: [
        'One scheduled visit per week',
        'Basic care assistance',
        'Medication reminders',
        'Light housekeeping',
        'Companionship services'
      ],
      popular: false,
      buttonText: 'Choose Plan'
    },
    {
      id: 'weekly-3',
      title: '3 Services Weekly',
      subtitle: '12 visits per month',
      price: '₦108,000',
      priceNote: '10% discount applied',
      originalPrice: '₦120,000',
      features: [
        'Three scheduled visits per week',
        'Comprehensive personal care',
        'Medication management',
        'Meal preparation assistance',
        'Light housekeeping',
        'Health monitoring',
        'Transportation assistance'
      ],
      popular: true,
      buttonText: 'Most Popular'
    },
    {
      id: 'weekly-5plus',
      title: 'Minimum 5 Weekly Services',
      subtitle: '20+ visits per month',
      price: '₦160,000',
      priceNote: '20% discount applied',
      originalPrice: '₦200,000',
      features: [
        'Five or more visits per week',
        'Intensive personal care',
        'Advanced medication management',
        'Daily meal preparation',
        'Complete housekeeping',
        'Health monitoring & reporting',
        'Emergency response',
        'Transportation services',
        'Specialized care routines'
      ],
      popular: false,
      buttonText: 'Premium Care'
    },
    {
      id: 'live-in',
      title: 'Live-in Service',
      subtitle: '24/7 comprehensive care',
      price: '₦400,000',
      priceNote: 'Monthly rate',
      features: [
        '24/7 live-in caregiver',
        'Round-the-clock supervision',
        'All personal care services',
        'Medication management',
        'Meal preparation & nutrition',
        'Housekeeping & maintenance',
        'Emergency medical response',
        'Companionship & activities',
        'Family communication & updates',
        'Specialized medical care coordination'
      ],
      popular: false,
      buttonText: 'Premium Live-in'
    }
  ];

  const platformFees = [
    {
      title: 'Platform Fee for New Clients',
      description: 'Orders over ₦100,000',
      fee: '10%',
      details: 'One-time fee for order processing and quality assurance'
    },
    {
      title: 'Caregiver Matching Fee',
      description: 'All service bookings',
      fee: '20%',
      details: 'Fee for caregiver screening, matching, and ongoing support'
    }
  ];

  const futurePlans = [
    {
      icon: '🤖',
      title: 'AI-Powered Care Coordination',
      description: 'Advanced AI algorithms to optimize care schedules and predict health needs'
    },
    {
      icon: '🏥',
      title: 'Robotic Assistance Integration',
      description: 'Partnership with robotic care assistants for enhanced patient monitoring'
    },
    {
      icon: '💬',
      title: 'LLM Health Assistant',
      description: 'Large Language Model integration for personalized health recommendations and family communication'
    },
    {
      icon: '📱',
      title: 'Smart Health Monitoring',
      description: 'IoT devices and wearables for real-time health tracking and alerts'
    }
  ];

  return (
    <div className="our-plans">
      <Helmet>
        <title>Our Plans - CarePro</title>
        <meta name="description" content="Explore CarePro's comprehensive care plans designed to meet your specific healthcare needs with flexible scheduling and professional caregivers." />
        <meta name="keywords" content="care plans, pricing, healthcare services, caregiver services, home care, nursing plans, eldercare packages" />
      </Helmet>

      <GeneralBanner 
        title="Our Plans"
        subtitle="Choose the perfect care plan that fits your needs and budget. From weekly visits to live-in care, we have options for every situation."
        showButton={false}
      />

      <section className="plans-section">
        <div className="container">
          <div className="section-header">
            <h2>Service Plans</h2>
            <p>All plans include professional caregiver screening, insurance coverage, and 24/7 customer support.</p>
          </div>

          <div className="plans-grid">
            {servicePlans.map((plan) => (
              <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                
                <div className="plan-header">
                  <h3>{plan.title}</h3>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                </div>

                <div className="plan-pricing">
                  <div className="price-main">{plan.price}</div>
                  {plan.originalPrice && (
                    <div className="price-original">Was {plan.originalPrice}</div>
                  )}
                  <div className="price-note">{plan.priceNote}</div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className={`plan-button ${plan.popular ? 'popular-button' : ''}`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fees-section">
        <div className="container">
          <div className="section-header">
            <h2>Platform Fees</h2>
            <p>Transparent pricing with no hidden costs. Our fees support quality assurance and ongoing service excellence.</p>
          </div>

          <div className="fees-grid">
            {platformFees.map((fee, index) => (
              <div key={index} className="fee-card">
                <div className="fee-header">
                  <h3>{fee.title}</h3>
                  <div className="fee-percentage">{fee.fee}</div>
                </div>
                <p className="fee-description">{fee.description}</p>
                <p className="fee-details">{fee.details}</p>
              </div>
            ))}
          </div>

          <div className="minimum-service-note">
            <div className="note-card">
              <h4>Minimum Service Fee</h4>
              <p>All individual services have a minimum fee of <strong>₦10,000</strong> to ensure quality care and fair compensation for our professional caregivers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="future-plans-section">
        <div className="container">
          <div className="section-header">
            <h2>Future Innovations</h2>
            <p>CarePro is continuously evolving to integrate cutting-edge technology for enhanced care delivery.</p>
          </div>

          <div className="future-grid">
            {futurePlans.map((plan, index) => (
              <div key={index} className="future-card">
                <div className="future-icon">{plan.icon}</div>
                <h3>{plan.title}</h3>
                <p>{plan.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Contact us today to discuss your care needs and find the perfect plan for you or your loved ones.</p>
            <div className="cta-buttons">
              <button className="cta-button primary">Book a Consultation</button>
              <button className="cta-button secondary">Contact Us</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Plans;
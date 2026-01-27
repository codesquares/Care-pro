import "../../styles/components/pricing-plans.css";
import mostPopular from "../../assets/mostPopular.png";

const PricingPlans = () => {
  const plans = [
    {
      type: 'Basic',
      price: '₦200k',
      features: [
        'Caregiver Interviews: Up to 3 personalized caregiver interviews.',
        'Visits: 1 weekly visit from your selected caregiver.',
        'Services included:',
        '• Activities of Daily Living: Assistance with toileting, bathing, sponge baths, and brushing.',
        '• Medication Assistance: Help with managing and administering medications.',
        '• Light Home Cleaning: Basic cleaning tasks to maintain a tidy living space.',
        '• General Concierge: Support with everyday errands and requests for convenience.',
      ],
      buttonText: 'Select Basic Plan',
      buttonColor: '#555555',
    },
    {
      type: 'Standard',
      price: '₦250k',
      features: [
        'Caregiver Interviews: Up to 5 personalized caregiver interviews.',
        'Visits: 2 weekly visits from your selected caregiver.',
        'Services included:',
        '• All Basic Services.',
        '• Medical Appointment Support: Escort and support with hospital visits and medical appointments.',
        '• Vital Signs Check: Light medical monitoring, including checking vital signs for your well-being.',
      ],
      buttonText: 'Select Standard Plan',
      buttonColor: '#FBB040',
      popular: true,
    },
    {
      type: 'Premium',
      price: '₦300k',
      features: [
        'Caregiver Interviews: Unlimited personalized caregiver interviews to find the perfect match.',
        'Visits: Daily visits from your selected caregiver.',
        'Services included:',
        '• All Basic and Standard services.',
        '• Full Nursing Care: Comprehensive care for managing terminal illnesses, providing expert medical attention and comfort.',
        '• In-hospital care: Premium clients can request for a caregiver to stay with them in their hospital admissions.',
      ],
      buttonText: 'Select Premium Plan',
      buttonColor: '#00C2A8',
    },
  ];

  return (
    <div className="pricing-plans">
      <h2 className="title">Select a Plan</h2>
      <p className="subtitle">
        These are our packages tailored to your unique needs and requirements.
      </p>
      <div className="plans-list">
        {plans.map((plan, index) => (
          <div key={index} className={`plan-item ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="badge"><img src={mostPopular} alt="Most Popular" /></div>}
            <h3 className="type">{plan.type}</h3>
            <div className="price">{plan.price}<span>/month</span></div>
            <hr />
            <ul className="features">
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button
              className="select-button"
              style={{ backgroundColor: plan.buttonColor }}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPlans;


import "../../styles/components/pricing-plans.scss";
import mostPopular from "../../assets/mostPopular.png"

const PricingPlans = () => {
  const plans = [
    {
      type: 'Basic',
      price: '₦15k',
      features: [
        'Access to 3 caregiver interviews',
        '10 caregiver jobs monthly',
        'Caregiver services include Primary Care Visits, Preventive Care (vaccinations, health screenings), Basic Prescription drugs, Maternity and Newborn Care, Basic Mental Health Services (counseling and therapy), Pediatric care',
      ],
      buttonText: 'Select Basic Plan',
      buttonColor: '#555555',
    },
    {
      type: 'Standard',
      price: '₦25k',
      features: [
        'Access to 3 caregiver interviews',
        '10 caregiver jobs monthly',
        'Specialist Visits (e.g., cardiologists, dermatologists), Advanced Diagnostic Tests (e.g., MRI scans), Rehabilitation Services (physical, occupational, speech therapy), Outpatient Surgery, Comprehensive Maternity Care, Mental Health Care (psychiatrists, advanced therapy), Home Healthcare, Dental Care',
      ],
      buttonText: 'Select Standard Plan',
      buttonColor: '#FBB040',
      popular: true,
    },
    {
      type: 'Premium',
      price: '₦75k',
      features: [
        'Access to 3 caregiver interviews',
        '10 caregiver jobs monthly',
        'Private Hospital Rooms, Advanced Treatments, International Healthcare Access, Concierge Medicine (personalized and priority care), Comprehensive Wellness Programs, Telemedicine with Physicians, Alternative Medicine (e.g., acupuncture, naturopathy), Nutritional Counseling and Fitness Coaching',
      ],
      buttonText: 'Select Premium Plan',
      buttonColor: '#00C2A8',
    },
  ];

  return (
    <div className="pricing-plans">
      <h2>Our Plans</h2>
      <p className="subtitle">
        These are our packages tailored to your unique needs and requirements.
      </p>
      <div className="plans-list">
        {plans.map((plan, index) => (
          <div key={index} className={`plan-item ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="badge"><img src={mostPopular} alt="most porpular" /></div>}
            <h3 className="type">{plan.type}</h3>
            <div className="price">{plan.price}<span>/month</span></div>
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

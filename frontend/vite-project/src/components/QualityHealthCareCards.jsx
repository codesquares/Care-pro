
import "../styles/components/qualityHealthcareCards.css"
import star from "../assets/rating_star.png"; // Import the star image
import QHCC1 from "../assets/QHCC1.jpg";
import QHCC2 from "../assets/QHCC2.jpg";
import QHCC3 from "../assets/QHCC3.jpg";
import QHCC4 from "../assets/QHCC4.jpg";
import QHCC5 from "../assets/QHCC5.jpg";
import QHCC6 from "../assets/QHCC6.jpg";
import QHCC7 from "../assets/QHCC7.jpg";
import QHCC8 from "../assets/QHCC8.jpg";
import "../styles/components/qualityHealthCareCards.css";

const categories = {
    "Adult Care": [
      "Companionship", "Meal preparation", "Mobility assistance", "Medication reminders",
      "Bathing and grooming", "Dressing assistance", "Toileting and hygiene support",
      "Incontinence care", "Overnight supervision", "Chronic illness management"
    ],
    "Post Surgery Care": [
      "Wound care", "Medication management", "Post-surgery care",
      "Mobility assistance", "Home safety assessment", "Feeding assistance"
    ],
    "Child Care": [
      "Respite", "Babysitting", "Meal preparation", "Recreational activities assistance",
      "Emotional support and check-ins"
    ],
    "Pet Care": [
      "Pet minding", "Dog walking", "Feeding assistance", "Companionship"
    ],
    "Home Care": [
      "Light housekeeping", "Cleaning", "Cooking", "Home safety assessment",
      "Errands and shopping", "Transportation to appointments"
    ],
    "Special Needs Care": [
      "Dementia care", "Autism support", "Behavioral support", "Disability support services",
      "Assistive device training", "Language or communication support"
    ],
    "Medical Support": [
      "Nursing care", "Medication reminders", "Medical appointment coordination",
      "Palliative care support", "Chronic illness management"
    ],
    "Mobility Support": [
      "Mobility assistance", "Fall prevention monitoring", "Exercise and fitness support",
      "Assistive device training", "Transportation to appointments"
    ],
    "Therapy & Wellness": [
      "Physical therapy support", "Cognitive stimulation activities", "Emotional support and check-ins",
      "Recreational activities assistance", "Acupuncture", "Massage therapy"
    ],
    "Palliative": [
      "Palliative care support", "Overnight supervision", "Emotional support and check-ins",
      "Home safety assessment"
    ],
  };

const services = [
  {
    title: 'Adult Care',
    rating: 4.5,
    caregivers: 302,
    image: QHCC1,
    alt: 'A caregiver assisting an elderly person',
    bgColor: '#E7DFF2', 
    titleColor: '#5B3E7A', 
  },
  {
    title: 'Home Care Services',
    rating: 4.7,
    caregivers: 44,
    image: QHCC2,
    alt: 'A person cleaning a window',
    bgColor: '#DFF3F2', 
    titleColor: '#27614B', 
  },
  {
    title: 'Mobility Support',
    rating: 3.2,
    caregivers: 112,
    image: QHCC3,
    alt: 'A caregiver holding hands with an elderly person',
    bgColor: '#F4D8E4', 
    titleColor: '#8D4A66', 
  },
  {
    title: 'Personalized Care',
    rating: 4.2,
    caregivers: 2,
    image: QHCC4,
    alt: 'A caregiver talking to an elderly person',
    bgColor: '#DDEBF7', 
    titleColor: '#475A76', 
  },
  {
    title: 'Children Care & Medical Support',
    rating: 4.5,
    caregivers: 302,
    image: QHCC5,
    alt: 'A caregiver taking care of a baby',
    bgColor: '#F8E8EF', 
    titleColor: '#7A3759', 
  },
  {
    title: 'Cooking and catering plans',
    rating: 4.7,
    caregivers: 44,
    image: QHCC6,
    alt: 'A person cooking in a kitchen',
    bgColor: '#E9F6E6', 
    titleColor: '#506231', 
  },
  {
    title: 'Therapy and Wellness',
    rating: 3.2,
    caregivers: 112,
    image: QHCC7,
    alt: 'A caregiver assisting with physical therapy',
    bgColor: '#F7F6D9', 
    titleColor: '#6A6626', 
  },
  {
    title: 'Palliative Care',
    rating: 4.2,
    caregivers: 2,
    image: QHCC8,
    alt: 'A caregiver providing companionship to an elderly person',
    bgColor: '#EADDF1', 
    titleColor: '#6B3F78', 
  },
];

const Card = ({ title, rating, caregivers, image, alt, bgColor, titleColor }) => {
  return (
    <div className="quality-healthcare-card" style={{ backgroundColor: bgColor }}>
      <div className="quality-healthcare-card__title" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="quality-healthcare-card__rating-container">
        <div className="quality-healthcare-card__rating">
          <img src={star} alt="Star" className="quality-healthcare-card__star" />
          <span>{rating}</span>
        </div>
        <span className="quality-healthcare-card__caregivers">{caregivers} Caregivers</span>
      </div>
      <img 
        src={image} 
        alt={alt} 
        className="quality-healthcare-card__image" 
      />
    </div>
  );
};

const QualityHealthCareCards = () => {
  return (
    <div className="quality-healthcare-cards" style={{ padding: '0 2rem' }}>
      <h2 className="quality-healthcare-title">Quality healthcare at your Fingertips</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {services.map((service, index) => (
          <Card 
            key={index} 
            title={service.title} 
            rating={service.rating} 
            caregivers={service.caregivers} 
            image={service.image} 
            alt={service.alt} 
            bgColor={service.bgColor} 
            titleColor={service.titleColor} 
          />
        ))}
      </div> 
    </div>
  );
};

export default QualityHealthCareCards;
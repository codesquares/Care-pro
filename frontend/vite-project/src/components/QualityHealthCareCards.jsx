import React from 'react';
import star from "../assets/rating_star.png"; // Import the star image
import QHCC1 from "../assets/QHCC1.jpg";
import QHCC2 from "../assets/QHCC2.jpg";
import QHCC3 from "../assets/QHCC3.jpg";
import QHCC4 from "../assets/QHCC4.jpg";
import QHCC5 from "../assets/QHCC5.jpg";
import QHCC6 from "../assets/QHCC6.jpg";
import QHCC7 from "../assets/QHCC7.jpg";
import QHCC8 from "../assets/QHCC8.jpg";
import "../styles/components/qualityHealthCareCards.scss";

const services = [
  {
    title: 'Expert Medical Support',
    rating: 4.5,
    caregivers: 302,
    image: QHCC1,
    alt: 'A caregiver assisting an elderly person',
    bgColor: '#E7DFF2', 
    titleColor: '#5B3E7A', 
  },
  {
    title: 'House cleaning and management',
    rating: 4.7,
    caregivers: 44,
    image: QHCC2,
    alt: 'A person cleaning a window',
    bgColor: '#DFF3F2', 
    titleColor: '#27614B', 
  },
  {
    title: 'Reliable Senior Care',
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
    title: 'Children Care & Pregnancy support',
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
    title: 'Physical and speech therapy',
    rating: 3.2,
    caregivers: 112,
    image: QHCC7,
    alt: 'A caregiver assisting with physical therapy',
    bgColor: '#F7F6D9', 
    titleColor: '#6A6626', 
  },
  {
    title: 'Companionship',
    rating: 4.2,
    caregivers: 2,
    image: QHCC8,
    alt: 'A caregiver providing companionship to an elderly person',
    bgColor: '#EADDF1', 
    titleColor: '#6B3F78', 
  },
];

const Card = ({ title, rating, caregivers, image, alt, bgColor, titleColor, index }) => {
  // Define a marginTop style for specific indices
  const imageStyle = {
    marginTop:  index === 2 || index === 3 || index === 7 ? '2rem' : '0', // Cards 3, 4, and 8 (0-based index)
  };

  return (
    <div className="quality-healthcare-card" style={{ backgroundColor: bgColor }}>
      <h3 className="quality-healthcare-card__title" style={{ color: titleColor }}>{title}</h3>
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
        style={imageStyle} // Apply the conditional style here
      />
    </div>
  );
};

const QualityHealthCareCards = () => (
  <div className="quality-healthcare-cards" style={{ padding: '0 2rem' }}> {/* Add padding to the edges */}
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
          index={index} // Pass the index here
        />
      ))}
    </div> 
  </div>
);

export default QualityHealthCareCards;
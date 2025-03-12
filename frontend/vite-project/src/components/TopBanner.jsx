import '../styles/components/top-banner.scss';
import solarhealth from "../assets/solar_health-broken.svg"
import star from "../assets/bi_stars.svg"

const TopBanner = ({ 
  title = "Hire a Caregiver today!", 
  description = "As a Carepro caregiver, you have the opportunity to support your patients while also building a rewarding career in healthcare. Take the first step today!.",
  buttonText = "Hire a Caregiver",
  imageUrl,
  backgroundColor = "#373732",
  onButtonClick 
}) => {
  return (
    <div className='banner' style={{ backgroundColor }}>
      <div className='content'>
        <div className='text-content'>
          <h1 style={{ maxWidth: '120%', width: '120%', fontFamily:'PoppinsSemiBold',color:'white'}}><img src={star} alt="star img" />{title}</h1>
          <p style={{ color: 'white' }}>{description}</p>
          <button className='hire-button' onClick={onButtonClick}>
            {buttonText} <img src={solarhealth} alt="Solar Health img" />
          </button>
        </div>
      </div>
      <div className='image-content'>
        {imageUrl && (
          <img src={imageUrl} alt="Caregiver assisting a senior" />
        )}
      </div>
    </div>
  );
};

export default TopBanner;

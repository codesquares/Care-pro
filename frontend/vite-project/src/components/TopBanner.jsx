import '../styles/components/top-banner.scss';
import solarhealth from "../assets/solar_health-broken.svg"
import star from "../assets/bi_stars.svg"

const TopBanner = ({ 
  title = "Your Wellness Starts Here!", 
  description = "Take charge of your health and break free from the limitations. It's time to prioritize your well-being.",
  buttonText = "Get Started",
  imageUrl,
  backgroundColor = "#2c2c2c",
  onButtonClick 
}) => {
  return (
    <div className='banner' style={{ backgroundColor }}>
      <div className='text-content'>
          <h1>
            {/* <img src={star} alt="star img" /> */}
            {title}
          </h1>
          <p>{description}</p>
          <button className='hire-button' onClick={onButtonClick}>
            {buttonText}
            <img src={solarhealth} alt="Solar Health img" />
          </button>
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

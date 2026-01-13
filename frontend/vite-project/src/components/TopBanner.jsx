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
    <div className='banner' style={{ '--banner-color': backgroundColor }}>
      {/* Decorative background elements */}
      <div className="banner-bg-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="glow-effect"></div>
      </div>
      
      <div className='text-content'>
          <div className="badge-pill">
            <img src={star} alt="star" className="badge-icon" />
            <span>Trusted Care Services</span>
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
          <button className='hire-button' onClick={onButtonClick}>
            <span>{buttonText}</span>
            <div className="button-icon">
              <img src={solarhealth} alt="" />
            </div>
          </button>
        </div>
      
      {imageUrl && (
        <div className='image-content'>
          <img src={imageUrl} alt="Caregiver assisting a senior" />
        </div>
      )}
    </div>
  );
};

export default TopBanner;

import solarhealth from "../../assets/solar_health-broken.svg"
import genralImg from "../../assets/nurse.png";
import "./BottomBanner.scss"; // Import your CSS file for styling
import { useAuth } from "../../main-app/context/AuthContext";
import { useNavigate } from "react-router-dom";

const BottomBanner = ({ 
    title = "Become a Caregiver today!", 
    description = "As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home.",
    buttonText = "Become a Caregiver",
    imageUrl= genralImg,
    backgroundColor = "#015476",
    onButtonClick 
  }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Don't render if user is authenticated
    if (isAuthenticated) {
      return null;
    }
    
    const handleButtonClick = () => {
      if (onButtonClick) {
        onButtonClick();
      } else {
        navigate('/register');
      }
    };
    
    return (

      <div className='banner-container' style={{ padding: '75px', margin: '0 auto'  }}> 
        <div className='banner' style={{ backgroundColor, borderRadius: '50px', overflow: 'hidden' }}>
          <div className='content'>
            <div className='text-content'>
              <h1 style={{ maxWidth: '120%', width: '120%', fontFamily:'PoppinsSemiBold',color:'white'}}>{title}</h1>
              <p style={{ color: 'white' }}>{description}</p>
              <button className='hire-button' onClick={handleButtonClick}>
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
      </div>
    );
  };
  
  export default BottomBanner;
  
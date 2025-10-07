
import { useNavigate } from 'react-router-dom';
import "./banner.css";

const Banner = ({ name, careNeedsSet }) => {
  const navigate = useNavigate();
  return (
    <div className="banner-top">
      <div className="welcome-section">
        <div className="avatar-circle">
          <span className="avatar-initial">{name.charAt(0)}</span>
        </div>
        <h2 className="welcome-text" style={{ color: "white" }}>Welcome back, {name.split(" ")[0]}</h2>
      </div>

      {/* {!careNeedsSet && (
        <div className="search-box">
          <div className="search-info">
            <span className="search-icon">⭐</span>
            <div>
              <h4 className="search-title">Complete your care needs profile</h4>
              <p className="search-subtitle">Get personalized caregiver recommendations</p>
            </div>
          </div>
          <button 
            className="view-orders"
            onClick={() => navigate('/app/client/care-needs')}
          >
            Set Care Needs
          </button>
        </div>
      )} */}
    </div>
  );
};

export default Banner;

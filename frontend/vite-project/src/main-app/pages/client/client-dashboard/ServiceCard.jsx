
// import { useNavigate } from "react-router-dom";
// import "./serviceCard.css";

// const ServiceCard = ({ id, image1, title, location, packageDetails, rating, isPremium }) => {
//   const navigate = useNavigate();
//   const basePath = "/app/client";

//   const handleClick = () => {
//     navigate(`${basePath}/service/${id}`);
//   };

//   // Format rating to ensure it has one decimal place
//   const formattedRating = rating ? parseFloat(rating).toFixed(1) : "N/A";
  
//   // Handle missing image with a fallback
//   const imgSrc = image1 || "https://via.placeholder.com/800x600?text=CarePro+Premium+Service";

//   // Format location with emoji if not present in text
//   const displayLocation = location ? 
//     (location.includes("📍") ? location : location) : 
//     "Available Nationwide";

//   // Shortened package details for card display
//   const shortDescription = packageDetails || "Premium care service tailored to your needs";
  
//   return (
//     <div className="service-card" onClick={handleClick}>
//       <div className="service-img-container">
//         <img src={imgSrc} alt={title} className="service-img" />
//         {isPremium && <div className="premium-badge">Premium</div>}
//       </div>
//       <div className="service-content">
//         <div className="location">{displayLocation}</div>
//         <h3 className="service-title">{title}</h3>
//         <p>{shortDescription}</p>
//         <div className="card-footer">
//           <div className="rating">
//             {formattedRating !== "N/A" ? (
//               <>⭐ {formattedRating}</>
//             ) : (
//               <span className="new-service">New</span>
//             )}
//           </div>
//           <div className="view-details">Details →</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceCard;



import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./serviceCard.css";
import defaultAvatar from "../../../../assets/profilecard1.png";

const ServiceCard = ({ 
  // Available props from backend
  id, 
  title, 
  image1, 
  packageDetails, 
  price,
  category,
  tags,
  
  // Missing props with fallbacks
  caregiverName,
  caregiverFirstName,
  caregiverLastName,
  caregiverProfileImage, 
  avatar, 
  caregiverLocation, 
  rating, 
  isVerified = true, 
  isPremium = false,
  reviewCount,
  isPopular = false,
  isAvailable = true, // New prop for availability status
  isPublic = false // New prop to indicate if this is for public viewing
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const basePath = "/app/client";

  const handleClick = () => {
    // If this is a public view and user is not authenticated, redirect to login
    if (isPublic && !isAuthenticated) {
      const returnUrl = encodeURIComponent(`${basePath}/service/${id}`);
      navigate(`/login?returnTo=${returnUrl}&message=Please sign in to view service details and make bookings`);
      return;
    }
    
    // Normal navigation for authenticated users
    navigate(`${basePath}/service/${id}`);
  };
 //create initials from first and last name
  const initials = `${caregiverFirstName?.charAt(0) || ''}${caregiverLastName?.charAt(0) || ''}`.toUpperCase();
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking heart
    
    // If this is a public view and user is not authenticated, redirect to login
    if (isPublic && !isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnTo=${returnUrl}&message=Please sign in to save your favorite services`);
      return;
    }
    
    console.log("Toggle favorite for service:", id);
  };

  // console.log("ServiceCard props:", service);

  // Fallback values for missing data
  const displayUserName = caregiverName || "Care Provider";
  //check if caregiverProfileImage is not empty string
  const displayAvatar = (caregiverProfileImage && caregiverProfileImage.trim() !== '') ? caregiverProfileImage : defaultAvatar;
  const displayLocation = caregiverLocation || "Lagos, Nigeria";
  const formattedRating = rating ? parseFloat(rating).toFixed(1) : "4.5";
  const displayReviewCount = reviewCount || Math.floor(Math.random() * 50) + 10; // Random fallback between 10-59
  const imgSrc = image1 || "https://via.placeholder.com/380x200?text=Care+Service&bgcolor=f3f4f6&color=6b7280";
  
  // Handle package details - show first item or fallback
  const shortDescription = Array.isArray(packageDetails) 
    ? packageDetails[0] 
    : packageDetails || "Professional care service tailored to your needs";
  
  // Format price display
  const displayPrice = price ? `₦${price.toLocaleString()}` : "Contact for pricing";

  return (
    <div className="modern-service-card" onClick={handleClick}>
      <div className="card-image-wrapper">
        <img src={imgSrc} alt={title} className="card-image" />
        
        {/* Location badge overlay on image bottom */}
        <div className="location-badge-overlay">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>{displayLocation}</span>
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div className="premium-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Premium</span>
          </div>
        )}

        {/* Popular badge */}
        {isPopular && (
          <div className="popular-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4757">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>Popular</span>
          </div>
        )}
        
        {/* Heart favorite button - show login prompt for unauthenticated users */}
        <button 
          className="favorite-btn"
          onClick={handleFavoriteClick}
          aria-label={isPublic && !isAuthenticated ? "Sign in to save favorites" : "Add to favorites"}
          title={isPublic && !isAuthenticated ? "Sign in to save your favorite services" : "Add to favorites"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>

      <div className="card-content">
        {/* Provider info row - horizontal layout */}
        <div className="provider-row">
          {/* Left side: Avatar, name, availability */}
          <div className="provider-left">
            <div className="provider-avatar-wrapper">
              <img 
                src={displayAvatar} 
                alt={displayUserName} 
                className="provider-avatar"
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              {isVerified && (
                <div className="verification-badge">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#3b82f6">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            <span className="provider-name">{displayUserName}</span>
            <div className={`availability-dot ${isAvailable ? 'available' : 'unavailable'}`}></div>
          </div>

          {/* Right side: Rating */}
          <div className="rating-section">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc107">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="rating-number">{formattedRating}</span>
          </div>
        </div>

        {/* Service title */}
        <h3 className="service-title">{title}</h3>
        
        {/* Action hint for public users */}
        {isPublic && !isAuthenticated && (
          <div className="public-action-hint">
            <span className="hint-text">Click to view details • Sign in to book</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./serviceCard.css";
import defaultAvatar from "../../../../assets/profilecard1.png";
import GigReviewService from "../../../services/gigReviewService";
import ReviewsModal from "../../../components/ReviewsModal/ReviewsModal";

const ServiceCard = ({ 
  id, 
  title, 
  image1, 
  packageDetails, 
  price,
  category,
  tags,
  caregiverName,
  caregiverFirstName,
  caregiverLastName,
  caregiverProfileImage, 
  avatar, 
  caregiverLocation, 
  rating, 
  isVerified = true, 
  isPremium = false,
  isPopular = false,
  isAvailable = true,
  isPublic = false
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const basePath = "/app/client";

  const [gigReviewCount, setGigReviewCount] = useState(0);
  const [gigRating, setGigRating] = useState(0);

  useEffect(() => {
    const fetchReviewCount = async () => {
      if (!id) return;
      try {
        const reviews = await GigReviewService.getReviewsByGigId(id);
        const count = reviews.length;
        setGigReviewCount(count);
        
        if (count > 0) {
          const totalRating = reviews.reduce((sum, r) => sum + (r.rating || r.Rating || 0), 0);
          setGigRating(Math.round((totalRating / count) * 10) / 10);
        }
      } catch (err) {
        // Silent fail
      }
    };
    
    fetchReviewCount();
  }, [id]);

  const handleClick = () => {
    navigate(`/service/${id}`);
  };

  const initials = `${caregiverFirstName?.charAt(0) || ''}${caregiverLastName?.charAt(0) || ''}`.toUpperCase();

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [gigReviews, setGigReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const handleRatingClick = async (e) => {
    e.stopPropagation();
    setShowReviewsModal(true);
    setReviewsLoading(true);
    
    try {
      const { reviews, stats } = await GigReviewService.getReviewsWithStats(id);
      setGigReviews(reviews);
      setReviewStats(stats);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setGigReviews([]);
      setReviewStats(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  const displayUserName = caregiverName || "Care Provider";
  const displayAvatar = (caregiverProfileImage && caregiverProfileImage.trim() !== '') ? caregiverProfileImage : defaultAvatar;
  const displayLocation = caregiverLocation || "Lagos, Nigeria";
  const formattedRating = gigRating > 0 ? gigRating.toFixed(1) : "0.0";
  const displayReviewCount = gigReviewCount;
  const imgSrc = image1 || "https://via.placeholder.com/380x200?text=Care+Service&bgcolor=f3f4f6&color=6b7280";
  const displayPrice = price ? `₦${price.toLocaleString()}` : "Contact for pricing";

  const handleCardClick = (e) => {
    if (e.target.closest('.hire-btn')) {
      return;
    }
    handleClick();
  };

  const handleHireClick = (e) => {
    e.stopPropagation();
    handleClick();
  };

  return (
    <div className="modern-service-card" onClick={handleCardClick}>
      {/* First Container: Gig Image */}
      <div className="card-image-wrapper">
        <img src={imgSrc} alt={title} className="card-image" />

        {isPremium && (
          <div className="premium-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Premium</span>
          </div>
        )}

        {isPopular && (
          <div className="popular-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4757">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>Popular</span>
          </div>
        )}
      </div>

      <div className="card-content">
        {/* Second Container: Avatar, name, verified, rating + location below */}
        <div className="provider-row">
          <div className="provider-row-top">
            <div className="provider-info">
              <img 
                src={displayAvatar} 
                alt={displayUserName} 
                className="provider-avatar"
                onError={(e) => {
                  e.target.src = defaultAvatar;
                }}
              />
              <span className="provider-name">{displayUserName}</span>
              {isVerified && (
                <div className="verified-badge">
                  <span className="verified-text">Verified</span>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.9658 8.95046L16.8324 7.63379C16.6158 7.38379 16.4408 6.91712 16.4408 6.58379V5.16712C16.4408 4.28379 15.7158 3.55879 14.8324 3.55879H13.4158C13.0908 3.55879 12.6158 3.38379 12.3658 3.16712L11.0491 2.03379C10.4741 1.54212 9.53242 1.54212 8.94909 2.03379L7.64076 3.17546C7.39076 3.38379 6.91576 3.55879 6.59075 3.55879H5.14909C4.26576 3.55879 3.54076 4.28379 3.54076 5.16712V6.59212C3.54076 6.91712 3.36576 7.38379 3.15742 7.63379L2.03242 8.95879C1.54909 9.53379 1.54909 10.4671 2.03242 11.0421L3.15742 12.3671C3.36576 12.6171 3.54076 13.0838 3.54076 13.4088V14.8338C3.54076 15.7171 4.26576 16.4421 5.14909 16.4421H6.59075C6.91576 16.4421 7.39076 16.6171 7.64076 16.8338L8.95742 17.9671C9.53242 18.4588 10.4741 18.4588 11.0574 17.9671L12.3741 16.8338C12.6241 16.6171 13.0908 16.4421 13.4241 16.4421H14.8408C15.7241 16.4421 16.4491 15.7171 16.4491 14.8338V13.4171C16.4491 13.0921 16.6241 12.6171 16.8408 12.3671L17.9741 11.0505C18.4574 10.4755 18.4574 9.52546 17.9658 8.95046ZM13.4658 8.42546L9.44076 12.4505C9.32409 12.5671 9.16576 12.6338 8.99909 12.6338C8.83242 12.6338 8.67409 12.5671 8.55742 12.4505L6.54076 10.4338C6.29909 10.1921 6.29909 9.79212 6.54076 9.55046C6.78242 9.30879 7.18242 9.30879 7.42409 9.55046L8.99909 11.1255L12.5824 7.54212C12.8241 7.30046 13.2241 7.30046 13.4658 7.54212C13.7074 7.78379 13.7074 8.18379 13.4658 8.42546Z" fill="#135DFF"/>
                  </svg>
                </div>
              )}
            </div>

            {displayReviewCount > 0 && (
              <div 
                className="rating-section rating-clickable"
                onClick={handleRatingClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRatingClick(e)}
                title="Click to see reviews"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc107">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="rating-number">{formattedRating}</span>
              </div>
            )}
          </div>

          <div className="location-text">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>{displayLocation}</span>
          </div>
        </div>

        {/* Third Container: Service title */}
        <h3 className="service-title">{title}</h3>
        
        {/* Fourth Container: Pricing and CTA button */}
        <div className="card-footer">
          <div className="pricing-info">
            <span className="price-label">Starting at</span>
            <span className="price-amount">{displayPrice}</span>
          </div>
          <button className="hire-btn" onClick={handleHireClick}>
            Hire Caregiver
          </button>
        </div>
      </div>

      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={gigReviews}
        stats={reviewStats}
        loading={reviewsLoading}
        gigTitle={title}
      />
    </div>
  );
};

export default ServiceCard;

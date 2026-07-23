import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getInitials, getAvatarColor, isRealProfileImageUrl } from "../../../utils/avatarHelpers";
import "./serviceCard.css";

import GigReviewService from "../../../services/gigReviewService";
import ReviewsModal from "../../../components/ReviewsModal/ReviewsModal";
import VerifiedBadge from "../../../components/VerifiedBadge";

const ServiceCard = ({ 
  id, 
  title, 
  image1, 
  gigImage,
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
  isVerified,
  caregiverIsVerified,
  isIdentityVerified,
  isPremium = false,
  isPopular = false,
  isAvailable = true,
  isPublic = false
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const basePath = "/app/client";

  // Callers use different field names depending on which service produced the
  // data (caregiverIsVerified from the raw gig object, isVerified from the
  // pre-mapped recommendation shape). Fail closed — false, not true — when
  // none of them are present, so an unconfirmed caregiver never shows as
  // "Verified" by default.
  const resolvedIsVerified = isVerified ?? caregiverIsVerified ?? isIdentityVerified ?? false;

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

  const nameFromParts = `${caregiverFirstName || ""} ${caregiverLastName || ""}`.trim();
  const displayUserName = caregiverName?.trim() || nameFromParts || "Care Provider";
  const caregiverFullName = displayUserName;
  const initials = getInitials(caregiverFullName);
  const avatarBackgroundColor = getAvatarColor(caregiverFullName);

  const hasRealProfileImage = isRealProfileImageUrl(caregiverProfileImage);
  const displayLocation = caregiverLocation || "Lagos, Nigeria";
  const displayReviewCount = gigReviewCount;
  const roundedDisplayRating = displayReviewCount > 0 ? Math.round(gigRating) : 0;
  const imgSrc = hasRealProfileImage ? caregiverProfileImage : null;
  const displayPrice = price ? `₦${price.toLocaleString()}` : "Contact for pricing";
  const displayPriceWithUnit = price ? `${displayPrice} /visit` : displayPrice;

  const renderStars = (filledCount) => (
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < filledCount ? 'rating-star-filled' : 'rating-star-empty'}>
        ★
      </span>
    ))
  );

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
        {imgSrc ? (
          <img src={imgSrc} alt={title} className="card-image" />
        ) : (
          <div
            className="card-image card-image--initials"
            style={{ backgroundColor: avatarBackgroundColor }}
            aria-label={displayUserName}
          >
            {initials}
          </div>
        )}

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
        {/* Second Container: Avatar left, meta right */}
        <div className="provider-row">
          <div
            className="provider-avatar provider-avatar-initials"
            style={{ backgroundColor: avatarBackgroundColor }}
          >
            {initials}
          </div>
          <div className="provider-meta">
            <div className="provider-meta-top">
              <div className="provider-name-group">
                <span className="provider-name">{displayUserName}</span>
                <VerifiedBadge isVerified={resolvedIsVerified} variant="inline" />
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
                  <span className="rating-stars">{renderStars(roundedDisplayRating)}</span>
                </div>
              )}
            </div>

            <div className="location-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#22a06b"/>
              </svg>
              <span>{displayLocation}</span>
            </div>
          </div>
        </div>

        {/* Third Container: Service title */}
        <h3 className="service-title">{title}</h3>
        
        {/* Fourth Container: Pricing and CTA button */}
        <div className="card-footer">
          <div className="pricing-info">
            <span className="price-label">Starting at</span>
            <span className="price-amount">{displayPriceWithUnit}</span>
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

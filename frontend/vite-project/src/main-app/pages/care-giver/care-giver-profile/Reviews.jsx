import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";

import CaregiverReviewService from "../../../services/caregiverReviewService";
import "./reviews.css";

// Helper function to render star ratings
const renderStars = (rating) => {
  const stars = [];
  const numStars = Math.max(1, Math.min(5, rating || 5));
  
  for (let i = 0; i < numStars; i++) {
    stars.push(<FaStar key={i} className="rv-review-star" />);
  }
  
  return stars;
};

const Reviews = () => {
  const [reviewsFromApi, setReviewsFromApi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const SectionChevron = () => (
    <svg
      className="pi-section-chevron"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const ReviewsHeader = () => (
    <h3
      className="pi-section-header"
      onClick={() => setIsOpen((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen((v) => !v); } }}
      aria-expanded={isOpen}
    >
      <span>Reviews from Clients</span>
      <SectionChevron />
    </h3>
  );

  // Fetch the caregiver's reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          throw new Error("Caregiver ID not found in local storage.");
        }

        const enrichedReviews = await CaregiverReviewService.getCaregiverReviews(userDetails.id);
        const stats = CaregiverReviewService.calculateReviewStats(enrichedReviews);
        
        setReviewsFromApi(enrichedReviews);
        setFilteredReviews(enrichedReviews);
        setReviewStats(stats);
        
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.message || "Failed to fetch reviews data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
    
    // Cleanup cache when component unmounts
    return () => {
      CaregiverReviewService.clearCache();
    };
  }, []);

  const handleFilter = (rating) => {
    if (rating) {
      const filtered = CaregiverReviewService.filterReviewsByRating(reviewsFromApi, rating);
      setFilteredReviews(filtered);
    } else {
      setFilteredReviews(reviewsFromApi);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`rv-reviews pi-collapsible ${isOpen ? 'open' : ''}`}>
        <ReviewsHeader />
        <div className="pi-section-body">
          <div className="rv-spinner-container">
            <div className="rv-spinner" />
            <p>Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`rv-reviews rv-reviews-empty pi-collapsible ${isOpen ? 'open' : ''}`}>
        <ReviewsHeader />
        <div className="pi-section-body">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  // No reviews state
  if (reviewsFromApi.length === 0) {
    return (
      <div className={`rv-reviews rv-reviews-empty pi-collapsible ${isOpen ? 'open' : ''}`}>
        <ReviewsHeader />
        <div className="pi-section-body">
          <span className="rv-empty-icon">💬</span>
          <p>No reviews yet. Keep providing great service to receive your first review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rv-reviews pi-collapsible ${isOpen ? 'open' : ''}`}>
      <ReviewsHeader />
      <div className="pi-section-body">
      {/* Review Statistics */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <div className="rv-review-stats">
          <div className="rv-stats-summary">
            <span className="rv-total-reviews">
              {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
            </span>
            <span className="rv-average-rating">
              {reviewStats.averageRating}/5 <FaStar className="rv-rating-star" />
            </span>
          </div>
          
          {/* Rating Filter Buttons */}
          <div className="rv-rating-filters">
            <button 
              className="rv-filter-btn"
              onClick={() => handleFilter(null)}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              reviewStats.ratingDistribution[rating] > 0 && (
                <button
                  key={rating}
                  className="rv-filter-btn"
                  onClick={() => handleFilter(rating)}
                >
                  {rating}<FaStar className="rv-filter-star" /> ({reviewStats.ratingDistribution[rating]})
                </button>
              )
            ))}
          </div>
        </div>
      )}

      <div className="rv-review-list">
        {filteredReviews.map((review, index) => (
          <div key={review.id || index} className="rv-review-card">
            <img 
              src={review.client?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.client?.name || 'Client')}&background=3b82f6&color=ffffff&size=48`}
              alt={review.client?.name || 'Client'}
              className="rv-review-avatar"
            />
            <div className="rv-review-content">
              <div className="rv-review-header">
                <h4 className="rv-review-author">{review.client?.name || "Anonymous Client"}</h4>
                <div className="rv-review-rating">
                  <span className="rv-review-stars">
                    {renderStars(review.rating)}
                  </span>
                  <span className="rv-review-rating-text">
                    {review.rating || 5}/5
                  </span>
                </div>
              </div>
              
              <p className="rv-review-text">{review.comment || "Great service!"}</p>
              
              {review.createdAt && (
                <p className="rv-review-date">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default Reviews;

import React, { useState, useEffect } from "react";
import EmptyState from "../../../../components/EmptyState";
import clock from "../../../../assets/main-app/clock.png";
import CaregiverReviewService from "../../../services/caregiverReviewService";
import "./reviews.css";

const Reviews = () => {
  const [reviewsFromApi, setReviewsFromApi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);

  // Fetch caregiver's gigs with reviews using the new service
  useEffect(() => {
    const fetchGigsWithReviews = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          throw new Error("Caregiver ID not found in local storage.");
        }

        const enrichedReviews = await CaregiverReviewService.getGigsWithReviews(userDetails.id);
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

    fetchGigsWithReviews();
    
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
      <div className="reviews">
        <h3>Reviews from Clients</h3>
        <div className="spinner-container">
          <div className="spinner" />
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="reviews reviews-empty">
        <h3>Reviews from Clients</h3>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  // No reviews state
  if (reviewsFromApi.length === 0) {
    return (
      <div className="reviews reviews-empty">
        <h3>Reviews from Clients</h3>
        <span className="empty-icon">💬</span>
        <p>No reviews yet. Keep providing great service to receive your first review!</p>
      </div>
    );
  }

  return (
    <div className="reviews">
      <h3>Reviews from Clients</h3>
      
      {/* Review Statistics */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <div className="review-stats">
          <div className="stats-summary">
            <span className="total-reviews">
              {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
            </span>
            <span className="average-rating">
              {reviewStats.averageRating}/5 ⭐
            </span>
          </div>
          
          {/* Rating Filter Buttons */}
          <div className="rating-filters">
            <button 
              className="filter-btn"
              onClick={() => handleFilter(null)}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              reviewStats.ratingDistribution[rating] > 0 && (
                <button
                  key={rating}
                  className="filter-btn"
                  onClick={() => handleFilter(rating)}
                >
                  {rating}⭐ ({reviewStats.ratingDistribution[rating]})
                </button>
              )
            ))}
          </div>
        </div>
      )}

      <div className="review-list">
        {filteredReviews.map((review, index) => (
          <div key={review.id || index} className="review-card">
            <img 
              src={review.client?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.client?.name || 'Client')}&background=3b82f6&color=ffffff&size=48`}
              alt={review.client?.name || 'Client'}
              className="review-avatar"
            />
            <div className="review-content">
              <div className="review-header">
                <h4 className="review-author">{review.client?.name || "Anonymous Client"}</h4>
                <div className="review-rating">
                  <span className="review-stars">
                    {"⭐".repeat(Math.max(1, Math.min(5, review.rating || 5)))}
                  </span>
                  <span className="review-rating-text">
                    {review.rating || 5}/5
                  </span>
                </div>
              </div>
              
              {/* Gig Information */}
              {review.gig && (
                <div className="review-gig-info">
                  <span className="review-gig-title">Service: {review.gig.title}</span>
                  {review.gig.category && (
                    <span className="review-gig-category"> • {review.gig.category}</span>
                  )}
                </div>
              )}
              
              <p className="review-text">{review.comment || "Great service!"}</p>
              
              {review.createdAt && (
                <p className="review-date">
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
  );
};

export default Reviews;

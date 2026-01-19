import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ReviewsModal.css';
import GigReviewService from '../../services/gigReviewService';

const ReviewsModal = ({
  isOpen,
  onClose,
  reviews = [],
  stats = null,
  loading = false,
  gigTitle = ''
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasReviews = reviews && reviews.length > 0;

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
          {i <= rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  // Render rating bar
  const renderRatingBar = (starCount, count, percentage) => (
    <div className="rating-bar-row" key={starCount}>
      <span className="rating-bar-label">{starCount}★</span>
      <div className="rating-bar-track">
        <div 
          className="rating-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="rating-bar-count">{count}</span>
    </div>
  );

  // Modal content to be portaled
  const modalContent = (
    <div className="reviews-modal-overlay" onClick={onClose}>
      <div 
        className="reviews-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="reviews-modal-header">
          <div className="reviews-modal-title-section">
            <h3 className="reviews-modal-title">Reviews</h3>
            {gigTitle && (
              <p className="reviews-modal-subtitle">{gigTitle}</p>
            )}
          </div>
          <button
            className="reviews-modal-close"
            onClick={onClose}
            aria-label="Close reviews"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="reviews-modal-body">
          {loading ? (
            <div className="reviews-loading">
              <div className="reviews-spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : !hasReviews ? (
            <div className="reviews-empty">
              <div className="reviews-empty-icon">📝</div>
              <h4>No Reviews Yet</h4>
              <p>This service hasn't received any reviews yet. Be the first to leave a review after using this service!</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              {stats && (
                <div className="reviews-stats-section">
                  <div className="reviews-stats-overview">
                    <div className="reviews-average">
                      <span className="reviews-average-number">{stats.averageRating}</span>
                      <div className="reviews-average-stars">
                        {renderStars(Math.round(stats.averageRating))}
                      </div>
                      <span className="reviews-total-count">
                        {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="reviews-distribution">
                      {[5, 4, 3, 2, 1].map(star => 
                        renderRatingBar(
                          star,
                          stats.distribution[star],
                          stats.distributionPercentages[star]
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="reviews-list">
                {reviews.map((review, index) => (
                  <div className="review-item" key={review.id || index}>
                    <div className="review-item-header">
                      <div className="review-item-avatar">
                        {review.clientName ? review.clientName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="review-item-meta">
                        <span className="review-item-name">{review.clientName}</span>
                        <div className="review-item-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <span className="review-item-date">
                        {GigReviewService.formatDate(review.reviewedOn)}
                      </span>
                    </div>
                    {review.message && (
                      <p className="review-item-message">{review.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

export default ReviewsModal;

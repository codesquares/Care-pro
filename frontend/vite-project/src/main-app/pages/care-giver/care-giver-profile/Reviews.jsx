import React, { useState, useEffect } from "react";
import "./reviews.css";

const Reviews = () => {
  const [reviewsFromApi, setReviewsFromApi] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [isLoadingGigs, setIsLoadingGigs] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState("");
  const [filteredReviews, setFilteredReviews] = useState([]);

  // Fetch caregiver's gigs
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem("userDetails"));
        if (!userDetails?.id) {
          throw new Error("Caregiver ID not found in local storage.");
        }

        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/caregiver/caregiverId?caregiverId=${userDetails.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch gigs data.");
        }

        const data = await response.json();
        setGigs(data);
        setIsLoadingGigs(false);
      } catch (err) {
        setError(err.message);
        setIsLoadingGigs(false);
      }
    };

    fetchGigs();
  }, []);

  // Fetch reviews for all gigs once gigs are loaded
  useEffect(() => {
    const fetchAllReviews = async () => {
      if (gigs.length === 0) return;
      
      setIsLoadingReviews(true);
      try {
        const allReviews = [];
        
        // Fetch reviews for each gig
        for (const gig of gigs) {
          const response = await fetch(
            `https://carepro-api20241118153443.azurewebsites.net/api/Reviews?gigId=${gig.id}`
          );
          
          if (response.ok) {
            const gigReviews = await response.json();
            allReviews.push(...gigReviews);
          }
        }
        
        setReviewsFromApi(allReviews);
        setFilteredReviews(allReviews);
        setIsLoadingReviews(false);
      } catch (err) {
        setError("Failed to fetch reviews data.");
        setIsLoadingReviews(false);
      }
    };

    if (!isLoadingGigs && gigs.length > 0) {
      fetchAllReviews();
    } else if (!isLoadingGigs && gigs.length === 0) {
      setIsLoadingReviews(false);
    }
  }, [gigs, isLoadingGigs]);

  const handleFilter = (rating) => {
    const newFilteredReviews = reviewsFromApi.filter((review) => review.rating === rating);
    setFilteredReviews(newFilteredReviews);
  };

  // Loading state
  if (isLoadingGigs || isLoadingReviews) {
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
      <div className="reviews">
        <h3>Reviews from Clients</h3>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  // No reviews state
  if (reviewsFromApi.length === 0) {
    return (
      <div className="reviews">
        <h3>Reviews from Clients</h3>
        <div className="no-reviews">
          <p>No reviews yet. Keep providing great service to receive your first review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews">
      <h3>Reviews from Clients</h3>
      <div className="review-list">
        {filteredReviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-content">
              <div className="review-header">
                <h4 className="review-name">{review.clientName || review.name || "Anonymous Client"}</h4>
                <div className="review-rating">
                  {"⭐".repeat(review.rating || 5)}
                </div>
              </div>
              <p className="review-text">{review.comment || review.review}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;

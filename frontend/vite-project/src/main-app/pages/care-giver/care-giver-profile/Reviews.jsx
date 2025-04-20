import React from "react";
import "./reviews.css";

const reviews = [
  {
    id: 1,
    image: "https://via.placeholder.com/50",
    name: "Josiah Ruben",
    rating: 5,
    review:
      "I can't thank Rufai enough for the care and kindness she provided to my father. Her attention to detail and genuine concern for his well-being went above and beyond our expectations. She always made sure he was comfortable, listened to his stories...",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/50",
    name: "Josiah Ruben",
    rating: 5,
    review:
      "Rufai's care for my father was exceptional. She listened, showed empathy, and delivered professional service. Highly recommend her.",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/50",
    name: "Josiah Ruben",
    rating: 5,
    review:
      "Highly professional and compassionate. Rufai exceeded our expectations in every aspect.",
  },
  {
    id: 4,
    image: "https://via.placeholder.com/50",
    name: "Josiah Ruben",
    rating: 5,
    review:
      "Thank you, Rufai, for your dedication and care. My father felt comfortable and cared for throughout.",
  },
];

const Reviews = () => (
  <div className="reviews">
    <h3>Reviews from Clients</h3>
    <div className="review-list">
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          {/* <img
            // src={review.image}
            alt={review.name}
            className="review-avatar"
          /> */}
          <div className="review-content">
            <div className="review-header">
              <h4 className="review-name">{review.name}</h4>
              <div className="review-rating">
                {"⭐".repeat(review.rating)}
              </div>
            </div>
            <p className="review-text">{review.review}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Reviews;

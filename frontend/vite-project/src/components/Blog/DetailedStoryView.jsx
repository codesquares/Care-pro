import React from "react";
import "../../styles/components/detailed-story-view.scss";

const DetailedStoryView = ({ story, goBack }) => {
  return (
    <div className="detailed-story-view">
      <button className="back-button" onClick={goBack}>
        ← Back to Stories
      </button>
      <div className="story-content">
        <h2>{story.title}</h2>
        <img src={story.imgSrc} alt={story.title} className="story-image" />
        <p>{story.fullContent}</p>
      </div>
    </div>
  );
};

export default DetailedStoryView;

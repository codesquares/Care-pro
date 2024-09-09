import { useState } from "react";
import "../../styles/components/stories-section.scss";
import storyImage1 from "../../assets/story1.png";
import storyImage2 from "../../assets/story2.png";
import storyImage3 from "../../assets/story3.png";
import storyImage4 from "../../assets/story4.png";
import storyImage5 from "../../assets/story5.png";
import DetailedStoryView from "./DetailedStoryView"; // New component

// Define the categories list here
const categories = [
  "All",
  "Healthcare stories",
  "Teeth care",
  "Healthy living",
  "Elder tips",
  "Good nutrition",
  "Reading Treats",
  "Age wise"
];

const storiesData = [
  {
    title: "Top Tips for Preventing Caregiver Burnout",
    description:
      "Discusses strategies caregivers can use to manage stress, maintain their well-being, and prevent burnout...",
    fullContent:
      "Burnout is a common issue among caregivers. Here's how to prevent it by following specific strategies...",
    imgSrc: storyImage1,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage3,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage4,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage5,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description:
      "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent:
      "Dementia is a complex condition that affects millions of people worldwide. This blog offers...",
    imgSrc: storyImage2,
    category: "Good nutrition",
  },
  // Add more stories as needed
];

const StoriesSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStory, setSelectedStory] = useState(null);

  const filteredStories =
    selectedCategory === "All"
      ? storiesData
      : storiesData.filter((story) => story.category === selectedCategory);

  const handleStoryClick = (story) => {
    setSelectedStory(story);
  };

  return (
    <section className="stories-section">
      {!selectedStory ? (
        <>
          <h2>Learn about us through our stories...</h2>
          <p className="subtitle">
            Good reads on health and the benefits of having a caregiver
          </p>
          <div className="categories">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`category-btn ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="stories-grid">
            {filteredStories.map((story, index) => (
              <div
                key={index}
                className="story-card"
                onClick={() => handleStoryClick(story)}
              >
                <img
                  src={story.imgSrc}
                  alt={story.title}
                  className="story-image"
                />
                <h3>{story.title}</h3>
                <p>{story.description}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <DetailedStoryView
          story={selectedStory}
          goBack={() => setSelectedStory(null)}
        />
      )}
    </section>
  );
};

export default StoriesSection;

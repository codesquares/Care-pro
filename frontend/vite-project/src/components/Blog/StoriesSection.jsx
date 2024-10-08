import { useState } from "react";
import "../../styles/components/stories-section.scss";
import storyImage1 from "../../assets/story1.png";
import storyImage2 from "../../assets/story2.png";
import storyImage3 from "../../assets/story3.png";
import storyImage4 from "../../assets/story4.png";
import storyImage5 from "../../assets/story5.png";
import DetailedStoryView from "./DetailedStoryView";

// Define the categories list here
const categories = [
  "All",
  "Healthcare stories",
  "Teeth care",
  "Healthy living",
  "Elder tips",
  "Good nutrition",
  "Reading Treats",
  "Age wise",
];

const storiesData = [
  {
    title: "Luxury Care: Why Premium Concierge Healthcare Services Are Worth the Investment",
    description: "Quality and comfort is supreme for the best healthcare experience...",
    fullContent: `Quality and comfort is supreme for the best healthcare experience. Luxury care has become an essential offering...`, 
    imgSrc: storyImage1,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide...`, 
    imgSrc: storyImage2,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide...`, 
    imgSrc: storyImage3,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide...`, 
    imgSrc: storyImage4,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide...`, 
    imgSrc: storyImage5,
    category: "Teeth care",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide...`, 
    imgSrc: storyImage2,
    category: "Good nutrition",
  },
  // Add more unique stories as needed
];


const StoriesSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display 6 items per page

  // Filter stories by category
  const filteredStories =
    selectedCategory === "All"
      ? storiesData
      : storiesData.filter((story) => story.category === selectedCategory);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStories.length / itemsPerPage);

  const indexOfLastStory = currentPage * itemsPerPage;
  const indexOfFirstStory = indexOfLastStory - itemsPerPage;
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);

  // Handle page changes
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleStoryClick = (story) => {
    setSelectedStory(story);
  };

  return (
    <section className="stories-section">
      {!selectedStory ? (
        <>
          <h2 className="main-title">Learn about us through our stories...</h2>
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
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1); // Reset to the first page when category changes
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Check if there are stories to show */}
          {currentStories.length > 0 ? (
            <div className="stories-grid">
              {currentStories.map((story, index) => (
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
                  <p>{story.description}</p> {/* Only short description is shown here */}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-stories-message">
            No stories available for this category.
          </div>
          )}

          {/* Pagination Controls */}
          {filteredStories.length > itemsPerPage && (
            <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={nextPage} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <DetailedStoryView
          story={selectedStory}  // Pass the full story object including fullContent
          goBack={() => setSelectedStory(null)}
        />
      )}
    </section>
  );
};

export default StoriesSection;


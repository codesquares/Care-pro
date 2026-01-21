import { useState } from "react";
import "../../styles/components/stories-section.css";
import storyImage1 from "../../assets/story1.png";
import storyImage2 from "../../assets/story2.png";
import storyImage3 from "../../assets/story3.png";
import storyImage4 from "../../assets/story4.png";
import storyImage5 from "../../assets/story5.png";
import DetailedStoryView from "./DetailedStoryView";

// Define the categories list here
const categories = [
  "All",
  "Healthcare",
  "Holistic Living",
  "Health Tech",
  "The CarePro Experience",
  "Mindful Wellness",
  "Healthy Nutrition",
  "Aesthetic and Cosmetic Treatments",
];

const storiesData = [
  {
    title: "Benefits of Personalised Care in Dementia Management",
    description: "Dementia affects over 55 million people worldwide. This condition creates challenges...",
    fullContent: `Dementia affects over 55 million people worldwide. This condition creates challenges for those diagnosed and their families because it affects daily life and requires a lot of support. Different approaches have been sought after to manage the condition, one that has worked well is personalised in-home care, which has shown progress in dementia management.

    Understanding Dementia:
    Dementia is the loss of cognitive functioning that impairs memory, thinking, and daily functioning. Those affected often struggle with memory loss, confusion, and difficulty with regular tasks, leading to increased anxiety and emotional distress.

    Types of Progressive Dementia include:
    - Alzheimer's disease
    - Vascular dementia
    - Lewy body dementia
    - Frontotemporal dementia

    The risk factors for progressive dementia are age, family history, depression, head trauma, diet, and exercise.

    The Evolution of Dementia Care:
    Dementia care was once used primarily in institutional settings. However, research has shown that a personalised approach, focusing on familiarity, can reduce the mental stress of people living with dementia.

    Benefits of Personalised Care:
    - **Familiar Environment:** Being surrounded by cherished memories and loved ones at home promotes a sense of security.
    - **Tailored Support:** Care is curated to match the patient's lifestyle and needs, providing more respect and sensitivity.
    - **Emotional Well-Being:** Familiarity and routine can help reduce anxiety and stabilise mood swings.
    - **Cost-Effectiveness:** Personalised care offers an affordable alternative to institutional settings, allowing families to allocate resources more efficiently.

    Support Systems:
    - **Professional Assistance:** Hiring trained caregivers can help alleviate family burnout.
    - **Support Communities:** Joining local support groups or workshops can provide comfort and shared experiences for families.

    Conclusion:
    Personalised care for individuals with dementia is a holistic approach, as it meets each individual’s unique needs while also providing emotional support.

    [External Link: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5795848/]

    FAQ:
    - **What is the best care option for someone with dementia?** Home care is often the best choice, offering a familiar environment and tailored support.
    - **How can caregivers prevent burnout?** By seeking professional help and taking regular breaks.
    - **Is home care more affordable than assisted living?** Yes, home care is typically more cost-effective than institutional care.`,
    imgSrc: storyImage1,
    category: "Healthcare stories",
  },
  {
    title: "Understanding Dementia: A Caregiver’s Perspective",
    description: "Insights into dementia from a caregiver’s perspective, highlighting the challenges...",
    fullContent: `Dementia is a complex condition that affects millions of people worldwide. Understanding its nuances can greatly enhance the quality of care provided by caregivers. They face numerous challenges, from communication difficulties to emotional burdens. This blog aims to shed light on these challenges and offer strategies for managing them effectively. Additionally, it provides resources and support networks for caregivers to help them navigate this journey...`,
    imgSrc: storyImage2,
    category: "Healthcare stories",
  },
  {
    title: "Empowering Recovery: Stroke Rehabilitation at Home",
    description: "Recovering from a stroke requires compassion and profound care. While medical support...",
    fullContent:  `
    Recovering from a stroke requires compassion and profound care. While medical support is crucial, much of the rehabilitation process can happen in the comfort of home.

    Challenges of Stroke Recovery:
    - **Speech and Communication Difficulties:** Aphasia often impairs survivors' ability to communicate, leading to frustration.
    - **Emotional Changes:** Depression, anxiety, and mood swings are common.
    - **Cognitive Challenges:** Memory, attention, and problem-solving abilities may be affected.
    - **Social Isolation:** Physical or cognitive impairments can cause survivors to withdraw from social activities.
    - **Caregiver Fatigue:** Family caregivers often experience burnout.
    - **Multiple Health Conditions:** Managing hypertension, diabetes, or heart disease alongside stroke recovery is often challenging.

    Empowered Care Strategies:
    - **Seek Professional Assistance:** In-home healthcare services provide support and monitor progress.
    - **Create a Supportive Environment:** Ensure safety and accessibility at home.
    - **Set Realistic Goals:** Collaborate with healthcare providers and celebrate small victories.
    - **Incorporate Therapy into Daily Life:** Engage in daily activities like cooking and gardening to aid rehabilitation.
    - **Encourage Communication:** Open communication about feelings and frustrations can improve recovery.
    - **Utilise Technology:** Leverage apps for speech, memory, and physical exercises.
    - **Build a Support Network:** Join support groups for encouragement and practical advice.
    - **Focus on Nutrition:** A healthy diet is vital for recovery.

    Benefits of Empowered Home Care:
    - **Enhanced Comfort:** Familiar environments reduce anxiety and promote emotional well-being.
    - **Individualised Care:** Tailored attention leads to better outcomes.
    - **Stronger Family Bonds:** Family involvement strengthens relationships.
    - **Greater Independence:** Survivors regain a sense of control by participating in their recovery.
    - **Cost-Effective:** Home care is often more affordable than hospital stays or outpatient therapy.

    Conclusion:
    Stroke recovery is challenging but can be greatly enhanced by compassionate care at home, focusing on activities of daily living and emotional support to improve health outcomes.
  `,
    imgSrc: storyImage3,
    category: "Teeth care",
  },
  {
    title: "The Role of Caregivers: Acknowledging Their Impact",
    description: "Recognizing the vital role caregivers play in the health system...",
    fullContent: `Caregivers are often the unsung heroes in the healthcare system. They provide essential support to patients and their families, ensuring that care is delivered effectively and compassionately. This blog highlights the challenges caregivers face, the importance of their role in patient recovery, and the need for more recognition and support for their invaluable contributions. It also discusses resources available for caregivers to help them manage their responsibilities...`,
    imgSrc: storyImage4,
    category: "Healthcare stories",
  },
  {
    title: "Nutrition and Health: Exploring the Connection",
    description: "Examining how nutrition impacts health outcomes...",
    fullContent: `Nutrition is fundamental to health, affecting everything from energy levels to chronic disease management. This blog delves into the relationship between diet and health, exploring how various nutrients contribute to physical and mental well-being. It also offers practical tips for maintaining a balanced diet, discusses common nutritional deficiencies, and emphasizes the role of nutrition in preventive healthcare...`,
    imgSrc: storyImage5,
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
          Let our expertise guide and inspire you.
          </p>
          <div className="categories">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`category-btn ${selectedCategory === category ? "active" : ""}`}
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

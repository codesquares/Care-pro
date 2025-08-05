import { useState } from "react";
import "./gigs.scss";

const GigsCard = ({
  categories,
  onSearchTagChange,
  onCategoryChange,
  onSubCategoryChange,
  onTitleChange,
  formData,
}) => {
  const [tagsInput, setTagsInput] = useState("");

  const handleTagsChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);
    onSearchTagChange(value.split(",").map((t) => t.trim()).filter(Boolean));
  };

  return (
    <div className="gigs-overview-card">
      <form className="gigs-form-body">
        {/* Gig Title Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Gig title</h3>
            <p>
              Your gig title is the most important place to include keywords that Clients would likely use to search for a service like yours.
            </p>
          </div>
          <div className="gigs-card-input full-width">
            <textarea
              rows={3}
              value={formData.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="I will take care of your pets"
            />
          </div>
        </div>

        {/* Category Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Category</h3>
            <p>Choose the category and sub-category most suitable for your Gig.</p>
          </div>
          <div className="gigs-card-input double-dropdown">
            <select
              onChange={(e) => onCategoryChange(e.target.value)}
              value={formData.category}
            >
              <option value="">Service Category</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => onSubCategoryChange([e.target.value])}
              value={formData.subcategory[0] || ""}
              disabled={!formData.category}
            >
              <option value="">Service Subcategory</option>
              {formData.category &&
                categories[formData.category]?.map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Search Tags */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Search Tags</h3>
            <p>
              Tag your Gig with buzz words that are relevant to the services you offer. Use all 5 tags to get found.
            </p>
          </div>
          <div className="gigs-card-input full-width">
            <input
              type="text"
              placeholder="Add search tags separated by commas"
              value={tagsInput}
              onChange={handleTagsChange}
            />
            <div className="tag-preview">
              {formData.searchTags?.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GigsCard;

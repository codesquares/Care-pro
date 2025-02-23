import { useState } from "react";
import "./gigs.scss";
import Input from "../input/Input";

const GigsCard = ({ categories, onSearchTagChange, onCategoryChange, onSubCategoryChange, onTitleChange, formData }) => {
  

  return (
    <div className="gigs-card">
      <form>
        {/* Gig Title Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Gig Title</h3>
            <p className="gigs-card-title-instructions">
              Your gig title is the most important place to include keywords that Clients would likely use to search for a service like yours.
            </p>
          </div>
          <div className="gigs-card-input">
            <Input
              name="titleInput"
              type="text"
              value={formData.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="I will take care of your pet"
            />
          </div>
        </div>

        {/* Category Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Category</h3>
            <p className="gigs-card-category-instructions">
              Choose the category that best fits your gig.
            </p>
          </div>
          <div className="gigs-card-input">
            <select
              id="category"
              onChange={(e) => {
                const selectedCategory = e.target.value;
                onCategoryChange(selectedCategory); // Notify parent of category change
              }}
            >
              <option value="">Select a category</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              id="subcategory"
              onChange={(e) => onSubCategoryChange(e.target.value)}
              disabled={!categories}
            >
              <option value="">Select a subcategory</option>
              {categories[formData.category] &&
                categories[formData.category].map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Search Tags Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Search Tags</h3>
            <p className="gigs-card-search-tags-instructions">
              Tag your Gig with buzz words that are relevant to the services you render. Use all 5 tags to help Buyers find your gig.
            </p>
          </div>
          <div className="gigs-card-input">
            <Input
              name="searchTags"
              type="text"
              onChange={(e) => onSearchTagChange(e.target.value.split(","))}
              placeholder="Add search tags separated by a comma"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default GigsCard;

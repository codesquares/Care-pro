import { useState } from "react";
import "./gigs.scss";
import Input from "../input/Input";

const GigsCard = ({
  categories,
  onSearchTagChange,
  onCategoryChange,
  onSubCategoryChange,
  onTitleChange,
  onFieldFocus,
  onFieldBlur,
  onFieldHover,
  onFieldLeave,
  formData,
  validationErrors = {},
  clearValidationErrors,
}) => {
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
              onFocus={() => onFieldFocus('title')}
              onBlur={onFieldBlur}
              placeholder="I will take care of your pet"
              className={validationErrors.title ? 'error' : ''}
            />
            {validationErrors.title && (
              <div className="validation-error">
                {validationErrors.title}
              </div>
            )}
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
                onCategoryChange(selectedCategory);
              }}
              onFocus={() => onFieldFocus('category')}
              onBlur={onFieldBlur}
              value={formData.category}
              className={validationErrors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <div className="validation-error">
                {validationErrors.category}
              </div>
            )}
          </div>

          {/* Subcategory */}
          {formData.category && (
            <div className="subcategory-section">
              <h4>Select Subcategories</h4>
              <div 
                className={`subcategory-checkbox-group ${validationErrors.subcategory ? 'error' : ''}`}
                onMouseEnter={() => onFieldHover && onFieldHover('subcategory')}
                onMouseLeave={onFieldLeave}
              >
                {categories[formData.category]?.map((subCategory) => (
                  <label key={subCategory} className="subcategory-checkbox">
                    <input
                      className="checkbox-input"
                      type="checkbox"
                      value={subCategory}
                      checked={formData.subcategory.includes(subCategory)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          onSubCategoryChange([...formData.subcategory, subCategory]);
                        } else {
                          onSubCategoryChange(
                            formData.subcategory.filter((s) => s !== subCategory)
                          );
                        }
                      }}
                    />
                    <span>{subCategory}</span>
                  </label>
                ))}
              </div>
              {validationErrors.subcategory && (
                <div className="validation-error">
                  {validationErrors.subcategory}
                </div>
              )}
            </div>
          )}
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
              onFocus={() => onFieldFocus('searchTags')}
              onBlur={onFieldBlur}
              placeholder="Add search tags separated by a comma"
              className={validationErrors.searchTags ? 'error' : ''}
            />
            {validationErrors.searchTags && (
              <div className="validation-error">
                {validationErrors.searchTags}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default GigsCard;

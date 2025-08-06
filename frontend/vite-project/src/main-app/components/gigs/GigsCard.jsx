import { useState } from "react";
import "./gigs.scss";

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
  const [tagsInput, setTagsInput] = useState("");

  const handleTagsChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);
    onSearchTagChange(value.split(",").map((t) => t.trim()).filter(Boolean));
  };

  return (
    <div className="gigs-overview-card">
      <div className="gigs-form-body">
        {/* Gig Title Section */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Gig title</h3>
            <p>
              Your gig title is the most important place to include keywords that Clients would likely use to search for a service like yours.
            </p>
          </div>
          <div className="gigs-card-input">
            <textarea
              rows={3}
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
            <p>Choose the category and sub-category most suitable for your Gig.</p>
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
              <option value="">Service Category</option>
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
              <div className="subcategory-header">
                <h4>Select Subcategories</h4>
                <span className="subcategory-count">
                  {formData.subcategory.length} of 5 selected
                </span>
              </div>
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
                    <span className="checkbox-label">{subCategory}</span>
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

        {/* Search Tags */}
        <div className="gigs-card-section">
          <div className="gigs-card-details">
            <h3>Search Tags</h3>
            <p>
              Tag your Gig with buzz words that are relevant to the services you offer. Use all 5 tags to get found.
            </p>
          </div>
          <div className="gigs-card-input">
            <input
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
            {formData.searchTags && formData.searchTags.length > 0 && (
              <div className="tags-preview">
                {formData.searchTags.map((tag, index) => (
                  <span key={index} className="tag-pill">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigsCard;

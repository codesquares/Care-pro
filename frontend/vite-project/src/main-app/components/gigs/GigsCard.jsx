import { useState, useRef } from "react";
import { useGigForm } from "../../contexts/GigEditContext";
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
  clearValidationErrors,
}) => {
  const [tagsInput, setTagsInput] = useState("");
  const [showLimitError, setShowLimitError] = useState(false);
  const tagInputRef = useRef(null);
  const { formData, validationErrors, updateField } = useGigForm();

  // Utility function to normalize strings for comparison
  const normalizeString = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Enhanced subcategory matching function
  const isSubcategorySelected = (uiSubcategory, savedSubcategories) => {
    if (!savedSubcategories || !Array.isArray(savedSubcategories)) return false;
    
    const normalizedUiSubcat = normalizeString(uiSubcategory);
    
    // Try exact match first
    if (savedSubcategories.includes(uiSubcategory)) {
      return true;
    }
    
    // Try normalized match
    return savedSubcategories.some(savedSubcat => 
      normalizeString(savedSubcat) === normalizedUiSubcat
    );
  };

  // Debug: Log current formData with enhanced subcategory details
  console.log('🔍 DEBUG - GigsCard formData:', {
    title: formData.title,
    category: formData.category,
    subcategory: formData.subcategory,
    searchTags: formData.searchTags,
    isEditMode: formData.isEditMode
  });

  // Debug: Log subcategory comparison details when in edit mode
  if (formData.subcategory && formData.subcategory.length > 0) {
    console.log('🔍 DEBUG - Saved subcategories:', formData.subcategory);
    console.log('🔍 DEBUG - Available categories for current category:', categories[formData.category]);
    
    if (categories[formData.category]) {
      categories[formData.category].forEach(uiSubcat => {
        const isSelected = isSubcategorySelected(uiSubcat, formData.subcategory);
        console.log(`🔍 DEBUG - UI: "${uiSubcat}" | Selected: ${isSelected} | Saved subcats: [${formData.subcategory.join(', ')}]`);
      });
    }
  }

  const handleTagsChange = (e) => {
    const value = e.target.value;
    setTagsInput(value);
    
    // Handle comma-separated input
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0 && tag.length <= 20);
      const lastTag = newTags[newTags.length - 1];
      
      if (newTags.length > 1) {
        const tagsToAdd = newTags.slice(0, -1);
        const currentTags = formData.searchTags || [];
        // Filter out duplicates and ensure we don't exceed 5 tags
        const uniqueTagsToAdd = tagsToAdd.filter(tag => !currentTags.includes(tag));
        const updatedTags = [...currentTags, ...uniqueTagsToAdd].slice(0, 5);
        updateField('searchTags', updatedTags);
        if (onSearchTagChange) onSearchTagChange(updatedTags);
        setTagsInput(lastTag || "");
      }
    }
  };

  const handleTagKeyDown = (e) => {
    const currentTags = formData.searchTags || [];
    
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      const trimmedTag = tagsInput.trim();
      if (trimmedTag && 
          trimmedTag.length >= 2 && 
          trimmedTag.length <= 20 && 
          !currentTags.includes(trimmedTag) && 
          currentTags.length < 5) {
        const updatedTags = [...currentTags, trimmedTag];
        updateField('searchTags', updatedTags);
        if (onSearchTagChange) onSearchTagChange(updatedTags);
        setTagsInput("");
      }
    } else if (e.key === 'Backspace' && !tagsInput && currentTags.length > 0) {
      // Remove last tag when backspace is pressed and input is empty
      const updatedTags = currentTags.slice(0, -1);
      updateField('searchTags', updatedTags);
      if (onSearchTagChange) onSearchTagChange(updatedTags);
    }
  };

  const removeTag = (indexToRemove) => {
    const currentTags = formData.searchTags || [];
    const updatedTags = currentTags.filter((_, index) => index !== indexToRemove);
    updateField('searchTags', updatedTags);
    if (onSearchTagChange) onSearchTagChange(updatedTags);
  };

  const handleTagInputBlur = () => {
    // Add remaining input as tag if it exists and meets criteria
    const currentTags = formData.searchTags || [];
    const trimmedInput = tagsInput.trim();
    if (trimmedInput && 
        trimmedInput.length >= 2 && 
        trimmedInput.length <= 20 && 
        !currentTags.includes(trimmedInput) && 
        currentTags.length < 5) {
      const updatedTags = [...currentTags, trimmedInput];
      updateField('searchTags', updatedTags);
      if (onSearchTagChange) onSearchTagChange(updatedTags);
      setTagsInput("");
    }
    if (onFieldBlur) onFieldBlur();
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
              onChange={(e) => {
                updateField('title', e.target.value);
                if (onTitleChange) onTitleChange(e.target.value);
              }}
              onFocus={() => onFieldFocus && onFieldFocus('title')}
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
                updateField('category', selectedCategory);
                updateField('subcategory', []); // Reset subcategory when category changes
                if (onCategoryChange) onCategoryChange(selectedCategory);
              }}
              onFocus={() => onFieldFocus && onFieldFocus('category')}
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
                <span className={`subcategory-count ${formData.subcategory.length >= 5 ? 'at-limit' : ''}`}>
                  {formData.subcategory.length} of 5 selected
                  {formData.subcategory.length >= 5 && " (Maximum reached)"}
                </span>
              </div>
              <div 
                className={`subcategory-checkbox-group ${validationErrors.subcategory ? 'error' : ''}`}
                onMouseEnter={() => onFieldHover && onFieldHover('subcategory')}
                onMouseLeave={onFieldLeave}
              >
                {categories[formData.category]?.map((subCategory) => {
                  const isSelected = isSubcategorySelected(subCategory, formData.subcategory);
                  const isAtLimit = formData.subcategory.length >= 5;
                  const isDisabled = !isSelected && isAtLimit;
                  
                  // Debug individual subcategory check
                  console.log(`🔍 DEBUG - Checking "${subCategory}": selected=${isSelected}, disabled=${isDisabled}`);
                  
                  return (
                    <label key={subCategory} className={`subcategory-checkbox ${isDisabled ? 'disabled' : ''}`}>
                      <input
                        className="checkbox-input"
                        type="checkbox"
                        value={subCategory}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let updatedSubcategories;
                          
                          if (isChecked) {
                            // Prevent selection if already at max limit
                            if (formData.subcategory.length >= 5) {
                              // Show immediate validation feedback
                              setShowLimitError(true);
                              // Focus the field to show validation
                              if (onFieldFocus) onFieldFocus('subcategory');
                              // Hide error after 3 seconds
                              setTimeout(() => setShowLimitError(false), 3000);
                              return; // Don't proceed with the selection
                            }
                            updatedSubcategories = [...formData.subcategory, subCategory];
                          } else {
                            // Remove the subcategory using normalized comparison
                            updatedSubcategories = formData.subcategory.filter((savedSubcat) => {
                              const normalizedSaved = normalizeString(savedSubcat);
                              const normalizedCurrent = normalizeString(subCategory);
                              return normalizedSaved !== normalizedCurrent;
                            });
                            // Clear limit error when deselecting
                            setShowLimitError(false);
                          }
                          
                          console.log('🔍 DEBUG - Subcategory change:', {
                            action: isChecked ? 'add' : 'remove',
                            subcategory: subCategory,
                            oldArray: formData.subcategory,
                            newArray: updatedSubcategories
                          });
                          
                          updateField('subcategory', updatedSubcategories);
                          if (onSubCategoryChange) onSubCategoryChange(updatedSubcategories);
                        }}
                      />
                      <span className="checkbox-label">{subCategory}</span>
                    </label>
                  );
                })}
              </div>
              {showLimitError && (
                <div className="validation-error limit-error">
                  Maximum 5 subcategories allowed
                </div>
              )}
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
            <div className={`tag-input-container ${validationErrors.searchTags ? 'error' : ''} ${(formData.searchTags || []).length >= 5 ? 'tag-limit-reached' : ''}`}>
              <div className="tag-input-wrapper">
                {(formData.searchTags || []).map((tag, index) => (
                  <span key={index} className="tag-pill-inside">
                    {tag}
                    <button 
                      type="button" 
                      className="tag-remove-btn"
                      onClick={() => removeTag(index)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagsInput}
                  onChange={handleTagsChange}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => onFieldFocus('searchTags')}
                  onBlur={handleTagInputBlur}
                  placeholder={(formData.searchTags || []).length === 0 ? "Add tags (press Enter or use comma to separate)" : (formData.searchTags || []).length >= 5 ? "Tag limit reached" : ""}
                  className="tag-input-field"
                  maxLength={20}
                  disabled={(formData.searchTags || []).length >= 5}
                />
              </div>
            </div>
            <div className="tag-input-helper">
              <span className={`tag-counter ${(formData.searchTags || []).length >= 5 ? 'tag-limit-reached' : ''}`}>
                {(formData.searchTags || []).length} of 5 tags used
              </span>
              <span className="tag-instruction">Press Enter or use comma to add tags. Max 20 characters per tag.</span>
            </div>
            {validationErrors.searchTags && (
              <div className="validation-error">
                {validationErrors.searchTags}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigsCard;

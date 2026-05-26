import { useState } from "react";
import "./galleryUploads.css";

const GalleryUploads = ({ 
  onFileChange, 
  onFieldFocus, 
  onFieldBlur, 
  validationErrors = {}, 
  imagePreview, 
  selectedFile,
  imageRejectionError = null,
  fileInputRef = null
}) => {
  // Remove local state since we get preview from parent
  // const [imagePreviews, setImagePreviews] = useState([null, null, null]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // Just call the parent's onFileChange - no duplicate FileReader needed
    if (onFileChange) onFileChange(e, index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event object for consistency with file input
      const syntheticEvent = {
        target: {
          files: files
        }
      };
      handleImageChange(syntheticEvent, index);
    }
  };

  return (
    <div className="gig-gallery-uploads">
      <div className="galleryUploads">
        <div className="uploads-card-section">
          <div className="uploads-card-details">
            <h3>Cover Image</h3>
            <p className="gigs-card-gallery-instructions">
              Upload one image to showcase your service. Drag & drop or click to browse.
            </p>
            <ul className="gallery-requirements">
              <li>Use a high-res image that represents your service</li>
              <li>Show your professionalism</li>
              <li>Supported formats: JPEG, PNG, WebP. Max size: 5MB</li>
            </ul>
            {selectedFile && (
              <div className="file-info">
                <small>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            )}
            {validationErrors.image1 && (
              <div className="validation-error">
                {validationErrors.image1}
              </div>
            )}
            {imageRejectionError && (
              <div className="image-rejection-error">
                <p className="image-rejection-reason">{imageRejectionError.reason}</p>
                {imageRejectionError.suggestions.length > 0 && (
                  <>
                    <p className="image-rejection-suggestions-label">Try one of these:</p>
                    <ul className="image-rejection-suggestions">
                      {imageRejectionError.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="uploads-card-area">
            <div className="main-image-upload">
              <label 
                className={`file-upload-large ${isDragOver ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
                onMouseEnter={() => onFieldFocus('gallery-upload')}
                onMouseLeave={onFieldBlur}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 0)}
              >
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img
                      src={imagePreview}
                      alt="Service preview"
                      className="full-size-preview"
                    />
                    <div className="image-overlay">
                      <button
                        type="button"
                        className="change-image-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Trigger file input click
                          e.target.closest('label').querySelector('input[type="file"]').click();
                        }}
                        title="Change image"
                      >
                        📷 Change Image
                      </button>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onFileChange) {
                            const clearEvent = { target: { files: [] } };
                            onFileChange(clearEvent, 0);
                          }
                        }}
                        title="Remove image"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">
                      <span className="primary-text">Drag & drop a Photo or</span>
                      <span className="secondary-text">Browse</span>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImageChange(e, 0)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryUploads;

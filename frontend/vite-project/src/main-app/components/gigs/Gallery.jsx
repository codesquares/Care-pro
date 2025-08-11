import { useState } from "react";
import "./galleryUploads.scss";

const GalleryUploads = ({ 
  onFileChange, 
  onFieldFocus, 
  onFieldBlur, 
  validationErrors = {}, 
  imagePreview, 
  selectedFile 
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
            <h3>Image (Required)</h3>
            <p className="gigs-card-gallery-instructions">
              Upload a high-quality image to showcase your service. Drag & drop or click to browse.
              <br />
              <small>Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.</small>
            </p>
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
          </div>

          <div className="uploads-card-area">
            {[0].map((index) => (
              <div className="uploads-card-input" key={index}>
                <label 
                  className={`file-upload ${isDragOver ? 'drag-over' : ''}`}
                  onMouseEnter={() => onFieldFocus('gallery-upload')}
                  onMouseLeave={onFieldBlur}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="upload-area">
                    {imagePreview ? (
                      <div className="image-container">
                        <img
                          src={imagePreview}
                          alt={`Preview ${index + 1}`}
                          className="galleryImage"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onFileChange) {
                              // Clear the image by calling onFileChange with empty event
                              const clearEvent = { target: { files: [] } };
                              onFileChange(clearEvent, index);
                            }
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="placeholder-content">
                        <div className="placeholder-icon">📷</div>
                        <span>Drag & drop image or</span>
                        <p>Click to browse</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, index)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryUploads;

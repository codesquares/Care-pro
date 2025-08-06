import { useState } from "react";
import "./galleryUploads.scss";

const GalleryUploads = ({ onFileChange, onFieldFocus, onFieldBlur, validationErrors = {} }) => {
  const [imagePreviews, setImagePreviews] = useState([null, null, null]);

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPreviews = [...imagePreviews];
      newPreviews[index] = reader.result;
      setImagePreviews(newPreviews);
    };
    reader.readAsDataURL(file);

    if (onFileChange) onFileChange(e, index);
  };

  return (
    <div className="gig-gallery-uploads">
      <div className="galleryUploads">
        <div className="uploads-card-section">
          <div className="uploads-card-details">
            <h3>Images (up to 3)</h3>
            <p className="gigs-card-gallery-instructions">
              Get noticed by the right clients with visual examples of your work.
            </p>
            {validationErrors.image1 && (
              <div className="validation-error">
                {validationErrors.image1}
              </div>
            )}
          </div>

          <div className="uploads-card-area">
            {[0, 1, 2].map((index) => (
              <div className="uploads-card-input" key={index}>
                <label 
                  className="file-upload"
                  onMouseEnter={() => onFieldFocus('gallery-upload')}
                  onMouseLeave={onFieldBlur}
                >
                  <div className="upload-area">
                    {imagePreviews[index] ? (
                      <img
                        src={imagePreviews[index]}
                        alt={`Preview ${index + 1}`}
                        className="galleryImage"
                      />
                    ) : (
                      <div className="placeholder-content">
                        <div className="placeholder-icon">📷</div>
                        <span>Drag & drop Photo or</span>
                        <p>Browse</p>
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

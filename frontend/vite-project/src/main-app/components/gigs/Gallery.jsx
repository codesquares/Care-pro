import { useState } from "react";
import "./galleryUploads.scss";

const GalleryUploads = ({ onFileChange, onVideoChange, onFieldFocus, onFieldBlur, validationErrors = {} }) => {
  const [imagePreviews, setImagePreviews] = useState([null, null, null]);
  const [videoPreview, setVideoPreview] = useState(null);

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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const videoURL = URL.createObjectURL(file);
    setVideoPreview(videoURL);

    if (onVideoChange) onVideoChange(e);
  };

  return (
    <div className="gallery">
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

        <div className="uploads-card-section">
          <div className="uploads-card-details">
            <h3>Video</h3>
            <p className="gigs-card-video-instructions">
              Capture client's attention with a short video that showcases your services.
            </p>
          </div>

          <div className="uploads-card-input video-area">
            <label 
              className="file-upload"
              onMouseEnter={() => onFieldFocus('gallery-upload')}
              onMouseLeave={onFieldBlur}
            >
              <div className="upload-area">
                {videoPreview ? (
                  <video
                    src={videoPreview}
                    controls
                    className="videoPreview"
                    width="200"
                  />
                ) : (
                  <div className="placeholder-content">
                    <div className="placeholder-icon">🎥</div>
                    <span>Drag & drop Video or</span>
                    <p>Browse</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                onChange={handleVideoChange}
                accept="video/*"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryUploads;

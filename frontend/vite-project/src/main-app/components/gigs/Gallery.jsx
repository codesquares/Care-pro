import { useState } from "react";
import "./galleryUploads.scss";

const GalleryUploads = ({ onFileChange }) => {
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
          </div>

          <div className="uploads-card-area">
            {[0, 1, 2].map((index) => (
              <div className="uploads-card-input" key={index}>
                <label className="file-upload">
                  <div className="upload-area">
                    <img
                      src={imagePreviews[index] || "https://via.placeholder.com/50"}
                      alt={`Preview ${index + 1}`}
                      className="galleryImage"
                    />
                    <span>Drag & drop Photo or</span>
                    <p>Browse</p>
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

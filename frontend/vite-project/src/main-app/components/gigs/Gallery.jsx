import { useState } from "react";
import "./galleryUploads.scss";

const GalleryUploads = ({onFileChange,onVideoChange}) => {
  
  return (
    <div className="galleryUploads">
      <div className="uploads-card-section">
        <div className="uploads-card-details">
          <h3>Images (up to 3)</h3>
          <p className="gigs-card-gallery-instructions">
            Get noticed by the right clients with visual examples of your work.
          </p>
        </div>
        <div className="uploads-card-area">
        <div className="uploads-card-input">
          <label className="file-upload">
            <div className="upload-area">
              <span>Drag and drop your images here or</span>
              <button type="button" className="browse-button">Browse</button>
            </div>
            <input type="file" onChange={onFileChange} accept="image/*"/>
          </label>
        </div>

        <div className="uploads-card-input">
          <label className="file-upload">
            <div className="upload-area">
              <span>Drag and drop your images here or</span>
              <button type="button" className="browse-button">Browse</button>
            </div>
            <input type="file" onChange={onFileChange} />
          </label>
        </div>

        <div className="uploads-card-input">
          <label className="file-upload">
            <div className="upload-area">
              <span>Drag and drop your images here or</span>
              <button type="button" className="browse-button">Browse</button>
            </div>
            <input type="file" onChange={onFileChange} />
          </label>
        </div>
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
          <label className="file-upload">
            <div className="upload-area">
              <span>Drag and drop your video here or</span>
              <button type="button" className="browse-button">Browse</button>
            </div>
            <input type="file" onChange={onVideoChange} />
          </label>
        
        </div>
        
      </div>
    </div>
  );
};

export default GalleryUploads;

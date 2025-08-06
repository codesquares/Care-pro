import React, { useState, useEffect } from "react";
import "./intro-video.css";

const ensureMp4Format = (url) => {
  if (url && url.includes("/upload/") && !url.includes(".mp4")) {
    return url.replace("/upload/", "/upload/f_mp4/") + ".mp4";
  }
  return url;
};

const IntroVideo = ({ profileIntrovideo }) => {
  const [showModal, setShowModal] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

  useEffect(() => {
    if (profileIntrovideo && profileIntrovideo !== "N/A") {
      const mp4Url = ensureMp4Format(profileIntrovideo);
      setVideoPreviewUrl(mp4Url);
    }
  }, [profileIntrovideo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    } else {
      alert("Please select a valid video file.");
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;

    const formData = new FormData();
    formData.append("introVideo", videoFile);

    try {
      setIsUploading(true);

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverInfo/${userDetails.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        alert("Video uploaded successfully!");
        setShowModal(false);
        setVideoFile(null);
        // Normally, re-fetch the profile data here to update the video
      } else {
        const errorData = await response.json();
        alert("Upload failed: " + (errorData.message || response.statusText));
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="intro-video-section">
        <h3>Intro Video</h3>

        {videoPreviewUrl ? (
          <div>
            <div className="video-container">
              <video controls>
                <source src={videoPreviewUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <button 
              onClick={() => setShowModal(true)} 
              className="update-video-btn"
            >
              Update Video
            </button>
          </div>
        ) : (
          <div className="video-placeholder">
            <span className="video-icon">🎥</span>
            <p>Create a short introduction video</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="get-started-btn"
            >
              Get Started
            </button>
          </div>
        )}
      
      {showModal && (
        <div className="video-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select a video to upload</h3>
            
            <div className="file-input-container">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            {videoFile && (
              <p style={{ 
                margin: "0 0 15px 0", 
                fontSize: "14px", 
                color: "#666" 
              }}>Selected: {videoFile.name}</p>
            )}

            {isUploading ? (
              <div style={{ 
                textAlign: "center", 
                padding: "20px",
                fontSize: "14px",
                color: "#666"
              }}>
                <div className="spinner" />
                Uploading...
              </div>
            ) : (
              <div className="modal-actions">
                <button 
                  onClick={() => setShowModal(false)}
                  className="modal-btn cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  className="modal-btn upload"
                  disabled={!videoFile}
                >
                  Upload
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroVideo;

import React, { useState, useEffect } from "react";
import "./intro-video.css";
import { toast } from "react-toastify";

const ensureMp4Format = (url) => {
  if (url && url.includes("/upload/") && !url.includes(".mp4")) {
    return url.replace("/upload/", "/upload/f_mp4/") + ".mp4";
  }
  return url;
};

const IntroVideo = ({ profileIntrovideo, onVideoUpdate }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showIntroVideoModal, setShowIntroVideoModal] = useState(false);
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

  // Handle ESC key to close video viewer modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showIntroVideoModal) {
          setShowIntroVideoModal(false);
        } else if (showUploadModal) {
          setShowUploadModal(false);
        }
      }
    };

    if (showIntroVideoModal || showUploadModal) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showIntroVideoModal, showUploadModal]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file); // Debug log
    
    if (file) {
      if (file.type.startsWith("video/")) {
        console.log("Valid video file selected:", file.name, file.type); // Debug log
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
      } else {
        console.log("Invalid file type:", file.type); // Debug log
        toast.warning("Please select a valid video file.");
        // Clear the file input
        e.target.value = '';
      }
    } else {
      console.log("No file selected"); // Debug log
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      console.log("No video file to upload"); // Debug log
      return;
    }

    console.log("Starting upload for file:", videoFile.name); // Debug log

    // Validate file size (e.g., max 50MB for videos)
    if (videoFile.size > 50 * 1024 * 1024) {
      toast.warning('Video size should be less than 50MB');
      return;
    }

    const formData = new FormData();
    formData.append("IntroVideo", videoFile);

    try {
      setIsUploading(true);

      const response = await fetch(
        `https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverInfo/${userDetails.id}`,
        {
          method: "PUT",
          headers: {
            'accept': '*/*',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      // API returns plain text message, not JSON
      const result = await response.text();
      console.log('Video upload response:', result);

      toast.success("Video uploaded successfully!");
      // Close upload modal on success
      setShowUploadModal(false);
      setVideoFile(null);
      
      // Call the callback to refresh profile data
      if (onVideoUpdate) {
        await onVideoUpdate();
      }
      
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadModal = () => {
    console.log("Opening upload modal, resetting state"); // Debug log
    setShowUploadModal(true);
    setVideoFile(null);
    setVideoPreviewUrl(profileIntrovideo && profileIntrovideo !== "N/A" ? ensureMp4Format(profileIntrovideo) : "");
  };

  const openVideoViewModal = () => {
    setShowIntroVideoModal(true);
  };

  return (
    <div className="intro-video-section">
        <h3>Intro Video</h3>

        {videoPreviewUrl ? (
          <div className="intro-video-preview">
            <div className="video-thumbnail-container" onClick={openVideoViewModal}>
              <video className="video-thumbnail">
                <source src={videoPreviewUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="play-overlay">
                <div className="play-icon">▶</div>
                <span className="play-text">Click to view video</span>
              </div>
            </div>
            <div className="video-actions">
              <button 
                onClick={openVideoViewModal} 
                className="view-video-btn"
              >
                View Video
              </button>
              <button 
                onClick={openUploadModal} 
                className="update-video-btn"
              >
                Update Video
              </button>
            </div>
          </div>
        ) : (
          <div className="video-placeholder">
            <span className="video-icon">🎥</span>
            <p>Create a short introduction video</p>
            <button 
              onClick={openUploadModal} 
              className="get-started-btn"
            >
              Get Started
            </button>
          </div>
        )}
      
      {/* Video Upload Modal */}
      {showUploadModal && (
        <div className="intro-video-upload-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="intro-video-upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select a video to upload</h3>
            
            <div className="file-input-container">
              <label htmlFor="video-file-input" className="file-input-label">
                <span className="file-input-icon">📁</span>
                <span className="file-input-text">
                  {videoFile ? `Selected: ${videoFile.name}` : "Click to choose video file"}
                </span>
              </label>
              <input 
                id="video-file-input"
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="file-input-hidden"
              />
            </div>

            <p className="file-hint">
              Supported formats: MP4, MOV, AVI, WMV (Max: 50MB)
            </p>

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
              <div className="intro-video-upload-modal-actions">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="intro-video-upload-modal-btn cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  className="intro-video-upload-modal-btn upload"
                  disabled={!videoFile}
                  title={!videoFile ? "Please select a video file first" : "Upload video"}
                >
                  Upload {videoFile ? `(${videoFile.name})` : "(No file selected)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intro Video Viewing Modal */}
      {showIntroVideoModal && videoPreviewUrl && (
        <div className="intro-video-viewer-modal-overlay" onClick={() => setShowIntroVideoModal(false)}>
          <div className="intro-video-viewer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="intro-video-viewer-header">
              <h3>Introduction Video</h3>
              <button 
                className="intro-video-viewer-close"
                onClick={() => setShowIntroVideoModal(false)}
                aria-label="Close video"
              >
                ✕
              </button>
            </div>
            
            <div className="intro-video-viewer-container">
              <video 
                controls 
                autoPlay
                className="intro-video-viewer"
                onError={(e) => {
                  console.error("Video playback error:", e);
                  toast.error("Error playing video");
                }}
              >
                <source src={videoPreviewUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroVideo;

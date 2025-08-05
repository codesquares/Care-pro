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
    <div style={{ 
      marginBottom: '20px',
      padding: '15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#fff',
      width: '100%',
      maxWidth: '400px'
    }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#333'
        }}>Intro Video</h3>

        {videoPreviewUrl ? (
          <div style={{ textAlign: 'center' }}>
            <video width="320" height="240" controls style={{ maxWidth: '100%' }}>
              <source src={videoPreviewUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div style={{ marginTop: '15px' }}>
              <button 
                onClick={() => setShowModal(true)} 
                style={{
                  padding: '8px 16px',
                  border: '1px solid #007bff',
                  borderRadius: '6px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  minWidth: '80px',
                  height: '36px'
                }}
              >
                Update Video
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '2px dashed #dee2e6',
            textAlign: 'center',
            color: '#6c757d',
            cursor: 'pointer'
          }} onClick={() => setShowModal(true)}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px', color: '#007bff' }}>
              +
            </div>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
              Upload Intro Video
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#999' }}>
              Click to add your introduction video
            </p>
          </div>
        )}
      
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            maxWidth: "400px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ 
              margin: "0 0 15px 0", 
              fontSize: "18px", 
              fontWeight: "600",
              color: "#333"
            }}>Select a video to upload</h3>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
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
              }}>Uploading...</div>
            ) : (
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    minWidth: "80px",
                    height: "36px"
                  }}
                >Cancel</button>
                <button 
                  onClick={handleUpload}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "6px",
                    background: "#007bff",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    minWidth: "80px",
                    height: "36px"
                  }}
                >Upload</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroVideo;

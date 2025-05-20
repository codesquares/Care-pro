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
    <div className="intro-video">
      <h3>Intro Video</h3>

      {videoPreviewUrl && (
        <div className="video-preview">
          <video width="320" height="240" controls>
            <source src={videoPreviewUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <button onClick={() => setShowModal(true)}>Upload Video</button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h4>Select a video to upload</h4>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            {videoFile && <p>Selected: {videoFile.name}</p>}

            {isUploading ? (
              <div className="spinner">Uploading...</div>
            ) : (
              <div className="modal-actions">
                <button onClick={handleUpload}>Upload</button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntroVideo;

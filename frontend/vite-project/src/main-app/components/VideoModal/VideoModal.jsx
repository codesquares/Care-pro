import{ useEffect } from 'react';
import './VideoModal.css';

const VideoModal = ({ 
  isOpen, 
  onClose, 
  videoUrl, 
  title = "Video", 
  width, 
  height 
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div 
        className="video-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: width || 'auto', 
          height: height || 'auto',
          maxWidth: width ? '95vw' : '900px',
          maxHeight: height ? '95vh' : '90vh'
        }}
      >
        <div className="video-modal-header">
          <h3>{title}</h3>
          <button 
            className="video-modal-close"
            onClick={onClose}
            aria-label="Close video"
          >
            ✕
          </button>
        </div>
        
        <div className="video-modal-container">
          <video 
            controls 
            autoPlay
            className="video-modal-player"
            style={{
              width: width || '100%',
              height: height || 'auto'
            }}
            onError={(e) => {
              console.error("Video playback error:", e);
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;

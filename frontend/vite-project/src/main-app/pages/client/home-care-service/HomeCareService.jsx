// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import "./home-care-service.css";
// import { use } from "react";

// const HomeCareService = () => {
//   const { id } = useParams();
//   const [service, setService] = useState(null);
//   const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const basePath = "/app/client"; // Base path for your routes


//   const handleHire = async () => {
//     if (!service) return;
//     const user = JSON.parse(localStorage.getItem("userDetails"));
//     //set the gig id to the local storage
//     localStorage.setItem("gigId", id);
//     //set the amount to the local storage
//     localStorage.setItem("amount", service.price);
//     localStorage.setItem("providerId", service.caregiverId);

//     console.log(user);

//     try {
//       const payload = {
//         amount: service.price,
//         email: user?.email,
//         currency: "NIGN",
//         redirectUrl: `${window.location.origin}/app/client/payment-success`,
//       };

//       const response = await fetch(
//         "https://carepro-api20241118153443.azurewebsites.net/api/payments/initiate",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Payment initiation failed");
//       }

//       const data = await response.json();
//       console.log("Payment Response:", data);

//       if (data.status === "success" && data.data?.link) {
//         window.location.href = data.data.link; // Redirect to payment gateway
//       } else {
//         throw new Error("Failed to get payment link");
//       }
//     } catch (error) {
//       console.error("Payment error:", error);
//       setError(error.message);
//     }
//   };


//   const handleMessage = () => {
//     // Navigate directly to conversation with this caregiver
//     navigate(`${basePath}/message/${service.caregiverId}`, {
//       state: {
//         recipientName: providerName,
//       },
//     });
//   };

//   useEffect(() => {

//     //get user details from local storage

//     const fetchServiceDetails = async () => {
//       try {
//         const response = await fetch(
//           `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/gigId?gigId=${id}`
//         );
//         if (!response.ok) {
//           throw new Error("Failed to fetch service details");
//         }
//         const data = await response.json();
//         console.log("Service details:", data);
//         setService(data);
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchServiceDetails();
//   }, [id]);

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p className="error">{error}</p>;

//   // Extract service details
//   const { title, providerName, rating, packageDetails, image1, plan, price, features, videoURL } = service;

//   return (
//     <div className="container">
//       {/* Top Section: Title, Profile, and Pricing Card */}
//       <div className="top-section">
//         {/* Left: Title and Profile Info */}
//         <div className="profile-container">
//           <h1 className="title">{title}</h1>
//           <div className="profile">
//             <img src={image1 || "/avatar.jpg"} alt={providerName} className="avatar" />
//             <div>
//               <p className="name">{providerName}</p>
//               <span className="rating">⭐⭐⭐⭐ {rating} (210)</span>
//             </div>
//           </div>
//         </div>

//         {/* Right: Pricing Card */}
//         <div className="card pricing-card">
//           <h2 className="plan-title">{plan}</h2>
//           <h2 className="price">{price}</h2>
//           <ul className="features">
//             {features && features.length > 0 ? (
//               features.map((feature, index) => <li key={index}>{feature}</li>)
//             ) : (
//               <li>No features listed</li>
//             )}
//           </ul>
//           <button className="hire-button" onClick={handleHire}>Hire {providerName}</button>
//         </div>
//       </div>

//       {/* Video Section */}
//       <div className="video-container">
//       <video width="570" height="260" controls>
//             <source src={videoURL} type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//       </div>

//       {/* Service Description & Message Button */}
//       <div className="package-details">
//           <h2 className="section-title">What this package includes:</h2>
//           <ul className="package-list">
//             {packageDetails?.map((item, index) => (
//               <li key={index} className="package-item">
//                 {item}
//               </li>
//             ))}
//           </ul>
//       </div>


//       <button className="message-button" onClick={handleMessage}>Message {providerName}</button>

//       {/* Reviews Section */}
//       <div className="reviews">
//         <h2 className="review-title">Reviews</h2>
//         <div className="review-card">
//           <div className="review-header">
//             <img src="/avatar.jpg" alt="User" className="review-avatar" />
//             <div>
//               <p className="reviewer-name">Josiah Ruben</p>
//               <div className="stars">⭐⭐⭐⭐⭐</div>
//             </div>
//           </div>
//           <p className="review-text">
//             "I can't thank Rufai enough for the care and kindness she provided to my father..."
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HomeCareService;


import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./home-care-service.css";
import ClientGigService from "../../../services/clientGigService";
import GigReviewService from "../../../services/gigReviewService";
import defaultAvatar from "../../../../assets/profilecard1.png";
import VideoModal from "../../../components/VideoModal/VideoModal";
import ReviewsModal from "../../../components/ReviewsModal/ReviewsModal";
import { useAuth } from "../../../context/AuthContext";

const HomeCareService = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [serviceCardDimensions, setServiceCardDimensions] = useState({ width: 0, height: 0 });
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [gigReviews, setGigReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  // Gig-specific review data (fetched on mount)
  const [gigReviewCount, setGigReviewCount] = useState(0);
  const [gigRating, setGigRating] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const basePath = "/app/client";
  const serviceCardRef = useRef(null);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "?";
    const names = name.trim().split(" ").filter(Boolean);
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    return initials.slice(0, 2) || "?";
  };

  const handleHire = async () => {
    if (!service) return;

    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/service/${id}`);
      return;
    }

    navigate(`${basePath}/cart/${id}`);
  };

  const handleMessage = () => {
    navigate(`${basePath}/message/${service.caregiverId}`, {
      state: { recipientName: service.caregiverName, serviceId: id },
    });
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/service/${id}`);
      return;
    }
    setIsFavorite(!isFavorite);
    // TODO: Implement API call to save/remove favorite
    console.log(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/service/${id}`;
    const shareData = {
      title: service?.title || 'Care Service',
      text: `Check out this care service: ${service?.title || ''}`,
      url: shareUrl,
    };

    // Try to use native Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback to custom modal for desktop
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `https://api.oncarepro.com/api/share/gig/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSocialShare = (platform) => {
    const shareUrl = `https://api.oncarepro.com/api/share/gig/${id}`;
    const text = `Check out this care service: ${service?.title || ''}`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  // Handle opening reviews modal
  const handleOpenReviews = async () => {
    setShowReviewsModal(true);
    setReviewsLoading(true);
    
    try {
      const { reviews, stats } = await GigReviewService.getReviewsWithStats(id);
      setGigReviews(reviews);
      setReviewStats(stats);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setGigReviews([]);
      setReviewStats(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch gig-specific reviews on mount
  useEffect(() => {
    const fetchGigReviews = async () => {
      if (!id) return;
      try {
        const { reviews, stats } = await GigReviewService.getReviewsWithStats(id);
        setGigReviews(reviews);
        setReviewStats(stats);
        setGigReviewCount(reviews.length);
        
        // Calculate average rating if there are reviews
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, r) => sum + (r.rating || r.Rating || 0), 0);
          setGigRating(Math.round((totalRating / reviews.length) * 10) / 10);
        }
      } catch (err) {
        // Silent fail - will show 0 reviews
      }
    };
    
    fetchGigReviews();
  }, [id]);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the enhanced ClientGigService to get all enriched gigs
        const allGigs = await ClientGigService.getAllGigs();

        // Find the specific gig by ID
        const foundGig = allGigs.find(gig => gig.id === id);

        if (!foundGig) {
          throw new Error("Service not found or no longer available");
        }

        setService(foundGig);
        // console.log("Enriched service details:", foundGig);

      } catch (err) {
        console.error("Error fetching service details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  // Capture service card dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (serviceCardRef.current) {
        const rect = serviceCardRef.current.getBoundingClientRect();
        setServiceCardDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Update dimensions on mount and window resize
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [service]); // Re-run when service data is loaded

  if (loading) return <div className="spinner-container">
    <div className="loading-spinner"></div>
  </div>;
  if (error) return <div className="error-container">
    <p className="error">{error}</p>
    <button className="back-btn" onClick={() => navigate(-1)}>← Go Back</button>
  </div>;
  if (!service) return <div className="error-container">
    <p className="error">Service not found</p>
    <button className="back-btn" onClick={() => navigate(-1)}>← Go Back</button>
  </div>;

  // Extract all available fields from enriched service data
  const {
    title,
    caregiverName,
    caregiverFirstName,
    caregiverLastName,
    caregiverEmail,
    caregiverPhone,
    gigImage,
    caregiverRating,
    caregiverReviewCount,
    caregiverLocation,
    caregiverBio,
    caregiverExperience,
    caregiverSpecializations,
    caregiverIsVerified,
    caregiverIsAvailable,
    caregiverJoinDate,
    caregiverLanguages,
    caregiverCertifications,
    packageDetails,
    packageName,
    image1,
    price,
    videoURL,
    subCategory,
    category,
    deliveryTime,
    caregiverProfileImage,
    status,
    introVideo,
    lastDeliveryDate
  } = service;


  // console.log("Service details===><===:", service);
  // console.log("caregiverProfileImage value:", caregiverProfileImage);
  // console.log("caregiverProfileImage type:", typeof caregiverProfileImage);
  // console.log("defaultAvatar:", defaultAvatar);

  // Helper: generate a consistent color from a name string
  const getNameColor = (name) => {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper: render star icons for a rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={`star ${i < fullStars ? 'star-filled' : 'star-empty'}`}>★</span>
      );
    }
    return stars;
  };

  return (
    <div className="container-service">
      {/* Title + Actions Row */}
      <div className="hcs-title-row">
        <h1 className="hcs-title">{title}</h1>
        <div className="hcs-title-actions">
          <button
            className={`hcs-action-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavorite}
            aria-label="Add to favorites"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "#ff4757" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{isFavorite ? '201' : '200'}</span>
          </button>
          <button className="hcs-action-btn" onClick={handleShare} aria-label="Share service">
            <span>share</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Provider Info Bar */}
      <div className="hcs-provider-bar">
        {caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? (
          <img
            src={caregiverProfileImage}
            alt={caregiverName}
            className="hcs-provider-avatar"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className="hcs-provider-avatar hcs-provider-avatar-initials"
          style={{ display: caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? 'none' : 'flex' }}
        >
          <span>{getInitials(caregiverName)}</span>
        </div>
        <span className="hcs-provider-name">{caregiverName}</span>
        {caregiverIsVerified && <span className="hcs-verified-badge">verified</span>}
        <span className="hcs-bar-separator">|</span>
        <span className="hcs-bar-item">
          <span className="hcs-bar-stars">{renderStars(gigRating || 0)}</span>
          <span className="hcs-bar-rating-num">{gigRating || 0}</span>
        </span>
        <span className="hcs-bar-separator">|</span>
        <span className="hcs-bar-item hcs-orders-queue">3 orders in queue</span>
        <span className="hcs-bar-separator">|</span>
        <span className="hcs-bar-item">📍 {caregiverLocation || "Location not specified"}</span>
        <span className="hcs-bar-separator">|</span>
        <span className="hcs-bar-item">last deliver: {lastDeliveryDate || "N/A"}</span>
        <span className="hcs-bar-separator">|</span>
        <span
          className="hcs-bar-item hcs-reviews-link"
          onClick={handleOpenReviews}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenReviews()}
        >
          ({gigReviewCount || 0} reviews)
        </span>
      </div>

      {/* Main Content: Image + Pricing Card */}
      <div className="hcs-main-content" ref={serviceCardRef}>
        {/* Left: Hero Image */}
        <div className="hcs-image-section">
          {(image1 || gigImage) ? (
            <img
              src={image1 || gigImage}
              alt={title}
              className="hcs-hero-image"
              onError={(e) => { e.target.src = defaultAvatar; }}
            />
          ) : (
            <div className="hcs-hero-placeholder">
              <span>No image available</span>
            </div>
          )}

          {/* Floating Message Bubble - overlaid on image */}
          {isAuthenticated && userRole === 'Client' && (
            <div className="hcs-floating-message" onClick={handleMessage}>
              <img
                src={caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? caregiverProfileImage : defaultAvatar}
                className="hcs-floating-avatar"
                alt={caregiverName}
                onError={(e) => { e.target.src = defaultAvatar; }}
              />
              <div className="hcs-floating-info">
                <p className="hcs-floating-name">Message: {caregiverFirstName || caregiverName}</p>
                <span className="hcs-floating-status">
                  {caregiverIsAvailable ? "Available" : "Away"} · for {lastDeliveryDate || "Unknown days"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Pricing Card */}
        <div className="hcs-pricing-card">
          <div className="hcs-pricing-header">
            <span className="hcs-package-name">{packageName || "Basic Package"}</span>
          </div>
          <div className="hcs-pricing-price">₦{Number(price).toLocaleString()}</div>
          <div className="hcs-pricing-delivery">Delivery: {deliveryTime || "Per Day"}</div>
          <p className="hcs-pricing-bestfor">
            Best for: routine monitoring, follow-ups, & light medical supervision
          </p>

          <div className="hcs-pricing-includes">
            <span className="hcs-includes-label">Includes:</span>
            <ul className="hcs-includes-list">
              {(packageDetails || []).map((feature, i) => (
                <li key={i}><span className="hcs-check">✓</span> {feature}</li>
              ))}
              {caregiverSpecializations && caregiverSpecializations.length > 0 && (
                <li><span className="hcs-check">✓</span> Specializations: {caregiverSpecializations.join(', ')}</li>
              )}
            </ul>
          </div>

          <div className="hcs-pricing-buttons">
            {(!isAuthenticated || userRole === 'Client') && (
              <button className="hcs-hire-btn" onClick={handleHire}>
                Hire {caregiverFirstName || caregiverName} <span className="hcs-arrow">→</span>
              </button>
            )}
            {(!isAuthenticated || userRole === 'Client') && (
              <button className="hcs-message-btn" onClick={isAuthenticated ? handleMessage : () => navigate(`/login?returnTo=/service/${id}`)}>
                Send Message
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Section */}
      {introVideo && (
        <div className="hcs-video-section">
          <h3>Introduction Video</h3>
          <div className="video-thumbnail-container" onClick={() => setShowVideoModal(true)}>
            <video className="video-thumbnail" muted>
              <source src={introVideo} type="video/mp4" />
            </video>
            <div className="play-overlay">
              <div className="play-icon">▶</div>
              <div className="play-text">Click to play video</div>
            </div>
          </div>
        </div>
      )}

      {/* About the Gig */}
      {caregiverBio && (
        <div className="hcs-about-gig">
          <h2>About the Gig</h2>
          <p>{caregiverBio}</p>
        </div>
      )}

      {/* Services Offered */}
      {((packageDetails && packageDetails.length > 0) || (subCategory && subCategory.length > 0)) && (
        <div className="hcs-services-offered">
          <h2>Services Offered</h2>
          <ul className="hcs-services-list">
            {(packageDetails || []).map((item, i) => (
              <li key={`pd-${i}`}>{item}</li>
            ))}
            {(subCategory || []).map((item, i) => (
              <li key={`sc-${i}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reviews Section */}
      {gigReviewCount > 0 && (
        <div className="hcs-reviews-section">
          <h2>Reviews</h2>
          <div className="hcs-reviews-list">
            {gigReviews.slice(0, 5).map((review) => (
              <div key={review.id || review.reviewId} className="hcs-review-card">
                <div className="hcs-review-header">
                  <span
                    className="hcs-review-dot"
                    style={{ backgroundColor: getNameColor(review.clientName) }}
                  ></span>
                  <span className="hcs-review-name">{review.clientName || 'Anonymous'}</span>
                  <span className="hcs-review-stars">{renderStars(review.rating || 0)}</span>
                  <span className="hcs-review-rating-num">{review.rating || 0}</span>
                  <span className="hcs-review-date">{GigReviewService.formatDate(review.reviewedOn)}</span>
                </div>
                <p className="hcs-review-text">{review.message}</p>
              </div>
            ))}
          </div>
          {gigReviewCount > 5 && (
            <button className="hcs-see-all-reviews" onClick={handleOpenReviews}>
              See all {gigReviewCount} reviews
            </button>
          )}
        </div>
      )}

      {/* About Me Section */}
      <div className="hcs-about-me">
        <h2>About Me</h2>
        <div className="hcs-about-me-card">
          <div className="hcs-about-me-top">
            {caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? (
              <img
                src={caregiverProfileImage}
                alt={caregiverName}
                className="hcs-aboutme-avatar"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="hcs-aboutme-avatar hcs-aboutme-avatar-initials"
              style={{ display: caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? 'none' : 'flex' }}
            >
              <span>{getInitials(caregiverName)}</span>
            </div>
            <div className="hcs-aboutme-info">
              <div className="hcs-aboutme-name-row">
                <span className="hcs-aboutme-name">{caregiverName}</span>
                {caregiverIsVerified && <span className="hcs-verified-badge">verified</span>}
                <span className="hcs-aboutme-rating">
                  <span className="hcs-bar-stars">{renderStars(gigRating || 0)}</span>
                  <span>{gigRating || 0}</span>
                </span>
              </div>
              <div className="hcs-aboutme-meta">
                <span>last deliver: {lastDeliveryDate || "N/A"}</span>
                {caregiverLanguages && caregiverLanguages.length > 0 && (
                  <span className="hcs-aboutme-languages">Language: {caregiverLanguages.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <p className="hcs-aboutme-bio">{caregiverBio || "No bio available."}</p>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={introVideo || videoURL}
        title="Introduction Video"
        width={serviceCardDimensions.width > 0 ? `${serviceCardDimensions.width}px` : undefined}
        height={serviceCardDimensions.height > 0 ? `${serviceCardDimensions.height}px` : undefined}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Share this service</h3>
              <button className="close-modal-btn" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="share-modal-content">
              <div className="copy-link-section">
                <input
                  type="text"
                  value={`${window.location.origin}/service/${id}`}
                  readOnly
                  className="share-link-input"
                />
                <button className="copy-link-btn" onClick={handleCopyLink}>
                  {copySuccess ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="social-share-buttons">
                <button className="social-btn-share facebook" onClick={() => handleSocialShare('facebook')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <button className="social-btn-share twitter" onClick={() => handleSocialShare('twitter')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </button>
                <button className="social-btn-share whatsapp" onClick={() => handleSocialShare('whatsapp')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </button>
                <button className="social-btn-share linkedin" onClick={() => handleSocialShare('linkedin')}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={gigReviews}
        stats={reviewStats}
        loading={reviewsLoading}
        gigTitle={title}
      />
    </div>
  );
};

export default HomeCareService;

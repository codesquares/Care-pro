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


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./home-care-service.css";
import ClientGigService from "../../../services/clientGigService";
import defaultAvatar from "../../../../assets/profilecard1.png"

const HomeCareService = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const basePath = "/app/client";

 const handleHire = async () => {
    if (!service) return;
  
    navigate(`${basePath}/cart/${id}`);
 };

  const handleMessage = () => {
    navigate(`${basePath}/message/${service.caregiverId}`, {
      state: { recipientName: service.caregiverName },
    });
  };

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
        console.log("Enriched service details:", foundGig);
        
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
    lastDeliveryDate
  } = service;


  console.log("Service details===><===:", service);
  console.log("caregiverProfileImage value:", caregiverProfileImage);
  console.log("caregiverProfileImage type:", typeof caregiverProfileImage);
  console.log("defaultAvatar:", defaultAvatar);

  return (
    <div className="container-service">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>← Back to Homepage</button>

      {/* Top Section */}
      <div className="service-top-header">
        <div 
          className="service-card-section"
          style={{
            backgroundImage: image1 ? `url(${image1})` : 'none'
          }}
        >
          <h2 className="gig-title">{title}</h2>
          <div className="provider-info-card">
            {/* if caregiverProfileImage is not available, show defaultAvatar */}
            <img 
              src={caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? caregiverProfileImage : defaultAvatar} 
              alt={caregiverName} 
              className="provider-avatar"
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />
            <div className="provider-details">
              <p className="provider-name">{caregiverName}</p>
              <div className="provider-tags">
                <span className={`status-tag ${caregiverIsAvailable ? 'available' : 'unavailable'}`}>
                  {caregiverIsAvailable ? "Available" : "Unavailable"}
                </span>
                {caregiverIsVerified && (
                  <span className="verification-tag">✓ Verified</span>
                )}
                <span className="location-tag">
                  {caregiverLocation || "Location not specified"}
                </span>
                <span className="rating-tag">
                  ⭐ {caregiverRating || 0} ({caregiverReviewCount || 0} reviews)
                </span>
                {caregiverExperience > 0 && (
                  <span className="experience-tag">
                    {caregiverExperience} years experience
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="plan-box">
          <div className="plan-tabs">
            <span className="tab-basic">{packageName || "Basic"}</span>
            <span className="delivery-time">Delivery: {deliveryTime || "1-2 days"}</span>
          </div>
          <div className="plan-price">₦{Number(price).toLocaleString()}</div>
          <ul className="plan-features">
            {(packageDetails || []).map((feature, i) => (
              <li key={i} className="enabled">
                ✓ {feature}
              </li>
            ))}
            {caregiverSpecializations.length > 0 && (
              <li className="specializations">
                <strong>Specializations:</strong> {caregiverSpecializations.join(', ')}
              </li>
            )}
          </ul>
          <button className="accept-offer-btn" onClick={handleHire}>
            Accept offer →
          </button>
        </div>
      </div>

      {/* Floating Message Button */}
      <div className="floating-message">
        <img 
          src={caregiverProfileImage && (caregiverProfileImage.startsWith('http') || caregiverProfileImage.startsWith('/')) ? caregiverProfileImage : defaultAvatar} 
          className="floating-avatar" 
          alt={caregiverName}
          onError={(e) => {
            e.target.src = defaultAvatar;
          }}
        />
        <div className="floating-info">
          <p className="message-provider-btn" onClick={handleMessage}>
            Message: {caregiverFirstName || caregiverName}
          </p>
          <span className="status-text">
            {caregiverIsAvailable ? "Available" : "Away"} · 
            <span> for {lastDeliveryDate || "Unknown days"}</span>
          </span>
        </div>
      </div>

      {/* Video Section */}
      {videoURL && (
        <>
          <h3>Introduction video</h3>
          <div className="video-preview">
            <video width="100%" controls>
              <source src={videoURL} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </>
      )}

      {/* Caregiver Bio Section */}
      {caregiverBio && (
        <div className="caregiver-bio">
          <h3>About {caregiverFirstName || caregiverName}</h3>
          <p>{caregiverBio}</p>
        </div>
      )}

      {/* Package Details */}
      <div className="package-details">
        <h2 className="section-title">What this package includes:</h2>
        
        {/* Service Details and Categories - Side by Side */}
        <div className="service-details-container">
          {/* Package Details List */}
          {packageDetails && packageDetails.length > 0 && (
            <div className="package-section">
              <h4>Service Details:</h4>
              <ul className="package-list">
                {packageDetails.map((item, index) => (
                  <li key={index} className="package-item">✓ {item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* SubCategory Services */}
          {subCategory && subCategory.length > 0 && (
            <div className="package-section">
              <h4>Service Categories:</h4>
              <ul className="package-list">
                {subCategory.map((item, index) => (
                  <li key={index} className="package-item">✓ {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Caregiver Languages */}
        {caregiverLanguages && caregiverLanguages.length > 0 && (
          <div className="package-section">
            <h4>Languages Spoken:</h4>
            <div className="languages-list">
              {caregiverLanguages.map((language, index) => (
                <span key={index} className="language-tag">{language}</span>
              ))}
            </div>
          </div>
        )}

        {/* Caregiver Certifications */}
        {caregiverCertifications && caregiverCertifications.length > 0 && (
          <div className="package-section">
            <h4>Certifications:</h4>
            <ul className="certifications-list">
              {caregiverCertifications.map((cert, index) => (
                <li key={index} className="certification-item">🏆 {cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reviews */}
      {caregiverReviewCount > 0 && (
        <div className="reviews">
          <h2 className="review-title">Reviews</h2>
          <div className="reviews-summary">
            <div className="rating-overview">
              <span className="average-rating">⭐ {caregiverRating || 0}</span>
              <span className="review-count">({caregiverReviewCount || 0} reviews)</span>
              {caregiverExperience > 0 && (
                <span className="experience-info">• {caregiverExperience} years experience</span>
              )}
              {caregiverIsVerified && (
                <span className="verified-badge">✓ Verified Caregiver</span>
              )}
            </div>
          </div>
          
          {/* Sample Review - In a real app, you'd fetch actual reviews */}
          <div className="review-card">
            <div className="review-header">
              <img src="/avatar.jpg" alt="User" className="review-avatar" />
              <div>
                <p className="reviewer-name">Josiah Ruben</p>
                <div className="stars">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <p className="review-text">
              "I can't thank {caregiverFirstName || caregiverName} enough for the care and kindness provided to my father. 
              Their attention to detail and genuine concern for his well-being went above and beyond expectations..."
            </p>
          </div>
          
          {/* Note about reviews */}
          <div className="reviews-note">
            <p><em>Reviews are based on the caregiver's overall performance across all services.</em></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeCareService;

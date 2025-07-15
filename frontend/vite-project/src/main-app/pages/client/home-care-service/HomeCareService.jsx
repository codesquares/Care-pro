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

const HomeCareService = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const basePath = "/app/client";

  const handleHire = async () => {
    if (!service) return;
    const user = JSON.parse(localStorage.getItem("userDetails"));
    localStorage.setItem("gigId", id);
    localStorage.setItem("amount", service.price);
    localStorage.setItem("providerId", service.caregiverId);

    try {
      const payload = {
        amount: service.price,
        email: user?.email,
        currency: "NIGN",
        redirectUrl: `${window.location.origin}/app/client/payment-success`,
      };

      const response = await fetch(
        "https://carepro-api20241118153443.azurewebsites.net/api/payments/initiate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.status === "success" && data.data?.link) {
        window.location.href = data.data.link;
      } else {
        throw new Error("Failed to get payment link");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message);
    }
  };

  const handleMessage = () => {
    navigate(`${basePath}/message/${service.caregiverId}`, {
      state: { recipientName: service.providerName },
    });
  };

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await fetch(
          `https://carepro-api20241118153443.azurewebsites.net/api/Gigs/gigId?gigId=${id}`
        );
        if (!response.ok) throw new Error("Failed to fetch service details");
        const data = await response.json();
        setService(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceDetails();
  }, [id]);

  if (loading) return <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>;
  if (error) return <p className="error">{error}</p>;

  const {
    title,
    providerName,
    caregiverName,
    rating,
    packageDetails,
    image1,
    plan,
    price,
    features,
    videoURL,
    location,
  } = service;

  console.log("Service details:", service);

  return (
    <div className="container-service">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>← Back to Homepage</button>

      {/* Top Section */}
      <div className="service-top-header">
        <div className="service-card-section">
          <h2 className="gig-title">{title}</h2>
          <div className="provider-info-card">
            <img src={image1 || "/avatar.jpg"} alt={caregiverName} className="provider-avatar" />
            <div className="provider-details">
              <p className="provider-name">{caregiverName}</p>
              <div className="provider-tags">
                <span className="status-tag">Available</span>
                <span className="location-tag">{location || "Yaba, Lagos"}</span>
                <span className="rating-tag">⭐ {rating} (200)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="plan-box">
          <div className="plan-tabs">
            <span className="tab-basic">Basic</span>
            {/* <span className="tab">Standard</span>
            <span className="tab">Premium</span> */}
          </div>
          <div className="plan-price">₦{Number(price).toLocaleString()}</div>
          <ul className="plan-features">
            {(packageDetails || []).map((f, i) => (
              <li key={i} className={ "enabled"}>
                ✓ {f}
              </li>
            ))}
          </ul>
          <button className="accept-offer-btn" onClick={handleHire}>Accept offer →</button>
        </div>
      </div>

      {/* Video Section */}
      <h3>Introduction video</h3>
      <div className="video-preview">
        <video width="100%" controls>
          <source src={videoURL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Package Details */}
      <div className="package-details">
        <p>jke oeboe ferojebovrekfoeubfewo f erofuer freojferf erkf reuiofre ferkj fbefbiuerfnerjbvefbijrf nrwbfirewbfrw fkjbrfb rew frekjfrwiufrwk fojerfbier feroufer ferovfuer ferouvfer vouervber veruovfheoijweropfwbj wrf wroiwrfbwr ihrfw jofuowbf ih</p>
        {/* <h2 className="section-title">What this package includes:</h2> */}
        {/* <ul className="package-list">
          {(packageDetails || []).map((item, index) => (
            <li key={index} className="package-item">✓ {item}</li>
          ))}
        </ul> */}
      </div>

      {/* Floating Message Button */}
      <div className="floating-message">
        <img src={image1 || "/avatar.jpg"} className="floating-avatar" />
        <div className="floating-info">
        <p className="message-provider-btn" onClick={handleMessage}>Message:  {caregiverName}</p>
        <span className="status-text">Away · Avg. response time: 3 Hrs</span>
        </div>
      </div>

      {/* Reviews */}
      <div className="reviews">
        <h2 className="review-title">Reviews</h2>
        <div className="review-card">
          <div className="review-header">
            <img src="/avatar.jpg" alt="User" className="review-avatar" />
            <div>
              <p className="reviewer-name">Josiah Ruben</p>
              <div className="stars">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
          <p className="review-text">
            "I can't thank Rufai enough for the care and kindness she provided to my father. Her attention to detail and genuine concern for his well-being went..."
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeCareService;

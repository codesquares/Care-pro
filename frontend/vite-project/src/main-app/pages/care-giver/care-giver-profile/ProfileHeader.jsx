import { useEffect, useState, useRef } from "react";
import "./profile-header.css";
import { FaMapMarkerAlt, FaCalendarAlt, FaTruck } from "react-icons/fa";
import profilecard1 from "../../../../assets/profilecard1.png";
import IntroVideo from "./IntroVideo";
import ProfileInformation from "./ProfileInformation";
import VerifyButton from "./VerifyButton";
import AssessmentButton from "./AssessmentButton";
import TestVerificationToggle from "../../../components/dev/TestVerificationToggle";
import AddressInput from "../../../components/AddressInput";
import verificationService from "../../../services/verificationService";
import { getDojahStatus } from "../../../services/dojahService";
import { toast } from "react-toastify";
import config from "../../../config"; // Import centralized config for API URLs
import { generateUsername } from "../../../utils/usernameGenerator";
import { useAuth } from "../../../context/AuthContext";

const ProfileHeader = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    bio: "",
    rating: 0,
    reviews: 0,
    location: "",
    memberSince: "",
    lastDelivery: "",
    picture: "",
    introVideo: "",
    aboutMe: "",
    services:[],
    status: false,
    verificationStatus: null,
    isAvailable: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editedLocation, setEditedLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressValidation, setAddressValidation] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [statusFromApi, setStatusFromApi] = useState(null);
  const fileInputRef = useRef(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    console.log("MOUNTED ProfileHeader");
    return () => console.log("UNMOUNTED ProfileHeader");
  }, []);

  const handleLocationSave = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    
    if (!editedLocation.trim()) {
      toast.warning("Please enter a location");
      return;
    }

    // Check address validation
    if (addressValidation && !addressValidation.isValid) {
      toast.warning("Please enter a valid address or select from suggestions");
      return;
    }

    try {
      setLocationLoading(true);
      
      // Use formatted address if available from Google validation, otherwise use input
      const addressToSend = addressValidation?.formattedAddress || editedLocation;
      
      // API call to update location using the new dedicated endpoint
      const response = await fetch(`${config.BASE_URL}/CareGivers/UpdateCaregiverLocation/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addressToSend }),
      });

      if (!response.ok) {
        const result = await response.json();
        let errorMessage = 'Failed to update location';
        
        switch (response.status) {
          case 400:
            errorMessage = `Validation Error: ${result.message || 'Invalid address format'}`;
            break;
          case 404:
            errorMessage = 'Caregiver not found. Please check your account.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = result.message || 'Unexpected error occurred';
        }
        
        throw new Error(errorMessage);
      }

      // API returns JSON response with geocoded data
      const result = await response.json();
      console.log('Location update response:', result);

      // Extract city from response
      const cityName = result.data?.city || addressValidation?.addressComponents?.city || 'location';

      // Update AuthContext with new location
      updateUser({
        serviceAddress: addressToSend,
        serviceCity: cityName,
        serviceState: result?.data?.state || addressValidation?.addressComponents?.state,
        location: addressToSend
      });

      // Update the profile display with the new location (city only)
      setProfile(prev => {
        const updatedProfile = {
          ...prev,
          location: cityName
        };
        console.log('Profile state updated with new location:', updatedProfile.location);
        return updatedProfile;
      });

      setShowLocationModal(false);
      setEditedLocation("");
      setAddressValidation(null);
      
      // Show success message with city if available
      toast.success(`Location updated successfully! Now serving in ${cityName}.`);
      
    } catch (err) {
      console.error('Error updating location:', err);
      toast.error(err.message || 'Failed to update location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };
 
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size should be less than 5MB');
      return;
    }

    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (!userDetails?.id) {
      toast.error('User session expired. Please log in again.');
      return;
    }

    try {
      setImageUploadLoading(true);

      const formData = new FormData();
      formData.append('ProfileImage', file);

      // Use centralized config instead of hardcoded URL for consistent API routing
      const response = await fetch(`${config.BASE_URL}/CareGivers/UpdateProfilePicture/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile picture');
      }

      // API returns plain text message, not JSON
      const result = await response.text();
      console.log('Upload response:', result);
      
      // Call fetchProfile to get updated profile data with new image
      // Skip loading states since we're already in upload loading state
      await fetchProfile(true);

      toast.success('Profile picture updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile picture:', err);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setImageUploadLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAvailabilityToggle = async (newAvailability) => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (!userDetails?.id) {
      toast.error('User session expired. Please log in again.');
      return;
    }

    // Don't make API call if already in the desired state
    if (profile.isAvailable === newAvailability) {
      return;
    }

    try {
      setAvailabilityLoading(true);
      
      // API call to update availability using the endpoint you provided
      const response = await fetch(`${config.BASE_URL}/CareGivers/UpdateCaregiverAvailability/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({ 
          isAvailable: newAvailability 
        }),
      });

      if (!response.ok) {
        const result = await response.text();
        let errorMessage = 'Failed to update availability';
        
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid request. Please try again.';
            break;
          case 404:
            errorMessage = 'Caregiver not found. Please check your account.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = result || 'Unexpected error occurred';
        }
        
        throw new Error(errorMessage);
      }

      // Update the profile state immediately for better UX
      setProfile(prev => ({ ...prev, isAvailable: newAvailability }));
      
      // Show success message
      toast.success(`You are now ${newAvailability ? 'Available' : 'Unavailable'} for new requests`);
      
    } catch (err) {
      console.error('Error updating availability:', err);
      toast.error(err.message || 'Failed to update availability. Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchProfile = async (skipLoadingStates = false) => {
    try {
      if (!skipLoadingStates) {
        setIsLoading(true);
      }

      const userDetailsStr = localStorage.getItem("userDetails");
      if (!userDetailsStr) {
        console.warn("No userDetails found in localStorage");
        setError("User not logged in");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      let userDetails;
      try {
        userDetails = JSON.parse(userDetailsStr);
      } catch (parseErr) {
        console.error("Error parsing userDetails:", parseErr);
        setError("Invalid user session");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      if (!userDetails?.id) {
        console.warn("No user ID found in userDetails");
        setError("Invalid user session");
        if (!skipLoadingStates) {
          setIsLoading(false);
        }
        return;
      }

      console.log("Fetching profile for user ID:", userDetails.id);
      // Use centralized config instead of hardcoded URL for consistent API routing
      const response = await fetch(`${config.BASE_URL}/CareGivers/${userDetails.id}`);
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched caregiver data:", data);
      console.log("Location fields in response:", {
        location: data.location,
        serviceCity: data.serviceCity,
        serviceState: data.serviceState,
        serviceAddress: data.serviceAddress,
        latitude: data.latitude,
        longitude: data.longitude
      });

      // Fetch location from Location table (new location system)
      let locationData = null;
      try {
        const locationResponse = await fetch(`${config.BASE_URL}/Location/user-location?userId=${userDetails.id}&userType=Caregiver`);
        if (locationResponse.ok) {
          const locationResult = await locationResponse.json();
          locationData = locationResult.data || locationResult;
          console.log("Fetched location from Location table:", locationData);
        } else {
          console.warn("Location endpoint returned non-OK status:", locationResponse.status);
        }
      } catch (locErr) {
        console.warn("Failed to fetch location from Location table:", locErr);
        // Not critical, continue with caregiver data
      }

      if (!isMountedRef.current) return;

      // Get verification status using dojahService (same as admin)
      let verificationStatus = null;
      try {
        const token = localStorage.getItem('authToken');
        console.log('ProfileHeader - token available:', !!token, 'token length:', token?.length);
        console.log('ProfileHeader - userDetails.id:', userDetails.id);
        
        // Check if token is expired and handle it
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            const isExpired = payload.exp < currentTime;
            console.log('ProfileHeader - token expires at:', new Date(payload.exp * 1000), 'is expired:', isExpired);
            
            if (isExpired) {
              console.log('ProfileHeader - Token expired, clearing localStorage and redirecting to login');
              localStorage.clear();
              toast.error('Your session has expired. Please log in again.');
              window.location.href = '/login';
              return;
            }
          } catch (e) {
            console.log('ProfileHeader - could not parse token payload, assuming invalid:', e);
            localStorage.clear();
            toast.error('Invalid session. Please log in again.');
            window.location.href = '/login';
            return;
          }
        }
        
        if (token) {
          verificationStatus = await getDojahStatus(userDetails.id, 'Caregiver', token);
          console.log("Fetched verification status from dojahService:", verificationStatus);
          setStatusFromApi(verificationStatus);
        } else {
          console.warn("No auth token available for verification status check");
        }
      } catch (verErr) {
        console.warn("Failed to fetch verification status:", verErr);
        
        // Handle 401 Unauthorized (expired/invalid token)
        if (verErr.message?.includes('Unauthorized') || verErr.message?.includes('401')) {
          console.log('ProfileHeader - Got 401, token likely expired, clearing localStorage and redirecting');
          localStorage.clear();
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
        
        // For other errors, set a default unverified state
        console.log("Setting default unverified state due to error");
        setStatusFromApi({
          verified: false,
          verificationStatus: 'error',
          message: 'Could not fetch verification status',
          hasVerification: false
        });
      }

      const updatedProfile = {
        name: data.firstName && data.lastName ? `${data.firstName.charAt(0).toUpperCase() + data.firstName.slice(1)} ${data.lastName.charAt(0).toUpperCase() + data.lastName.slice(1)}` : "John Doe",
        username: data.email || "user@example.com",
        bio: data.aboutMe || "Passionate caregiver dedicated to providing quality care.",
        rating: data.rating || 4.8,
        reviews: data.reviewsCount || 24,
        // Prioritize location from Location table, then fallback to old fields
        location: locationData?.city || 
                 data.serviceCity || 
                 (data.location && data.location.includes(',') ? data.location.split(',')[0].trim() : data.location) || 
                 (data.serviceAddress && data.serviceAddress.includes(',') ? data.serviceAddress.split(',')[1]?.trim() : null) ||
                 "New York",
        memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }).replace(',', ',') : "January 2023",
        lastDelivery: data.lastDelivery ? new Date(data.lastDelivery).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }).replace(',', ',') : "2 days ago",
        picture: data.profileImage || profilecard1,
        introVideo: data.introVideo || "",
        aboutMe: data.aboutMe || "",
        services: data.services || [],
        status: data.status || false,
        verificationStatus: statusFromApi, // Temporarily set to verified for testing
        isAvailable: data.isAvailable || false,
      };

      console.log("Updated profile with new image:", updatedProfile.picture);
      console.log("Updated profile location (from Location table):", updatedProfile.location);
      setProfile(updatedProfile);
      
      // Update AuthContext with fresh profile data
      const userUpdates = {};
      if (data.profileImage) {
        userUpdates.profileImage = data.profileImage;
        userUpdates.profilePicture = data.profileImage;
      }
      if (data.firstName) userUpdates.firstName = data.firstName;
      if (data.lastName) userUpdates.lastName = data.lastName;
      if (data.email) userUpdates.email = data.email;
      // Prioritize location data from Location table
      if (locationData?.city) userUpdates.serviceCity = locationData.city;
      else if (data.serviceCity) userUpdates.serviceCity = data.serviceCity;
      if (locationData?.state) userUpdates.serviceState = locationData.state;
      else if (data.serviceState) userUpdates.serviceState = data.serviceState;
      if (locationData?.address) userUpdates.serviceAddress = locationData.address;
      else if (data.serviceAddress) userUpdates.serviceAddress = data.serviceAddress;
      if (locationData?.address) userUpdates.location = locationData.address;
      else if (data.location) userUpdates.location = data.location;
      if (data.aboutMe) userUpdates.aboutMe = data.aboutMe;
      
      if (Object.keys(userUpdates).length > 0) {
        updateUser(userUpdates);
      }
      
      // Generate and save username using centralized utility
      if (data.firstName && data.email && data.createdAt) {
        const generatedUsername = generateUsername(
          data.firstName,
          data.email,
          data.createdAt
        );
        localStorage.setItem("userName", generatedUsername);
        console.log("Generated and saved username:", generatedUsername);
      }
      
    } catch (err) {
      console.error("Failed to load profile:", err);
      if (isMountedRef.current) {
        setError("Failed to load profile data");
      }
    } finally {
      if (isMountedRef.current && !skipLoadingStates) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="caregiver-profile-header-card">
        <div className="caregiver-loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="caregiver-profile-header-card">
        <div className="caregiver-error-message">{error}</div>
      </div>
    );
  }

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const userName = localStorage.getItem("userName");

  console.log("Rendering profile component with data========>:", profile);

  return (
    <div className="caregiver-profile-header">
      <div className="caregiver-profile-header-card">
        <div className="caregiver-profile-basic-info">
          <div className="caregiver-profile-img-container">
            {profile.picture && profile.picture !== profilecard1 ? (
              <img
                src={profile.picture}
                alt="Profile"
                className="caregiver-profile-img"
              />
            ) : (
              <div className="caregiver-profile-initials-avatar">
                {profile.name.split(' ').map(name => name.charAt(0).toUpperCase()).join('').slice(0, 2)}
              </div>
            )}
            <button 
              onClick={triggerImageUpload}
              disabled={imageUploadLoading}
              className="caregiver-profile-img-upload-btn"
              title="Update profile picture"
            >
              {imageUploadLoading ? (
                <span className="caregiver-upload-spinner">⟳</span>
              ) : (
                <span className="caregiver-upload-plus">+</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <h2 className="caregiver-profile-name">{profile.name}</h2>
          {userName && <p className="caregiver-username">@{userName}</p>}
          {/*bio should be limited to 60 characters */}
          <p className="caregiver-bio">{`"${profile.aboutMe.slice(0, 60)}${profile.aboutMe.length > 60 ? '...' : ''}"`}</p>
        </div>
      
        {/* <div className="caregiver-profile-rating-section">
          <div className="caregiver-rating">
            <span className="caregiver-stars">
              {"⭐".repeat(Math.round(profile.rating))}
            </span>
            <span className="caregiver-rating-text">
              ({profile.rating}, {profile.reviews} Reviews)
            </span>
          </div>
        </div> */}

        <div className="caregiver-profile-details">
          <div 
            className="caregiver-detail-item caregiver-detail-item-clickable"
            onClick={() => setShowLocationModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <span className="caregiver-detail-label">
              <FaMapMarkerAlt className="caregiver-detail-icon" /> Location
            </span>
            <span className="caregiver-detail-value">{profile.location}</span>
          </div>
          <div className="caregiver-detail-item">
            <span className="caregiver-detail-label">
              <FaCalendarAlt className="caregiver-detail-icon" /> Member since
            </span>
            <span className="caregiver-detail-value">{profile.memberSince}</span>
          </div>
          <div className="caregiver-detail-item">
            <span className="caregiver-detail-label">
              <FaTruck className="caregiver-detail-icon" /> Last delivery
            </span>
            <span className="caregiver-detail-value">{profile.lastDelivery}</span>
          </div>
          <div className="caregiver-detail-button">
            <button 
              onClick={() => handleAvailabilityToggle(true)}
              disabled={availabilityLoading}
              className={`caregiver-availability-btn ${profile.isAvailable ? 'active' : 'inactive'}`}
            >
              {availabilityLoading && profile.isAvailable !== true ? (
                <span className="caregiver-loading-text">...</span>
              ) : (
                "Available"
              )}
            </button>
            <button 
              onClick={() => handleAvailabilityToggle(false)}
              disabled={availabilityLoading}
              className={`caregiver-availability-btn ${!profile.isAvailable ? 'active' : 'inactive'}`}
            >
              {availabilityLoading && profile.isAvailable !== false ? (
                <span className="caregiver-loading-text">...</span>
              ) : (
                "Unavailable"
              )}
            </button>
          </div>
          
        </div>
       <div className="caregiver-profile-actions">
          {statusFromApi?.verificationStatus === "completed" || statusFromApi?.isVerified === true ? (
            <AssessmentButton 
              verificationStatus={statusFromApi?.verificationStatus || "completed"} 
              userId={userDetails?.id} 
            />
          ) : (
            <VerifyButton 
              verificationStatus={statusFromApi} 
              userId={userDetails?.id}
            />
          )}
        </div>
         
        {/* Development Tool for Testing - Remove in Production */}
        {process.env.NODE_ENV !== 'production' && <TestVerificationToggle />}

        {/* Location Edit Modal */}
        {showLocationModal && (
          <div 
            className="caregiver-location-modal-overlay"
            onClick={() => setShowLocationModal(false)}
          >
            <div 
              className="caregiver-location-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Update Your Service Location</h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6c757d', 
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                Enter your full address to help clients find you. We'll use this to show your city in your profile.
              </p>
              
              <AddressInput
                value={editedLocation}
                onChange={setEditedLocation}
                onValidation={setAddressValidation}
                placeholder="Enter full address (e.g., 123 Main St, Los Angeles, CA 90210)"
                className="caregiver-location-input"
                showValidationIcon={true}
                autoValidate={true}
                country="ng"
              />
              
              {/* Show validation status */}
              {addressValidation && (
                <div style={{ 
                  fontSize: '13px', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: addressValidation.isValid 
                    ? (addressValidation.isGoogleValidated ? '#d4edda' : '#fff3cd')
                    : '#f8d7da',
                  color: addressValidation.isValid 
                    ? (addressValidation.isGoogleValidated ? '#155724' : '#856404')
                    : '#721c24',
                  border: `1px solid ${addressValidation.isValid 
                    ? (addressValidation.isGoogleValidated ? '#c3e6cb' : '#ffeaa7')
                    : '#f5c6cb'}`
                }}>
                  {addressValidation.isGoogleValidated && addressValidation.isValid && (
                    <>
                      <strong>✓ Address verified by Google Maps</strong>
                      <br />
                      Your profile will show: <strong>{addressValidation.addressComponents?.city}</strong>
                    </>
                  )}
                  {!addressValidation.isGoogleValidated && addressValidation.isValid && (
                    <>
                      <strong>⚠ Basic validation passed</strong>
                      <br />
                      For better accuracy, select from the address suggestions above.
                    </>
                  )}
                  {addressValidation.hasError && (
                    <>
                      <strong>✗ Address validation failed</strong>
                      <br />
                      {addressValidation.errorMessage}
                    </>
                  )}
                </div>
              )}
              
              <div className="caregiver-modal-buttons">
                <button 
                  onClick={() => {
                    setShowLocationModal(false);
                    setEditedLocation("");
                    setAddressValidation(null);
                  }}
                  className="caregiver-modal-btn caregiver-modal-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLocationSave}
                  disabled={locationLoading || !editedLocation.trim() || (addressValidation && !addressValidation.isValid)}
                  className="caregiver-modal-btn caregiver-modal-save"
                  style={{
                    opacity: (locationLoading || !editedLocation.trim() || (addressValidation && !addressValidation.isValid)) ? 0.6 : 1
                  }}
                >
                  {locationLoading ? 'Updating Location...' : 'Update Location'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <IntroVideo 
        profileIntrovideo={profile.introVideo} 
        onVideoUpdate={() => fetchProfile(true)}
      />
      <ProfileInformation 
        aboutMe={profile.aboutMe} 
        services={profile.services}
        onUpdate={(newAboutMe) => setProfile(prev => ({ ...prev, aboutMe: newAboutMe }))}
      />
    </div>
  );
};

export default ProfileHeader;

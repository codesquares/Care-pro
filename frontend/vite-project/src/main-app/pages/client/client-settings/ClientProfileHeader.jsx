import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import profilecard1 from "../../../../assets/profilecard1.png";
import { FaMapMarkerAlt, FaCalendarAlt, FaPhone } from "react-icons/fa";
import AddressInput from "../../../components/AddressInput";
import ClientSettingsService from "../../../services/ClientSettingsService";
import config from "../../../config";
import { useAuth } from "../../../context/AuthContext";

const ClientProfileHeader = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    bio: "",
    location: "",
    memberSince: "",
    picture: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFullAddressModal, setShowFullAddressModal] = useState(false);
  const [editedLocation, setEditedLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressValidation, setAddressValidation] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLocationSave = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    
    if (!editedLocation.trim()) {
      toast.warning("Please enter a location");
      return;
    }

    if (addressValidation && !addressValidation.isValid) {
      toast.warning("Please enter a valid address or select from suggestions");
      return;
    }

    try {
      setLocationLoading(true);
      
      // Use formatted address if available from Google validation, otherwise use input
      const addressToSend = addressValidation?.formattedAddress || editedLocation;
      
      // API call to update location using the new dedicated endpoint
      const response = await fetch(`${config.BASE_URL}/Clients/UpdateClientLocation/${userDetails.id}`, {
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
            errorMessage = 'Client not found. Please check your account.';
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

      // Update AuthContext with new location data
      updateUser({
        homeAddress: addressToSend,
        serviceCity: result?.data?.city || addressValidation?.addressComponents?.city,
        serviceState: result?.data?.state || addressValidation?.addressComponents?.state,
        location: addressToSend
      });

      // Update the profile display with the new location
      // Do this AFTER fetchProfile would overwrite it, or skip fetchProfile entirely
      setProfile(prev => ({
        ...prev,
        location: addressToSend
      }));

      setShowLocationModal(false);
      setEditedLocation("");
      setAddressValidation(null);
      
      // Show success message with city if available
      const cityName = result.data?.city || addressValidation?.addressComponents?.city || 'location';
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

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select an image file');
      return;
    }

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

      const response = await fetch(`${config.BASE_URL}/Clients/UpdateProfilePicture/${userDetails.id}`, {
        method: 'PUT',
        headers: {
          'accept': '*/*',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile picture');
      }

      const result = await response.text();
      console.log('Upload response:', result);
      
      // Fetch fresh profile data to get the updated image URL
      const freshData = await fetchProfile(true);
      
      toast.success('Profile picture updated successfully!');
      
    } catch (err) {
      console.error('Error updating profile picture:', err);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setImageUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
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

      console.log("Fetching profile for client ID:", userDetails.id);
      const response = await fetch(`${config.BASE_URL}/Clients/${userDetails.id}`);
      
      if (!response.ok) {
        console.error("API response not ok:", response.status, response.statusText);
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched client data:", data);

      // Fetch location from Location table (new location system)
      let locationData = null;
      try {
        const locationResponse = await fetch(`${config.BASE_URL}/Location/user-location?userId=${userDetails.id}&userType=Client`);
        if (locationResponse.ok) {
          const locationResult = await locationResponse.json();
          locationData = locationResult.data || locationResult;
          console.log("Fetched location from Location table:", locationData);
        } else {
          console.warn("Location endpoint returned non-OK status:", locationResponse.status);
        }
      } catch (locErr) {
        console.warn("Failed to fetch location from Location table:", locErr);
        // Not critical, continue with client data
      }

      if (!isMountedRef.current) return;

      const updatedProfile = {
        name: data.firstName && data.lastName ? `${data.firstName.charAt(0).toUpperCase() + data.firstName.slice(1)} ${data.lastName.charAt(0).toUpperCase() + data.lastName.slice(1)}` : "Client User",
        email: data.email || "user@example.com",
        phoneNumber: data.phoneNumber || data.phoneNo || "Not provided",
        bio: data.bio || "Care Pro client seeking quality care services.",
        // Prioritize location from Location table, then fallback to old fields
        location: locationData?.address || data.homeAddress || data.address || "Not set",
        memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }).replace(',', ',') : "Recently joined",
        picture: data.profileImage || data.profilePicture || data.image || profilecard1,
      };

      console.log("Updated profile with new data:", updatedProfile);
      console.log("Updated profile location (from Location table):", updatedProfile.location);
      console.log("Profile picture URL:", data.profilePicture, data.profileImage, data.image);
      
      // Update AuthContext and localStorage with fresh data
      const userUpdates = {};
      if (data.profileImage || data.profilePicture) {
        userUpdates.profileImage = data.profileImage || data.profilePicture;
        userUpdates.profilePicture = data.profileImage || data.profilePicture;
      }
      if (data.firstName) userUpdates.firstName = data.firstName;
      if (data.lastName) userUpdates.lastName = data.lastName;
      if (data.email) userUpdates.email = data.email;
      if (data.phoneNumber || data.phoneNo) userUpdates.phoneNumber = data.phoneNumber || data.phoneNo;
      // Prioritize location data from Location table
      if (locationData?.address) userUpdates.homeAddress = locationData.address;
      else if (data.homeAddress) userUpdates.homeAddress = data.homeAddress;
      if (locationData?.address) userUpdates.address = locationData.address;
      else if (data.address) userUpdates.address = data.address;
      if (locationData?.city) userUpdates.serviceCity = locationData.city;
      if (locationData?.state) userUpdates.serviceState = locationData.state;
      if (data.bio) userUpdates.bio = data.bio;
      
      if (Object.keys(userUpdates).length > 0) {
        updateUser(userUpdates);
      }
      
      setProfile(updatedProfile);
      
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
      <div className="client-profile-header-card">
        <div className="client-loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-profile-header-card">
        <div className="client-error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="client-profile-header">
      <div className="client-profile-header-card">
        <div className="client-profile-basic-info">
          <div className="client-profile-img-container">
            {profile.picture && profile.picture !== profilecard1 ? (
              <img
                src={`${profile.picture}?t=${Date.now()}`}
                alt="Profile"
                className="client-profile-img"
                onError={(e) => {
                  console.error("Image failed to load:", profile.picture);
                }}
              />
            ) : (
              <div className="client-profile-initials-avatar">
                {profile.name.split(' ').map(name => name.charAt(0).toUpperCase()).join('').slice(0, 2)}
              </div>
            )}
            <button 
              onClick={triggerImageUpload}
              disabled={imageUploadLoading}
              className="client-profile-img-upload-btn"
              title="Update profile picture"
            >
              {imageUploadLoading ? (
                <span className="client-upload-spinner">⟳</span>
              ) : (
                <span className="client-upload-plus">+</span>
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
          <h2 className="client-profile-name">{profile.name}</h2>
          <p className="client-email">{profile.email}</p>
        </div>

        <div className="client-profile-details">
          <div 
            className="client-detail-item client-detail-item-clickable"
            onClick={() => setShowLocationModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <span className="client-detail-label">
              <FaMapMarkerAlt className="client-detail-icon" /> Location
            </span>
            <span className="client-detail-value">
              {profile.location && profile.location !== "Not set" ? (
                <span 
                  style={{ 
                    color: '#4a6bdf', 
                    cursor: 'pointer',
                    fontWeight: '500',
                    textDecoration: 'underline'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullAddressModal(true);
                  }}
                >
                  show
                </span>
              ) : (
                profile.location
              )}
            </span>
          </div>
          <div className="client-detail-item">
            <span className="client-detail-label">
              <FaPhone className="client-detail-icon" /> Phone
            </span>
            <span className="client-detail-value">{profile.phoneNumber}</span>
          </div>
          <div className="client-detail-item">
            <span className="client-detail-label">
              <FaCalendarAlt className="client-detail-icon" /> Member since
            </span>
            <span className="client-detail-value">{profile.memberSince}</span>
          </div>
        </div>

        {/* Location Edit Modal */}
        {showLocationModal && (
          <div 
            className="client-location-modal-overlay"
            onClick={() => setShowLocationModal(false)}
          >
            <div 
              className="client-location-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Update Your Service Location</h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6c757d', 
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                Enter your full address to help caregivers find you. We'll use this to show your city in your profile.
              </p>
              
              <AddressInput
                value={editedLocation}
                onChange={setEditedLocation}
                onValidation={setAddressValidation}
                placeholder="Enter full address (e.g., 123 Main St, Los Angeles, CA 90210)"
                className="client-location-input"
                showValidationIcon={true}
                autoValidate={true}
                country="ng"
              />
              
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
              
              <div className="client-modal-buttons">
                <button 
                  onClick={() => {
                    setShowLocationModal(false);
                    setEditedLocation("");
                    setAddressValidation(null);
                  }}
                  className="client-modal-btn client-modal-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLocationSave}
                  disabled={locationLoading || !editedLocation.trim() || (addressValidation && !addressValidation.isValid)}
                  className="client-modal-btn client-modal-save"
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

        {/* Full Address Modal */}
        {showFullAddressModal && (
          <div 
            className="client-location-modal-overlay"
            onClick={() => setShowFullAddressModal(false)}
          >
            <div 
              className="client-location-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Full Address</h3>
              <p style={{ 
                fontSize: '15px', 
                color: '#374151', 
                marginBottom: '20px',
                lineHeight: '1.6',
                wordBreak: 'break-word'
              }}>
                {profile.location}
              </p>
              
              <div className="client-modal-buttons">
                <button 
                  onClick={() => setShowFullAddressModal(false)}
                  className="client-modal-btn client-modal-save"
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfileHeader;

import './profile-information.css'
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import config from "../../../config";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";

const ProfileInformation = ({ aboutMe, onUpdate, services = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [editedAboutMe, setEditedAboutMe] = useState(aboutMe || '');
  const [loading, setLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateIssuer, setCertificateIssuer] = useState('');
  const [certificateYear, setCertificateYear] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // State for certificate viewing modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // New state for certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  
  // Get the caregiver status context to refresh certificate status
  const { updateCertificates } = useCaregiverStatus();

  // Fetch certificates for the user
  const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const response = await fetch(`${config.BASE_URL}/Certificates?caregiverId=${userDetails?.id}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.status}`);
      }

      const response_data = await response.json();
      console.log('Fetched certificates response:', response_data);
      
      // Handle the API response structure: { success: true, data: [...] }
      const certificates = response_data?.success ? response_data.data : (response_data || []);
      
      console.log('Certificate structure check:', {
        count: certificates?.length || 0,
        firstCert: certificates?.[0] || null,
        hasUrls: certificates?.some(cert => cert.certificateUrl) || false,
        allHaveUrls: certificates?.every(cert => cert.certificateUrl) || false
      });
      setCertificates(certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
    }
  };

  // Fetch certificates on component mount
  useEffect(() => {
    if (userDetails?.id) {
      fetchCertificates();
    }
  }, [userDetails?.id]);

  // Helper function to convert file to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix to get just the Base64 string
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${config.BASE_URL}/CareGivers/UpdateCaregiverAboutMeInfo/${userDetails.id}?AboutMe=${encodeURIComponent(editedAboutMe)}`, { // Using centralized API config
        AboutMe: editedAboutMe,
      });
      setShowModal(false);
      toast.success("About Me updated successfully!");
      onUpdate(editedAboutMe);
    } catch (err) {
      console.error('Failed to update About Me:', err);
      toast.error("Failed to update About Me");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile || !certificateName || !certificateIssuer || !certificateYear) {
      toast.error("Please complete all fields");
      return;
    }

    try {
      setUploadLoading(true);
      
      // Convert file to Base64
      const base64Certificate = await convertFileToBase64(certificateFile);
      
      // Create the request payload matching the API specification
      const requestPayload = {
        certificateName: certificateName,
        caregiverId: userDetails.id,
        certificateIssuer: certificateIssuer,
        certificate: base64Certificate,
        yearObtained: new Date(certificateYear, 0, 1).toISOString() // Convert year to ISO DateTime
      };

      await axios.post(`${config.BASE_URL}/Certificates`, requestPayload, { // Using centralized API config
        headers: { 
          "Content-Type": "application/json",
          "Accept": "*/*"
        }
      });
      
      setShowCertModal(false);
      // Reset fields
      setCertificateFile(null);
      setCertificateName('');
      setCertificateIssuer('');
      setCertificateYear('');
      // Show success modal instead of toast
      setShowSuccessModal(true);
      // Refresh the certificates list
      await fetchCertificates();
      // IMPORTANT: Update the global caregiver status context
      await updateCertificates();
    } catch (err) {
      console.error("Upload failed", err);
      toast.error(`Upload failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset all form fields
    setCertificateFile(null);
    setCertificateName('');
    setCertificateIssuer('');
    setCertificateYear('');
    // Close modal
    setShowCertModal(false);
  };

  // Function to get certificate view URL
  const getCertificateViewUrl = (certificateId) => {
    return `${config.BASE_URL}/Certificates/certificateId?certificateId=${certificateId}`;
  };

  // Function to open certificate in modal
  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setShowViewModal(true);
  };

  // Function to close certificate view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedCertificate(null);
  };

  return (
    <div>
      <div className="profile-information-section">
        <h3>Description</h3>
        <p>{aboutMe || 'No description provided'}</p>
        <button 
          onClick={() => setShowModal(true)}
          className="edit-description-btn"
        >
          Edit Description
        </button>
      </div>

      <div className="services-section">
        <h3>Services</h3>
        <div className="services-list">
          {services && services.length > 0 ? (
            services.map((service, index) => (
              <span key={index} className="service-tag">
                {service}
              </span>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px dashed #dee2e6',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <div style={{ fontSize: '1rem', marginBottom: '8px' }}>
                🔧💼
              </div>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
                No services yet since a gig has not been created
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="certifications-section">
        <h3>Certifications</h3>
        <div className="certifications-list">
          {certificatesLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: '#6c757d'
            }}>
              Loading certificates...
            </div>
          ) : certificates.length > 0 ? (
            certificates.map((cert) => (
              <div key={cert.id} className="certification-item">
                <h4>{cert.certificateName}</h4>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                  Issued by: {cert.certificateIssuer}
                </p>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                  Year: {new Date(cert.yearObtained).getFullYear()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  {cert.certificateUrl && (
                    <button 
                      onClick={() => handleViewCertificate(cert)}
                      className="certificate-view-link"
                      style={{
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #0066cc',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      📜 View Certificate
                    </button>
                  )}
                  <span style={{
                    fontSize: '12px',
                    color: cert.isVerified ? '#28a745' : '#dc3545',
                    fontWeight: '500',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: cert.isVerified ? '#d4edda' : '#f8d7da'
                  }}>
                    {cert.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px dashed #dee2e6',
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                📜
              </div>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
                No certificates uploaded yet
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                Add your professional certifications to build trust with clients
              </p>
            </div>
          )}
          <button 
            onClick={() => setShowCertModal(true)}
            className="add-certification-btn"
          >
            + Add Certificate
          </button>
        </div>
      </div>

      {/* About Me Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit About Me</h3>
            <textarea
              value={editedAboutMe}
              onChange={(e) => setEditedAboutMe(e.target.value)}
              placeholder="Tell clients about yourself..."
              rows={6}
              autoFocus
            />
            <div className="modal-actions">
              <button 
                onClick={() => setShowModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="modal-btn save"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Upload Modal */}
      {showCertModal && (
        <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Upload Certificate</h3>
            <input
              type="text"
              placeholder="Certificate Name"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Certificate Issuer"
              value={certificateIssuer}
              onChange={(e) => setCertificateIssuer(e.target.value)}
            />
            <input
              type="number"
              placeholder="Year Obtained (e.g. 2020)"
              value={certificateYear}
              onChange={(e) => setCertificateYear(e.target.value)}
              min="1950"
              max={new Date().getFullYear()}
              step="1"
            />
            <input
              type="file"
              onChange={(e) => setCertificateFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className="modal-actions">
              <button 
                onClick={handleCancel}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadCertificate}
                disabled={uploadLoading}
                className="modal-btn save"
              >
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate View Modal */}
      {showViewModal && selectedCertificate && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh', padding: '20px' }}>
            <div className="modal-header">
              <h3>Certificate: {selectedCertificate.certificateName}</h3>
              <button 
                onClick={handleCloseViewModal}
                className="modal-close"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Issuer:</strong> {selectedCertificate.certificateIssuer}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Year:</strong> {new Date(selectedCertificate.yearObtained).getFullYear()}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <span style={{
                    color: selectedCertificate.isVerified ? '#28a745' : '#dc3545',
                    fontWeight: '500',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: selectedCertificate.isVerified ? '#d4edda' : '#f8d7da'
                  }}>
                    {selectedCertificate.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                  </span>
                </p>
              </div>
              <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                <img 
                  src={selectedCertificate.certificateUrl} 
                  alt={selectedCertificate.certificateName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', padding: '20px', color: '#666' }}>
                  <p>Unable to load certificate image</p>
                  <a 
                    href={selectedCertificate.certificateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0066cc' }}
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-container">
              <div className="success-checkmark">
                <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="tickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4"/>
                      <stop offset="50%" stopColor="#0891b2"/>
                      <stop offset="100%" stopColor="#a7f3d0"/>
                    </linearGradient>
                  </defs>
                  <path 
                    d="M25 50 L42 67 L75 33" 
                    stroke="url(#tickGradient)" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <h3>Your certificate has been successfully uploaded</h3>
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="success-modal-btn"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;

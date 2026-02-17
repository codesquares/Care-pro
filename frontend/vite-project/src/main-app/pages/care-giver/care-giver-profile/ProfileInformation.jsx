import './profile-information.css'
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import config from "../../../config";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import CertificateUploadModal from "../../../components/shared/CertificateUploadModal";

const ProfileInformation = ({ aboutMe, onUpdate, services = [] }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [editedAboutMe, setEditedAboutMe] = useState(aboutMe || '');
  const [loading, setLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  
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

  // Auto-open certificate upload modal when navigated with ?uploadCert=true
  useEffect(() => {
    if (searchParams.get('uploadCert') === 'true') {
      setShowCertModal(true);
      // Remove the param so refreshing doesn't re-trigger
      searchParams.delete('uploadCert');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch certificates for the user
  const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Don't make API call if no token
      if (!token || !userDetails?.id) {
        setCertificates([]);
        setCertificatesLoading(false);
        return;
      }
      
      const response = await fetch(`${config.BASE_URL}/Certificates?caregiverId=${userDetails?.id}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.status}`);
      }

      const response_data = await response.json();
      
      // Handle the API response structure: { success: true, data: [...] }
      const certificates = response_data?.success ? response_data.data : (response_data || []);
      
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



  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${config.BASE_URL}/CareGivers/UpdateCaregiverAboutMeInfo/${userDetails.id}?AboutMe=${encodeURIComponent(editedAboutMe)}`, { // Using centralized API config
        AboutMe: editedAboutMe,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
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

  // Called when the shared CertificateUploadModal finishes uploading
  const handleCertUploadDone = async () => {
    setShowCertModal(false);
    await fetchCertificates();
    await updateCertificates();
  };

  // Function to get certificate view URL
  const getCertificateViewUrl = (certificateId) => {
    return `${config.BASE_URL}/Certificates/certificateId?certificateId=${certificateId}`;
  };

  // Helper function to get status badge configuration
  const getStatusBadgeConfig = (cert) => {
    const status = cert.verificationStatus || (cert.isVerified ? 'Verified' : 'PendingVerification');
    
    const configs = {
      'Verified': {
        text: '✅ Verified',
        color: '#22c55e',
        bgColor: '#d1fae5',
        icon: '✅'
      },
      'ManualReviewRequired': {
        text: '⚠️ Under Review',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⚠️'
      },
      'Invalid': {
        text: '❌ Invalid',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌'
      },
      'Rejected': {
        text: '❌ Rejected',
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌'
      },
      'VerificationFailed': {
        text: '🔄 Verification Failed',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: '🔄'
      },
      'PendingVerification': {
        text: '⏳ Pending',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        icon: '⏳'
      }
    };
    
    return configs[status] || configs['PendingVerification'];
  };

  // Helper function to parse error messages
  const parseErrorMessages = (errorMessage) => {
    if (!errorMessage) return [];
    return errorMessage.split(' | ').filter(msg => msg.trim());
  };

  // Function to retry verification for a certificate
  const handleRetryVerification = async (certificateId) => {
    try {
      setUploadLoading(true);
      await axios.post(`${config.BASE_URL}/Certificates/${certificateId}/retry-verification`, {}, {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      toast.success("Verification retry initiated");
      await fetchCertificates();
    } catch (err) {
      console.error("Retry verification failed", err);
      toast.error(`Retry failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setUploadLoading(false);
    }
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
            certificates.map((cert) => {
              const statusConfig = getStatusBadgeConfig(cert);
              const errorMessages = parseErrorMessages(cert.verificationErrorMessage || cert.errorMessage);
              const confidence = cert.verificationConfidence ? (cert.verificationConfidence * 100).toFixed(0) : null;
              const canRetry = cert.verificationStatus === 'VerificationFailed' || cert.verificationStatus === 'Invalid';
              
              return (
                <div key={cert.id} className="certification-item" style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{cert.certificateName}</h4>
                    <span style={{
                      fontSize: '12px',
                      color: statusConfig.color,
                      fontWeight: '500',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: statusConfig.bgColor,
                      whiteSpace: 'nowrap'
                    }}>
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                    Issued by: {cert.certificateIssuer}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                    Year: {new Date(cert.yearObtained).getFullYear()}
                  </p>
                  
                  {confidence && (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#4b5563' }}>
                      Confidence: <strong>{confidence}%</strong>
                    </p>
                  )}
                  
                  {cert.verificationDate && (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af' }}>
                      Verified: {new Date(cert.verificationDate).toLocaleDateString()}
                    </p>
                  )}
                  
                  {errorMessages.length > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '4px',
                      borderLeft: '3px solid #ef4444'
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                        Validation Issues:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: '#991b1b' }}>
                        {errorMessages.map((msg, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {cert.verificationStatus === 'ManualReviewRequired' && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#fffbeb',
                      borderRadius: '4px',
                      borderLeft: '3px solid #f59e0b'
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                        ⏱️ Your certificate is being reviewed by our team. Expected response: 24-48 hours.
                      </p>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {cert.certificateUrl && (
                      <button 
                        onClick={() => handleViewCertificate(cert)}
                        className="certificate-view-link"
                        style={{
                          color: '#0066cc',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          padding: '6px 12px',
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
                    
                    {canRetry && (
                      <button 
                        onClick={() => handleRetryVerification(cert.id)}
                        disabled={uploadLoading}
                        style={{
                          color: '#6b7280',
                          fontSize: '13px',
                          fontWeight: '500',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          transition: 'all 0.2s ease',
                          backgroundColor: 'white',
                          cursor: uploadLoading ? 'not-allowed' : 'pointer',
                          opacity: uploadLoading ? 0.6 : 1
                        }}
                      >
                        🔄 Retry Verification
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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

      {/* Certificate Upload Modal (shared component) */}
      <CertificateUploadModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        caregiverId={userDetails?.id}
        onUploadDone={handleCertUploadDone}
      />

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
                
                {(() => {
                  const statusConfig = getStatusBadgeConfig(selectedCertificate);
                  const confidence = selectedCertificate.verificationConfidence ? (selectedCertificate.verificationConfidence * 100).toFixed(0) : null;
                  
                  return (
                    <div style={{ margin: '10px 0' }}>
                      <span style={{
                        color: statusConfig.color,
                        fontWeight: '500',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: statusConfig.bgColor,
                        fontSize: '14px'
                      }}>
                        {statusConfig.text}
                      </span>
                      {confidence && (
                        <p style={{ margin: '8px 0', fontSize: '13px', color: '#4b5563' }}>
                          Verification Confidence: <strong>{confidence}%</strong>
                        </p>
                      )}
                    </div>
                  );
                })()}
                
                {selectedCertificate.extractedInfo && (
                  <div style={{
                    marginTop: '15px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    textAlign: 'left'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Extracted Information:
                    </p>
                    {selectedCertificate.extractedInfo.firstName && (
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                        Name: {selectedCertificate.extractedInfo.firstName} {selectedCertificate.extractedInfo.lastName}
                      </p>
                    )}
                    {selectedCertificate.extractedInfo.documentNumber && (
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                        Document Number: {selectedCertificate.extractedInfo.documentNumber}
                      </p>
                    )}
                    {selectedCertificate.extractedInfo.issueDate && (
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                        Issue Date: {new Date(selectedCertificate.extractedInfo.issueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
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

import './profile-information.css'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import config from '../../../config'; // Centralized API configuration

const ProfileInformation = ({ profileDescription, onUpdate, services}) => {
  const [showModal, setShowModal] = useState(false);
  const [editedAboutMe, setEditedAboutMe] = useState(profileDescription);
  const [loading, setLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateIssuer, setCertificateIssuer] = useState('');
  const [certificateYear, setCertificateYear] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // New state for certificates
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

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

      const data = await response.json();
      console.log('Fetched certificates:', data);
      setCertificates(data || []);
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
      toast.success("Certificate uploaded successfully!");
      // Refresh the certificates list
      await fetchCertificates();
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

  return (
    <div>
      <div className="profile-information-section">
        <h3>Description</h3>
        <p>{profileDescription}</p>
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
              <div key={cert.id || cert.certificateId} className="certification-item">
                <h4>{cert.name || cert.certificateName}</h4>
                {cert.issuer && (
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                    Issued by: {cert.issuer}
                  </p>
                )}
                {cert.year && (
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                    Year: {cert.year}
                  </p>
                )}
                <a 
                  href={getCertificateViewUrl(cert.id || cert.certificateId)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Certificate
                </a>
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
              placeholder="Year Obtained"
              value={certificateYear}
              onChange={(e) => setCertificateYear(e.target.value)}
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
    </div>
  );
};

export default ProfileInformation;

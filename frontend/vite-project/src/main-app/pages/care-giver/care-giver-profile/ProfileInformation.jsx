import './profile-information.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';

const ProfileInformation = ({ profileDescription, onUpdate, services}) => {
  const [showModal, setShowModal] = useState(false);
  const [editedAboutMe, setEditedAboutMe] = useState(profileDescription);
  const [loading, setLoading] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateName, setCertificateName] = useState('');
  const [certificateIssuer, setCertificateIssuer] = useState('');
  const [certificateYear, setCertificateYear] = useState('');

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverAboutMeInfo/${userDetails.id}?AboutMe=${encodeURIComponent(editedAboutMe)}`, {
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
      alert("Please complete all fields");
      return;
    }

    const formData = new FormData();
    formData.append("file", certificateFile);
    formData.append("name", certificateName);
    formData.append("issuer", certificateIssuer);
    formData.append("year", certificateYear);
    formData.append("caregiverId", userDetails.id);

    try {
      await axios.post("https://carepro-api20241118153443.azurewebsites.net/api/certificates", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setShowCertModal(false);
      // Reset fields
      setCertificateFile(null);
      setCertificateName('');
      setCertificateIssuer('');
      setCertificateYear('');
      toast.success("Certificate uploaded successfully!");
      // Optionally refresh list
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  // const services = [
  //   "Rehabilitation services", "Dental care", "Cooking",
  //   "Acupuncture", "Nursing care", "Emergency response", "Home care"
  // ];

  const certifications = [
    { name: "WHO nursing certificate 2021", link: "#" },
    { name: "Caring for the elderly: NHS Programme 2020", link: "#" },
  ];

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
          {certifications.map((cert, index) => (
            <div key={index} className="certification-item">
              <h4>{cert.name}</h4>
              <a href={cert.link} target="_blank" rel="noopener noreferrer">
                View Certificate
              </a>
            </div>
          ))}
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
                onClick={() => setShowCertModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadCertificate}
                className="modal-btn save"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;

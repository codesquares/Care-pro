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
      <div className="description" style={{ 
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#333'
        }}>About Me</h3>
        <p style={{ 
          margin: '0 0 15px 0', 
          fontSize: '14px', 
          lineHeight: '1.5',
          color: '#666'
        }}>{profileDescription}</p>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            padding: '8px 16px',
            border: '1px solid #007bff',
            borderRadius: '6px',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '80px',
            height: '36px'
          }}
        >Edit</button>
      </div>

      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      <div className="services" style={{ 
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#333'
        }}>Services</h3>
        <div className="services-list">
          {services && services.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {services.map((service, i) => (
                <div key={i} style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#495057'
                }}>{service}</div>
              ))}
            </div>
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

      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      <div className="certifications" style={{ 
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px', 
          fontWeight: '600',
          color: '#333'
        }}>Certifications</h3>
        <div style={{ 
          margin: '0 0 15px 0'
        }}>
          {certifications.map((c, i) => (
            <div key={i} style={{ 
              display: 'flex',
              alignItems: 'center',
              margin: '8px 0',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <span style={{ 
                marginRight: '10px', 
                fontSize: '16px',
                color: '#28a745'
              }}>🏆</span>
              <a href={c.link} target="_blank" rel="noreferrer" style={{
                color: '#007bff',
                textDecoration: 'none',
                flex: 1
              }}>{c.name}</a>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setShowCertModal(true)}
          style={{
            padding: '8px 16px',
            border: '1px solid #007bff',
            borderRadius: '6px',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '80px',
            height: '36px'
          }}
        >Add Certificate</button>
      </div>

      {/* Edit About Me Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            maxWidth: "400px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "600" }}>Edit About Me</h3>
            <textarea
              value={editedAboutMe}
              onChange={(e) => setEditedAboutMe(e.target.value)}
              rows={6}
              style={{ 
                width: '100%', 
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '15px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: loading ? "#ccc" : "#007bff",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Upload Modal */}
      {showCertModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowCertModal(false)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            maxWidth: "400px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", fontWeight: "600" }}>Upload Certificate</h3>
            <input
              type="text"
              placeholder="Certificate Name"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="text"
              placeholder="Certificate Issuer"
              value={certificateIssuer}
              onChange={(e) => setCertificateIssuer(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="number"
              placeholder="Year Obtained"
              value={certificateYear}
              onChange={(e) => setCertificateYear(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "10px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="file"
              onChange={(e) => setCertificateFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                marginBottom: "15px",
                boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowCertModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >Cancel</button>
              <button 
                onClick={handleUploadCertificate}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#007bff",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  minWidth: "80px",
                  height: "36px"
                }}
              >Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;

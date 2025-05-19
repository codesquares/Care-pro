import './profile-information.css'
import { useState } from 'react'
import axios from 'axios'

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
      await axios.put(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverInfo/${userDetails.id}`, {
        aboutMe: editedAboutMe,
      });
      setShowModal(false);
      onUpdate(editedAboutMe);
    } catch (err) {
      console.error('Failed to update About Me:', err);
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
      <div className="description">
        <h3>About Me</h3>
        <p>{profileDescription}</p>
        <button onClick={() => setShowModal(true)}>Edit</button>
      </div>

      <hr />

      <div className="services">
        <h3>Services</h3>
        <ul>
          {services.map((service, i) => <li key={i}>{service}</li>)}
        </ul>
      </div>

      <hr />

      <div className="certifications">
        <h3>Certifications</h3>
        <ul>
          {certifications.map((c, i) => (
            <li key={i}><a href={c.link} target="_blank" rel="noreferrer">{c.name}</a></li>
          ))}
        </ul>
        <button onClick={() => setShowCertModal(true)}>Add Certificate</button>
      </div>

      {/* Edit About Me Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit About Me</h3>
            <textarea
              value={editedAboutMe}
              onChange={(e) => setEditedAboutMe(e.target.value)}
              rows={6}
              style={{ width: '100%' }}
            />
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Upload Modal */}
      {showCertModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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
              <button onClick={() => setShowCertModal(false)}>Cancel</button>
              <button onClick={handleUploadCertificate}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;

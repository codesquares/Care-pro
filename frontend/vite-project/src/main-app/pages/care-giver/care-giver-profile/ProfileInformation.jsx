import './profile-information.css'
import { useState } from 'react'
import axios from 'axios'

const ProfileInformation = ({ profileDescription, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editedAboutMe, setEditedAboutMe] = useState(profileDescription);
  const [loading, setLoading] = useState(false);

  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`https://carepro-api20241118153443.azurewebsites.net/api/CareGivers/UpdateCaregiverInfo/${userDetails.id}`, {
        AboutMe: editedAboutMe,
      });
      setShowModal(false);
      onUpdate(editedAboutMe); // trigger parent update if needed
    } catch (err) {
      console.error('Failed to update About Me:', err);
    } finally {
      setLoading(false);
    }
  };

  const caregiverServices = [/* ...your existing caregiverServices array... */];

  const services = [
    "Rehabilitation services", "Dental care", "Cooking",
    "Acupuncture", "Nursing care", "Emergency response", "Home care"
  ];

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
            <li key={i}><a href={c.link}>{c.name}</a></li>
          ))}
        </ul>
      </div>

      {/* Modal */}
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
    </div>
  );
};

export default ProfileInformation;

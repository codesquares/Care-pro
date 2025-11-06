import { useState } from "react";
import "../styles/components/waitlist-modal.scss";
import Modal from "../main-app/components/modal/Modal";

const WaitlistModal = ({ isOpen, onClose, option }) => {
  const [loading, setLoading] = useState(false);

  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    state: "",
    serviceOfIntrest: "",
    source: "",
    option: option,
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const formBody = new URLSearchParams();
    Object.keys(formData).forEach((key) => {
      formBody.append(key, formData[key]);
    });

    fetch(
      "https://script.google.com/macros/s/AKfycbwhH0GoZ27MqEjbSc3MoxgMwCgLB4Ta6738cSHPeSre2RCSEXm_p6nsy0C2tDe1rVoVxg/exec",
      {
        method: "POST",
        body: formBody,
      }
    )
      .then((response) => {
        if (response.ok) {
          // Reset form data
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            state: "",
            serviceOfIntrest: "",
            source: "",
            option: option,
          });
          
          // Show success modal
          setModalTitle('Successfully Joined Waitlist!');
          setModalDescription(`Thank you ${formData.firstName}! You're now on our waitlist. We'll notify you as soon as Care-pro services become available in your area.`);
          setButtonText('Close');
          setButtonBgColor('#00B4A6');
          setIsError(false);
          setIsModalOpen(true);
          
        } else {
          throw new Error("Submission failed");
        }
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        
        // Show error modal
        setModalTitle('Submission Failed');
        setModalDescription('Oops! There was an error submitting your response. Please check your details and try again.');
        setButtonText('Try Again');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (!isError) {
      onClose(); // Close the waitlist modal on success
    }
  };

  return (
    <div className="waitlist-modal">
      <div className="waitlist-modal__overlay" onClick={onClose}></div>
      <div className="waitlist-modal__content">
        <button className="waitlist-modal__close" onClick={onClose}>
          &times;
        </button>
        <h2 className="waitlist-modal__title">Join the waitlist</h2>
        <p className="waitlist-modal__subtitle">
          Be first on the list to receive care when we launch!
        </p>
        <form className="waitlist-modal__form" onSubmit={handleSubmit}>
          <div className="waitlist-modal__field">
            <label htmlFor="firstName" className="waitlist-modal__label">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="waitlist-modal__form-field-input"
            />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="lastName" className="waitlist-modal__label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="waitlist-modal__form-field-input"
            />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="email" className="waitlist-modal__label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="waitlist-modal__form-field-input"
            />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="phoneNumber" className="waitlist-modal__label">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="waitlist-modal__form-field-input"
            />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="state" className="waitlist-modal__label">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="waitlist-modal__form-field-input"
            />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="serviceOfIntrest" className="waitlist-modal__label">
              Service of Interest
            </label>
            <select
              id="serviceOfIntrest"
              name="serviceOfIntrest"
              value={formData.serviceOfIntrest}
              onChange={handleChange}
              className="waitlist-modal__form-field-input"
            >
              <option value="">Select a service</option>
              <option value="Client">Client</option>
              <option value="Care-giver">Care-giver</option>
            </select>
          </div>
          <div className="waitlist-modal__field">
            <p className="waitlist-modal__option-subtitle">How did you hear about us?</p>
            <div className="waitlist-modal__options">
              {["Instagram", "Google", "Tiktok", "Friend"].map((source) => (
                <label key={source}>
                  <input
                    type="radio"
                    name="source"
                    value={source}
                    onChange={handleChange}
                    checked={formData.source === source}
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className={`waitlist-modal__submit ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Join the Waitlist"}
          </button>
        </form>
      </div>

      {/* Standardized Modal Component for Success/Error Feedback */}
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isError={isError}
        onProceed={handleModalProceed}
      />
    </div>
  );
};

export default WaitlistModal;

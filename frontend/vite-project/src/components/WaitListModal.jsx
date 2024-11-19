import React, { useState } from "react";
import "../styles/components/waitlist-modal.scss";
import { toast } from 'react-toastify';


const WaitlistModal = ({ isOpen, onClose, option }) => {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
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
    // Handle form submission

    const formBody = new URLSearchParams();
    formBody.append("firstName", formData.firstName);
    formBody.append("lastName", formData.lastName);
    formBody.append("email", formData.email);
    formBody.append("source", formData.source);
    formBody.append("option", formData.option);

    fetch("https://script.google.com/macros/s/AKfycbzS6fX2Rox_8Y1QmARXs39TUNWo0dB3_KXuPizwlp8ltfxqsEnoeGPNBSkUDew03Eqh/exec", {
      method: "POST",
      body: formBody,
    })

      .then((data) => {
        setFormData({ firstName: "", lastName: "", email: "", source: "" });
        toast.success('Success! Your response has been submitted.', 'success');
        setLoading(false);
        onClose();
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        toast.error('Oops! There was an error submitting your response.', 'error');
      });
  };

  if (!isOpen) return null;

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
            <label htmlFor="first-name"className="waitlist-modal__label">First name</label>
            <input 
            type="text" 
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="waitlist-modal__form-field-input" />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="last-name" className="waitlist-modal__label">Last name</label>
            <input 
            type="text" 
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required 
            className="waitlist-modal__form-field-input" />
          </div>
          <div className="waitlist-modal__field">
            <label htmlFor="email"className="waitlist-modal__label">Email address</label>
            <input 
            type="email" 
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange} 
            className="waitlist-modal__form-field-input" />
          </div>
          <div className="waitlist-modal__field">
            <p>How did you hear about us?</p>
            <div className="waitlist-modal__options">
              <label>
                <input 
                type="radio" 
                name="source" 
                value="Instagram"
                onChange={handleChange} 
                checked={formData.source === "Instagram"}
                />
                Instagram
              </label>
              <label>
                <input 
                type="radio" 
                name="source" 
                value="Google"
                onChange={handleChange}
                checked={formData.source === "Google"}
                />
                Google
              </label>
              <label>
                <input 
                type="radio" 
                name="source" 
                value="Tiktok"
                onChange={handleChange}
                checked={formData.source === "Tiktok"}
                />
                Tiktok
              </label>
              <label>
                <input 
                type="radio" 
                name="source" 
                value="Friend"
                onChange={handleChange}
                checked={formData.source === "Friend"} />
                Friend
              </label>
            </div>
          </div>
          <button
  type="submit"
  className={`waitlist-modal__submit ${loading ? 'loading' : ''}`}
  disabled={loading}
>
  {loading ? 'Submitting...' : 'Join the Waitlist'}
</button>
        </form>
      </div>
    </div>
  );
};

export default WaitlistModal;

import React, { useState, useEffect } from "react";
import "../../styles/main-app/pages/RegisterPage.scss";
import authImage from "../../assets/authImage.png";
import useApi from "../services/useApi";
import { toast } from "react-toastify";
import Modal from "../components/modal/Modal";
import { useNavigate } from "react-router-dom"; 

const CreateAccount = () => {
  const { data, error, loading, fetchData } = useApi("", "post");
  const navigate = useNavigate(); // Hook to navigate
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user && user.role) {
      if (user.role === "Caregiver") {
        navigate("/app/caregiver/dashboard", { replace: true });
      } else if (user.role === "Client") {
        navigate("/app/client/dashboard", { replace: true });
      } else if (user.role === "Admin") {
        navigate("/app/admin/dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true }); // fallback for unknown roles
      }
    }
  }, []);
  //please generate a unique username, add middlename ensure middle name is not null so that a random middlename is not added

  const [userType, setUserType] = useState(""); // New state for user type
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");

  const validate = () => {
    const newErrors = {};
    if (!formValues.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formValues.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formValues.email.trim() || !/\S+@\S+\.\S+/.test(formValues.email))
      newErrors.email = "Valid email address is required.";
    if (!formValues.phone.trim() || !/^\+?\d{10,15}$/.test(formValues.phone))
      newErrors.phone = "Valid phone number is required.";
    if (!formValues.password || formValues.password.length < 8) 
      newErrors.password = "Password must be at least 8 characters long.";
    if (formValues.password !== formValues.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!userType) newErrors.userType = "Please select a role."; // Validate user type
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (isSubmitted) {
      setErrors(validate());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phoneNo: formValues.phone,
      middleName: "testing",
      password: formValues.password,
      role: userType, // Include selected user type
    };

    try {
      const endpoint = userType === "Caregiver"
        ? "/CareGivers/AddCaregiverUser"
        : userType === "Client"
        ? "/Clients/AddClientUser"
        : "/Admins/AddAdminUser";
      console.log("Submitting registration with payload:", payload);
      await fetchData(payload, endpoint);

      // Show success modal
      setModalTitle("Registration Successful!");
      setModalDescription(
        `✅ Your account has been created successfully! 📧 We've sent a confirmation email to: ${formValues.email}. ⚠️ Important: Please check your email and click the confirmation link to activate your account. You won't be able to login until your email is confirmed.`
      );
      setButtonBgColor("#34A853");
      setButtonText("Go to Login");
      setIsModalOpen(true);
      
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error("Registration failed. Please try again.");

      // Show error modal
      setModalTitle("Error!");
      setModalDescription("Something went wrong during registration. Please try again.");
      setButtonBgColor("#FF0000");
      setButtonText("Okay");
      setIsModalOpen(true);
    }
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    // Add a toast reminder about email confirmation
    toast.info("Please check your email and click the confirmation link before logging in.", {
      autoClose: 6000, // Show for 6 seconds
    });
    
    // Add a small delay before navigation to ensure the toast is visible
    setTimeout(() => {
      navigate("/login"); // Navigate to login page
    }, 500); // 500ms delay to ensure smooth transition
  }  

  return (
    <div className="register-page">
      <div className="create-account-container">
        <div className="form-container">
          <h1>Create an account</h1>
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formValues.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && <p className="error-text">{errors.firstName}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formValues.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && <p className="error-text">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formValues.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formValues.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formValues.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="Caregiver"
                  checked={userType === "Caregiver"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="custom-radio"></span>
                Caregiver
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="Client"
                  checked={userType === "Client"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                 <span className="custom-radio"></span>
                Client
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="Admin"
                  checked={userType === "Admin"}
                  onChange={(e) => setUserType(e.target.value)}
                />
                 <span className="custom-radio"></span>
                Admin
              </label>
            </div>
            {errors.userType && <p className="error-text">{errors.userType}</p>}
            
            <div className="email-confirmation-notice">
              <p className="notice-text">
                📧 <strong>Email Confirmation Required:</strong> After registration, you'll receive a confirmation email. 
                You must click the link in that email before you can login to your account.
              </p>
            </div>
            
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          {error && <p className="error-text">Error: {error.message}</p>}
        </div>
        <div className="image-container">
          <img src={authImage} alt="Mental health awareness" />
        </div>
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        onProceed={handleProceed}
      />
    </div>
  );
};

export default CreateAccount;

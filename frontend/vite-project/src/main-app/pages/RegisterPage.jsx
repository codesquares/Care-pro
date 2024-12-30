import React, { useState } from "react";
import "../../styles/main-app/pages/RegisterPage.scss";
import authImage from "../../assets/authImage.png";
import useApi from "../services/useApi";
import { toast } from "react-toastify";


const CreateAccount = () => {
  const { data, error, loading, fetchData } = useApi("/CareGivers/AddCaregiverUser", "post");
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",

  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formValues.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formValues.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formValues.email.trim() || !/\S+@\S+\.\S+/.test(formValues.email))
      newErrors.email = "Valid email address is required.";
    if (!formValues.phone.trim() || !/^\+?\d{10,15}$/.test(formValues.phone))
      newErrors.phone = "Valid phone number is required.";
    if (
      !formValues.password ||
      formValues.password.length < 8 ||
      !/[A-Z]/.test(formValues.password) ||
      !/[a-z]/.test(formValues.password) ||
      !/\d/.test(formValues.password) ||
      !/[!@#$%^&*]/.test(formValues.password)
    ) {
      newErrors.password = "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
    if (formValues.password !== formValues.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (isSubmitted) {
      const fieldErrors = validate();
      setErrors(fieldErrors);
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
      PhoneNo: formValues.phone,
      middleName: "testing",
      password: formValues.password,
    };

    try {
      const response = await fetchData(payload);
      toast.success("Registration successful!");
      console.log("Response:", response);
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error("Registration failed. Please try again.");
    }
  };

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
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          {error && <p className="error-text">Error: {error.message}</p>}
          <div className="alternate-login">
            <p>or</p>
            <button className="btn google">Google</button>
            <button className="btn apple">Apple</button>
          </div>
          <p className="signin-text">
            Already have an account? <a href="/login">Sign in</a>
          </p>
          <p className="terms">
            By creating an account, you agree to the <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
        <div className="image-container">
          <img src={authImage} alt="Mental health awareness" />
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;

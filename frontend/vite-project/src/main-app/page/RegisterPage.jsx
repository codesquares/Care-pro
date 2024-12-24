// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import ReusableAuthForm from "../components/auth/ReusableAuthForm";
import AuthCarousel from "../../components/AuthCarousel";
// import "./RegisterPage.scss";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    console.log("Registration Data:", formData);
    // Add your registration logic here
  };

  const registrationFields = [
    {
      label: "First Name",
      type: "text",
      placeholder: "First Name",
      name: "firstName",
      value: formData.firstName,
      onChange: handleChange,
    },
    {
      label: "Last Name",
      type: "text",
      placeholder: "Last Name",
      name: "lastName",
      value: formData.lastName,
      onChange: handleChange,
    },
    {
      label: "Email address",
      type: "email",
      placeholder: "Email address",
      name: "email",
      value: formData.email,
      onChange: handleChange,
    },
    {
      label: "Password",
      type: "password",
      placeholder: "Password",
      name: "password",
      value: formData.password,
      onChange: handleChange,
    },
    {
      label: "Confirm Password",
      type: "password",
      placeholder: "Confirm Password",
      name: "confirmPassword",
      value: formData.confirmPassword,
      onChange: handleChange,
    },
  ];

  return (
    <div className="register-page">
      <ReusableAuthForm
        title="Create Account"
        formFields={registrationFields}
        buttonText="Register"
        redirectText="Already have an account?"
        redirectLink="/login"
        onSubmit={handleRegistrationSubmit}
        imageComponent={<AuthCarousel />}
      />
    </div>
  );
};

export default RegisterPage;

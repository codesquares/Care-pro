// src/pages/LoginPage.jsx
import React, { useState } from "react";
import ReusableAuthForm from "../components/auth/ReusableAuthForm";
import AuthCarousel from "../../components/AuthCarousel";
// import "./LoginPage.scss";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    // Add your login logic here
  };

  const loginFields = [
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
  ];

  return (
    <div className="login-page">
      <ReusableAuthForm
        title="Welcome Back"
        formFields={loginFields}
        buttonText="Sign in"
        redirectText="Don’t have an account?"
        redirectLink="/register"
        onSubmit={handleLoginSubmit}
        imageComponent={<AuthCarousel />}
      />
    </div>
  );
};

export default LoginPage;

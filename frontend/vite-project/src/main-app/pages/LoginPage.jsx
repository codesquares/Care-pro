import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/main-app/pages/RegisterPage.scss";
import authImage from "../../assets/authImage.png";
import { toast } from "react-toastify";
import config from "../config"; // Assuming this contains your BASE_URL

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user && user.role) {
      if (user.role === "Admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "Client") {
        navigate("/app/client/dashboard", { replace: true });
      } else {
        navigate("/app/caregiver/dashboard", { replace: true });
      }
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${config.BASE_URL}/Authentications/UserLogin`,
        { email, password }
      );

      console.log("Login response:", response);

      const { data } = response;
      toast.success("Login successful");
      console.log("Login successful:", data);
      localStorage.setItem("userDetails", JSON.stringify(data));
      localStorage.setItem("userId", data.id);
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);

      // Redirect based on role
      if (data.role === "Admin") {
        window.location.href = "/admin";
      } else if (data.role === "Client") {
        window.location.href = "/app/client/dashboard";
      } else {
        window.location.href = "/app/caregiver/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message || "Invalid email or password.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="create-account-container">
        <div className="form-container">
          <h1>Welcome Back!</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="alternate-login">
            <p>or</p>
            <button className="btn google">Google</button>
            <button className="btn apple">Apple</button>
          </div>
          <p className="signin-text">
            I don't have an account? <a href="/register">Sign up</a>
          </p>
          <p className="terms">
            By logging in, you agree to the <a href="#">Terms of Use</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>
        </div>
        <div className="image-container">
          <img src={authImage} alt="Mental health awareness" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

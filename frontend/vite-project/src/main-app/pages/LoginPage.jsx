import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import "../../styles/main-app/pages/LoginPage.scss";
import { toast } from "react-toastify";
import config from "../config";

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
        navigate("/app/admin/dashboard", { replace: true });
      } else if (user.role === "Client") {
        navigate("/app/client/dashboard", { replace: true });
      } else {
        navigate("/app/caregiver/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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

      const { data } = response;
      toast.success("Login successful");
      localStorage.setItem("userDetails", JSON.stringify(data));
      localStorage.setItem("userId", data.id);
      localStorage.setItem("authToken", data.token);

      if (data.role === "Admin") {
        navigate("/app/admin/dashboard");
      } else if (data.role === "Client") {
        navigate("/app/client/dashboard");
      } else {
        navigate("/app/caregiver/dashboard");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Invalid email or password.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Left section */}
      <div className="login-left">
        <div className="login-logo-section">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="login-image-section">
          <img
            src={loginImg}
            alt="Caregiver"
            className="main-image"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="login-right">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="e.g Johnsonsand@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-input">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>

        <div className="divider">or</div>

        <div className="social-login">
          <button className="google-btn">Google</button>
          <button className="apple-btn">Apple</button>
        </div>

        <p className="signup-text">
          Don’t have an account? <Link to="/register">Signup →</Link>
        </p>

        <p className="terms">
          By creating an account, you agree to the{" "}
          <Link to="#">Terms of use</Link> and{" "}
          <Link to="#">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

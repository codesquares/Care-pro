import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "../../styles/main-app/pages/RegisterFormPage.css";
import loginImg from "../../assets/loginImg.png";
import loginLogo from "../../assets/loginLogo.png";
import useApi from "../services/useApi";
import { toast } from "react-toastify";
import Modal from "../components/modal/Modal";
import allUserService from "../services/allUserService";
import GoogleAuthService from "../services/googleAuthService";
import AddressInput from "../components/AddressInput";
import { useAuth } from "../context/AuthContext";
import {
  createIdempotencyKey,
  submitSignupWithIdempotency,
  classifyIdempotencyError,
} from "../utils/idempotency";
import { getPasswordStrength } from "../utils/passwordStrength";

/**
 * RegisterFormPage - Registration form (step 2)
 * User fills in their details after selecting their role
 */
const RegisterFormPage = () => {
  const { data, error, loading, fetchData } = useApi("", "post");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Idempotency-Key refs for the in-flight signup submissions. Generated once
  // per user-initiated submit; reused for automatic retries; cleared after the
  // final outcome so the next explicit click gets a new key.
  const idempotencyKeyRef = useRef(null);
  const googleIdempotencyKeyRef = useRef(null);

  // Get role from navigation state
  const selectedRole = location.state?.role;

  // Get returnTo from URL parameters or navigation state to preserve through auth flow
  const urlParams = new URLSearchParams(location.search);
  const returnTo = urlParams.get('returnTo') || location.state?.returnTo;

  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    // phone: "",
    confirmPassword: "",
  });

  // Redirect if no role selected
  useEffect(() => {
    if (!selectedRole) {
      toast.error("Please select a role first");
      navigate(returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register", { replace: true });
    }
  }, [selectedRole, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user && user.role) {
      if (user.role === "Caregiver") {
        navigate("/app/caregiver/profile", { replace: true });
      } else if (user.role === "Client") {
        navigate("/app/client/dashboard", { replace: true });
      } else if (user.role === "Admin") {
        navigate("/app/admin/dashboard", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }
  }, [navigate]);

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [buttonText, setButtonText] = useState("Okay");
  const [buttonBgColor, setButtonBgColor] = useState("#34A853");
  const [isEmailVerification, setIsEmailVerification] = useState(false);
  const [isError, setIsError] = useState(false);

  // Google auth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [department, setDepartment] = useState(""); // Admin department
  const [signupAddress, setSignupAddress] = useState("");
  const [addressValidation, setAddressValidation] = useState(null);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const requiresAddress = selectedRole === "Caregiver" || selectedRole === "Client";

  const buildAddressPayload = () => {
    const rawAddress = signupAddress.trim();
    const components = addressValidation?.addressComponents || {};
    const formattedAddress = addressValidation?.formattedAddress?.trim() || rawAddress;
    const street = [components.streetNumber, components.streetName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
      rawAddress.split(",")[0]?.trim() ||
      rawAddress;

    const payload = {
      homeAddress: formattedAddress,
      fullAddress: formattedAddress,
      street,
      city: components.city || components.sublocality || components.neighborhood || "",
      state: components.state || "",
      country: components.country || "",
    };

    // Postal code can be inaccurate in some regions, so only include when confidently provided.
    if (components.postalCode) {
      payload.postalCode = components.postalCode;
    }

    return payload;
  };

  const validateSignupAddress = () => {
    if (!requiresAddress) return null;

    const rawAddress = signupAddress.trim();
    if (!rawAddress) {
      return "Address is required.";
    }

    if (!addressValidation) {
      return "Please provide a valid address.";
    }

    if (!addressValidation.isValid) {
      return addressValidation.errorMessage || "Please provide a valid address.";
    }

    if (selectedRole === "Caregiver") {
      if (addressValidation.isGoogleValidated) {
        const countryCode = (addressValidation.addressComponents?.countryCode || "").toUpperCase();
        const countryName = (addressValidation.addressComponents?.country || "").toLowerCase();
        if (countryCode && countryCode !== "NG") {
          return "Caregiver address must be in Nigeria.";
        }
        if (!countryCode && countryName && countryName !== "nigeria") {
          return "Caregiver address must be in Nigeria.";
        }
      } else {
        // Fallback mode: allow submission with warning, but still require explicit Nigeria mention.
        const fallbackAddress = (addressValidation.formattedAddress || rawAddress).toLowerCase();
        if (!fallbackAddress.includes("nigeria")) {
          return "Caregiver address must be in Nigeria. Include Nigeria in the address.";
        }
      }
    }

    return null;
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formValues.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formValues.email.trim() || !/\S+@\S+\.\S+/.test(formValues.email))
      newErrors.email = "Valid email address is required.";
    if (!formValues.password || formValues.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    } else {
      const strength = getPasswordStrength(formValues.password);
      if (strength.label === "Weak") {
        const need = strength.suggestions.length
          ? ` Add ${strength.suggestions.slice(0, 3).join(", ")}.`
          : "";
        newErrors.password = `Password is too weak.${need}`;
      }
    }
    if (formValues.password !== formValues.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (selectedRole === "Admin" && !department) newErrors.department = "Please select a department.";
    const addressError = validateSignupAddress();
    if (addressError) newErrors.address = addressError;
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (isSubmitted) {
      setErrors(validate());
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    // Check if email already exists in the system
    try {
      console.log("Checking if email exists:", formValues.email);
      const emailCheck = await allUserService.checkEmailExists(formValues.email);

      if (emailCheck.exists) {
        // Show modal asking user to login instead
        setModalTitle("Email Already Registered");
        setModalDescription(`An account with the email **${formValues.email}** already exists as a ${emailCheck.role}. 

Please log in to your existing account instead of creating a new one.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);
        return;
      }
    } catch (emailCheckError) {
      console.error("Error checking email existence:", emailCheckError);
      toast.error("Unable to verify email availability. Please try again.");
      return;
    }

    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      // phoneNo: formValues.phone,
      middleName: formValues.middleName?.trim() || null,
      password: formValues.password,
      role: selectedRole,
      marketingConsent,
      ...(requiresAddress ? buildAddressPayload() : {}),
      ...(selectedRole === "Admin" && department ? { department } : {})
    };

    if (requiresAddress && addressValidation?.isValid && !addressValidation?.isGoogleValidated) {
      toast.warning("Google validation was unavailable. Proceeding with your typed address.");
    }

    try {
      const endpoint = selectedRole === "Caregiver"
        ? "/CareGivers/AddCaregiverUser"
        : selectedRole === "Client"
          ? "/Clients/AddClientUser"
          : "/Admins";

      // Only the four signup endpoints support Idempotency-Key. /Admins does not.
      const useIdempotency =
        endpoint === "/CareGivers/AddCaregiverUser" ||
        endpoint === "/Clients/AddClientUser";

      if (useIdempotency) {
        await submitSignupWithIdempotency(idempotencyKeyRef, (key) =>
          fetchData(payload, endpoint, {
            headers: { "Idempotency-Key": key },
          })
        );
      } else {
        await fetchData(payload, endpoint);
      }

      idempotencyKeyRef.current = null;

      // Show success modal with email verification instructions
      setModalTitle("Registration Successful!");
      setModalDescription(`Your account has been created successfully! 

We've sent a verification email to **${formValues.email}**. Please check your inbox and click the verification link to activate your account.

You won't be able to log in until your email is verified.`);
      setButtonBgColor("#00B4A6");
      setButtonText("Go to Login");
      setIsEmailVerification(true);
      setIsError(false);
      setIsModalOpen(true);

    } catch (err) {
      console.error("Registration failed:", err);
      // Reset key so the user's next explicit click gets a fresh one. The
      // classifyIdempotencyError call also flags client bugs for logging.
      classifyIdempotencyError(err);
      idempotencyKeyRef.current = null;
      toast.error("Registration failed. Please try again.");

      // Show error modal
      setModalTitle("Registration Failed");
      setModalDescription("Something went wrong during registration. Please check your information and try again.");
      setButtonBgColor("#FF4B4B");
      setButtonText("Try Again");
      setIsEmailVerification(false);
      setIsError(true);
      setIsModalOpen(true);
    }
  };

  const handleProceed = () => {
    setIsModalOpen(false);
    if (buttonText === "Go to Login") {
      navigate(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login");
    }
  };

  const handleResendEmail = () => {
    setIsModalOpen(false);
    navigate("/resend-confirmation");
  };

  // Google Sign Up success handler
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Google sign up failed");
      return;
    }

    setGoogleLoading(true);
    const idToken = credentialResponse.credential;

    try {
      // Try to sign in first (check if user already exists)
      const signInResult = await GoogleAuthService.googleSignIn(idToken);

      // Backend returns 'token' not 'accessToken'
      const hasToken = !!(signInResult.token || signInResult.accessToken);
      const accessToken = signInResult.token || signInResult.accessToken;

      if (signInResult.success && !signInResult.requiresLinking && hasToken) {
        GoogleAuthService.storeAuthData(signInResult);

        // Update AuthContext
        // Backend returns 'id' not 'userId'
        const userData = {
          id: signInResult.id || signInResult.userId,
          email: signInResult.email,
          firstName: signInResult.firstName,
          lastName: signInResult.lastName,
          role: signInResult.role,
          profilePicture: signInResult.profilePicture,
          authProvider: signInResult.authProvider || 'Google',
        };
        login(userData, accessToken, signInResult.refreshToken, signInResult.isFirstLogin);

        toast.success("Welcome back! You already have an account.");
        setTimeout(() => {
          const dashboardPath = GoogleAuthService.getDashboardPath(signInResult.role);
          window.location.href = dashboardPath;
        }, 1000);

      } else if (signInResult.requiresLinking) {
        // User has a local account - prompt to sign in with password
        const conflictEmail = signInResult.conflict?.email || "this email";
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with ${conflictEmail} already exists. Please sign in with your password first, then you can link your Google account from settings.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);

      } else if (signInResult.needsSignUp) {
        const addressError = validateSignupAddress();
        if (addressError) {
          setIsSubmitted(true);
          setErrors((prev) => ({ ...prev, address: addressError }));
          toast.error(addressError);
          return;
        }

        const googleSignUpPayload = {
          ...(requiresAddress ? buildAddressPayload() : {}),
          marketingConsent,
        };
        if (requiresAddress && addressValidation?.isValid && !addressValidation?.isGoogleValidated) {
          toast.warning("Google validation was unavailable. Proceeding with your typed address.");
        }

        // New user - sign them up with the selected role.
        // Use an Idempotency-Key per user-initiated submission; reuse on
        // retryable 409 "still being processed", regenerate on 409 "expired".
        if (!googleIdempotencyKeyRef.current) {
          googleIdempotencyKeyRef.current = createIdempotencyKey();
        }

        let signUpResult;
        let stillTries = 0;
        let expiredRetried = false;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          signUpResult = await GoogleAuthService.googleSignUp(
            idToken,
            selectedRole,
            googleIdempotencyKeyRef.current,
            googleSignUpPayload
          );
          if (signUpResult.success) break;
          const kind = classifyIdempotencyError({
            status: signUpResult.status,
            message: signUpResult.message || signUpResult.error,
          });
          if (kind === "still-processing" && stillTries < 3) {
            stillTries += 1;
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          if (kind === "expired" && !expiredRetried) {
            expiredRetried = true;
            googleIdempotencyKeyRef.current = createIdempotencyKey();
            continue;
          }
          break;
        }

        // Clear so the next explicit user click mints a fresh key.
        googleIdempotencyKeyRef.current = null;

        // Backend returns 'token' not 'accessToken'
        const signUpToken = signUpResult.token || signUpResult.accessToken;

        if (signUpResult.success) {
          GoogleAuthService.storeAuthData(signUpResult);

          // Update AuthContext
          // Backend returns 'id' not 'userId'
          const userData = {
            id: signUpResult.id || signUpResult.userId,
            email: signUpResult.email,
            firstName: signUpResult.firstName,
            lastName: signUpResult.lastName,
            role: signUpResult.role || selectedRole,
            profilePicture: signUpResult.profilePicture,
            authProvider: signUpResult.authProvider || 'Google',
          };
          login(userData, signUpToken, signUpResult.refreshToken, signUpResult.isFirstLogin);

          toast.success("Account created successfully!");

          setModalTitle("Welcome to CarePro!");
          setModalDescription(`Your ${selectedRole.toLowerCase()} account has been created successfully with Google. You'll be redirected to your dashboard.`);
          setButtonBgColor("#00B4A6");
          setButtonText("Continue");
          setIsEmailVerification(false);
          setIsError(false);
          setIsModalOpen(true);

          setTimeout(() => {
            const dashboardPath = GoogleAuthService.getDashboardPath(selectedRole);
            window.location.href = dashboardPath;
          }, 2000);
        } else {
          toast.error(signUpResult.error || "Google sign up failed");
        }

      } else if (signInResult.canLinkAccounts) {
        setModalTitle("Account Already Exists");
        setModalDescription(`An account with this email already exists. Please sign in with your password, then you can link your Google account from settings.`);
        setButtonBgColor("#FF6B6B");
        setButtonText("Go to Login");
        setIsEmailVerification(false);
        setIsError(true);
        setIsModalOpen(true);

      } else {
        toast.error(signInResult.error || "Google sign up failed");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign up failed. Please try again.");
  };

  // Dynamic heading based on role
  const headingText = selectedRole === "Caregiver"
    ? "Create account to find work"
    : "Create account to find caregivers";

  // Don't render if no role
  if (!selectedRole) {
    return null;
  }

  return (
    <div className="regform-wrapper">
      {/* Left Panel - same as role selection page */}
      <div className="regform-left" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <div className="regform-logo">
          <img src={loginLogo} alt="Carepro Logo" />
        </div>
        <div className="regform-hero">
          <img src={loginImg} alt="Caregiver" className="hero-image" />
          {/* Floating UI cards */}
          <div className="floating-card floating-browse">
            <span className="floating-tag">Browse service categories</span>
          </div>
          <div className="floating-card floating-category">
            <div className="category-card-inner">
              <div className="category-emoji">😊</div>
              <div>
                <strong>Adult & Elderly Care</strong>
                <p>Dignified, independence-focused assistance to keep seniors active, comfortable, and cared for.</p>
                <span className="category-price">Starting at ₦10,000 /visit</span>
              </div>
            </div>
          </div>
          <div className="floating-card floating-orders">
            <span className="orders-icon">🛍️</span>
            <span>Manage active Orders</span>
          </div>
          <div className="floating-card floating-connect">
            <span>Connect with qualified Caregivers</span>
          </div>
          <div className="floating-card floating-profile">
            <div className="profile-row">
              <div className="profile-avatar">FA</div>
              <div className="profile-info">
                <strong>Funke Adeyemi</strong>
                <span className="verified-badge">Verified ✓</span>
                <span className="rating">⭐ 4.5</span>
              </div>
            </div>
            <span className="profile-location">📍 Ikoy, Lagos, Nigeria</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="regform-right">
        <div className="regform-content">
          {/* Go back link */}
          <button
            className="regform-back"
            onClick={() => navigate(returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register")}
          >
            ← go back
          </button>

          <h2>{headingText}</h2>

          <p className="regform-signin-text">
            Already have an account?{" "}
            <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}>
              Log In →
            </Link>
          </p>

          <form className="regform-form" onSubmit={handleSubmit} noValidate>
            {/* First & Last name */}
            <div className="regform-row">
              <div className="regform-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formValues.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && <p className="regform-error">{errors.firstName}</p>}
              </div>
              <div className="regform-field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formValues.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && <p className="regform-error">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="regform-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="e.g Johnsonand@gmail.com"
                value={formValues.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="regform-error">{errors.email}</p>}
            </div>

            {/* Address */}
            {requiresAddress && (
              <div className="regform-field">
                <label htmlFor="signupAddress">Home Address</label>
                <AddressInput
                  value={signupAddress}
                  onChange={(value) => {
                    setSignupAddress(value);
                    setAddressValidation(null);
                    if (isSubmitted) {
                      setErrors(validate());
                    }
                  }}
                  onValidation={(result) => {
                    setAddressValidation(result);
                    if (isSubmitted) {
                      setErrors(validate());
                    }
                  }}
                  placeholder={
                    selectedRole === "Caregiver"
                      ? "Enter your full address in Nigeria"
                      : "Enter your full home address"
                  }
                  autoValidate={true}
                  showValidationIcon={true}
                  country={selectedRole === "Caregiver" ? "ng" : "global"}
                  required={true}
                  className="regform-address-input"
                />
                {addressValidation?.isValid && !addressValidation?.isGoogleValidated && (
                  <p style={{ color: "#8a6d3b", fontSize: "13px", marginTop: "6px" }}>
                    Google validation unavailable. We will submit your typed address.
                  </p>
                )}
                {errors.address && <p className="regform-error">{errors.address}</p>}
              </div>
            )}

            {/* Password */}
            <div className="regform-field">
              <label htmlFor="password">Password</label>
              <div className="regform-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formValues.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="regform-eye-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.45703 12C3.73128 7.94288 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              {formValues.password && (() => {
                const s = getPasswordStrength(formValues.password);
                return (
                  <div className="regform-password-strength" aria-live="polite">
                    <div className="regform-strength-bar">
                      <div
                        className="regform-strength-bar-fill"
                        style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <div className="regform-strength-meta">
                      <span className="regform-strength-label" style={{ color: s.color }}>
                        {s.label}
                      </span>
                      {s.suggestions.length > 0 && (
                        <span className="regform-strength-hint">
                          Add {s.suggestions.slice(0, 3).join(", ")}.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              {errors.password && <p className="regform-error">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="regform-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="regform-password-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="regform-eye-btn"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.45703 12C3.73128 7.94288 7.52159 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C20.2672 16.0571 16.4769 19 11.9992 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.9992 15C13.6561 15 14.9992 13.6569 14.9992 12C14.9992 10.3431 13.6561 9 11.9992 9C10.3424 9 8.99924 10.3431 8.99924 12C8.99924 13.6569 10.3424 15 11.9992 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="regform-error">{errors.confirmPassword}</p>}
            </div>

            {/* Department (Admin only) */}
            {selectedRole === "Admin" && (
              <div className="regform-field">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">-- Select Department --</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="ComplianceAndLegal">Compliance & Legal</option>
                  <option value="CareLeads">Care Leads</option>
                  <option value="MarketingAndSales">Marketing & Sales</option>
                </select>
                {errors.department && <p className="regform-error">{errors.department}</p>}
              </div>
            )}

            {/* Marketing consent */}
            <div className="regform-consent">
              <label className="regform-consent-label" htmlFor="marketingConsent">
                <input
                  id="marketingConsent"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                />
                <span>
                  I'd like to receive occasional updates, tips, and offers from CarePro.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" className="regform-submit" disabled={loading || googleLoading}>
              {loading ? "Creating Account..." : "Create My account"}
            </button>
          </form>

          {/* Divider */}
          <div className="regform-divider">
            <span>or</span>
          </div>

          {/* Social buttons */}
          <div className="regform-social-buttons">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signup_with"
              shape="rectangular"
              width="100%"
              ux_mode="popup"
            />

          </div>

          {/* Terms */}
          <p className="regform-terms">
            By creating an account, you agree to the{" "}
            <Link to="/terms-and-conditions">Terms of use</Link> and{" "}
            <Link to="/privacy-policy">Privacy Policy</Link>
          </p>

          {error && <p className="regform-error">Error: {error.message}</p>}
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
        isEmailVerification={isEmailVerification}
        isError={isError}
        secondaryButtonText={isEmailVerification ? "Didn't receive email?" : undefined}
        onSecondaryAction={isEmailVerification ? handleResendEmail : undefined}
        onProceed={handleProceed}
      />
    </div>
  );
};

export default RegisterFormPage;

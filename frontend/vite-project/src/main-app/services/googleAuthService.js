/**
 * Google Authentication Service
 * Handles all Google OAuth related API calls
 */
import config from "../config";

const GOOGLE_CLIENT_ID = "6881271599-i0v6f3onlaoekapmud8p4agio4891q4j.apps.googleusercontent.com";

const GoogleAuthService = {
  /**
   * Get the Google Client ID
   */
  getClientId() {
    return GOOGLE_CLIENT_ID;
  },

  /**
   * Sign in with Google using email (check if user exists)
   * @param {string} email - User's email from Google
   * @returns {Promise<Object>} - Auth response
   */
  async googleSignInWithEmail(email) {
    try {
      const response = await fetch(`${config.BASE_URL}/Authentications/CheckEmailExists?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.exists && data.authProvider === "Google") {
        // User exists with Google - they can sign in
        // But we need the actual sign in to get tokens, which requires idToken
        // For now, return needsSignUp false to indicate they should use normal login
        return {
          success: false,
          canLinkAccounts: false,
          needsSignUp: false,
          error: "Please use the Google Sign In on the login page to access your account.",
        };
      } else if (data.exists && data.authProvider === "Local") {
        // User exists with local account
        return {
          success: false,
          canLinkAccounts: true,
          email: email,
          message: "An account with this email exists. Please sign in with your password.",
        };
      } else {
        // User doesn't exist - needs to sign up
        return {
          success: false,
          needsSignUp: true,
          message: "No account found",
        };
      }
    } catch (error) {
      console.error("Google sign in check error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign up with Google using user info from Google API
   * @param {Object} userInfo - User info from Google (email, given_name, family_name, picture)
   * @param {string} role - "Client" or "Caregiver"
   * @returns {Promise<Object>} - Auth response
   */
  async googleSignUpWithUserInfo(userInfo, role) {
    const endpoint = role === "Client" 
      ? `${config.BASE_URL}/Clients/GoogleSignUp`
      : `${config.BASE_URL}/CareGivers/GoogleSignUp`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userInfo.email,
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
          lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
          profilePicture: userInfo.picture,
          authProvider: "Google",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign up failed",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign in with Google using access token (for useGoogleLogin hook)
   * @param {string} accessToken - Google access token
   * @param {string} email - User's email from Google
   * @returns {Promise<Object>} - Auth response
   */
  async googleSignInWithAccessToken(accessToken, email) {
    try {
      const response = await fetch(`${config.BASE_URL}/Authentications/GoogleSignIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, email }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else if (response.status === 404) {
        return {
          success: false,
          needsSignUp: true,
          message: data.message || "No account found with this Google account",
        };
      } else if (response.status === 409 && data.canLinkAccounts) {
        return {
          success: false,
          canLinkAccounts: true,
          email: data.email,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign in failed",
        };
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign up with Google using access token (for useGoogleLogin hook)
   * @param {string} accessToken - Google access token
   * @param {Object} userInfo - User info from Google
   * @param {string} role - "Client" or "Caregiver"
   * @returns {Promise<Object>} - Auth response
   */
  async googleSignUpWithAccessToken(accessToken, userInfo, role) {
    const endpoint = role === "Client" 
      ? `${config.BASE_URL}/Clients/GoogleSignUp`
      : `${config.BASE_URL}/CareGivers/GoogleSignUp`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accessToken,
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          profilePicture: userInfo.picture,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign up failed",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign in with Google (existing user) - ID token flow
   * @param {string} idToken - Google ID token from OAuth response
   * @returns {Promise<Object>} - Auth response with tokens and user info
   */
  async googleSignIn(idToken) {
    try {
      const response = await fetch(`${config.BASE_URL}/Authentications/GoogleSignIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else if (response.status === 404) {
        // User not found - needs to sign up
        return {
          success: false,
          needsSignUp: true,
          message: data.message || "No account found with this Google account",
        };
      } else if (response.status === 409 && data.canLinkAccounts) {
        // Email exists with local account - can link
        return {
          success: false,
          canLinkAccounts: true,
          email: data.email,
          existingAuthProvider: data.existingAuthProvider,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign in failed",
        };
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign up as Client with Google
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object>} - Auth response with tokens and user info
   */
  async googleSignUpClient(idToken) {
    try {
      const response = await fetch(`${config.BASE_URL}/Clients/GoogleSignUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign up failed",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Google client sign up error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign up as Caregiver with Google
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object>} - Auth response with tokens and user info
   */
  async googleSignUpCaregiver(idToken) {
    try {
      const response = await fetch(`${config.BASE_URL}/CareGivers/GoogleSignUp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          ...data,
        };
      } else {
        return {
          success: false,
          error: data.message || "Google sign up failed",
          status: response.status,
        };
      }
    } catch (error) {
      console.error("Google caregiver sign up error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign up with Google based on role
   * @param {string} idToken - Google ID token
   * @param {string} role - "Client" or "Caregiver"
   * @returns {Promise<Object>} - Auth response
   */
  async googleSignUp(idToken, role) {
    if (role === "Client") {
      return this.googleSignUpClient(idToken);
    } else if (role === "Caregiver") {
      return this.googleSignUpCaregiver(idToken);
    } else {
      return {
        success: false,
        error: "Invalid role specified",
      };
    }
  },

  /**
   * Link Google account to existing local account
   * @param {string} idToken - Google ID token
   * @param {string} password - User's local account password
   * @param {string} accessToken - JWT access token
   * @returns {Promise<Object>} - Link result
   */
  async linkGoogleAccount(idToken, password, accessToken) {
    try {
      const response = await fetch(`${config.BASE_URL}/Authentications/LinkGoogleAccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ idToken, password }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Google account linked successfully",
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to link Google account",
        };
      }
    } catch (error) {
      console.error("Link Google account error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Check if email exists in the system
   * @param {string} email - Email to check
   * @returns {Promise<Object>} - Check result
   */
  async checkEmailExists(email) {
    try {
      const response = await fetch(
        `${config.BASE_URL}/Authentications/CheckEmailExists?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Check email error:", error);
      return {
        exists: false,
        error: "Failed to check email",
      };
    }
  },

  /**
   * Store auth data after successful Google auth
   * @param {Object} authData - Auth response data
   */
  storeAuthData(authData) {
    console.log("🔍 storeAuthData - Input:", authData);
    
    // Handle different field name variations from backend
    // Backend returns 'token', frontend expects 'accessToken'
    const accessToken = authData.token || authData.accessToken || authData.AccessToken || authData.Token;
    const refreshTokenValue = authData.refreshToken || authData.RefreshToken;
    // Backend returns 'id', not 'userId'
    const userId = authData.id || authData.userId || authData.UserId || authData.Id;
    const email = authData.email || authData.Email;
    const firstName = authData.firstName || authData.FirstName;
    const lastName = authData.lastName || authData.LastName;
    const role = authData.role || authData.Role || authData.userRole || authData.UserRole;
    const profilePicture = authData.profilePicture || authData.ProfilePicture;
    
    console.log("🔍 Parsed values - token:", !!accessToken, "role:", role, "id:", userId);
    
    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
      console.log("🔍 Stored authToken:", accessToken.substring(0, 20) + "...");
    } else {
      console.error("🔍 ERROR: No access token found in authData!");
    }
    if (refreshTokenValue) {
      localStorage.setItem("refreshToken", refreshTokenValue);
    }
    
    const userDetails = {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role,
      profilePicture: profilePicture,
    };
    
    console.log("🔍 storeAuthData - userDetails to store:", userDetails);
    localStorage.setItem("userDetails", JSON.stringify(userDetails));
  },

  /**
   * Get redirect path based on user role
   * @param {string} role - User role
   * @returns {string} - Dashboard path
   */
  getDashboardPath(role) {
    switch (role) {
      case "Admin":
        return "/app/admin/dashboard";
      case "Client":
        return "/app/client/dashboard";
      case "Caregiver":
        return "/app/caregiver/profile";
      default:
        return "/app";
    }
  },
};

export default GoogleAuthService;

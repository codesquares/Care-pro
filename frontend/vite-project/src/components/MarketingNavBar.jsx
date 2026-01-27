import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../main-app/context/AuthContext";
import logo from "../assets/careproLogo.svg";
import "./MarketingNavBar.css";

const MarketingNavBar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, handleLogout: authLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle logout
  const handleLogout = () => {
    const result = authLogout();
    if (result.shouldNavigate) {
      navigate(result.path);
    }
    setMobileMenuOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavClick = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  // Determine navigation based on user state
  const renderNavLinks = () => {
    if (isAuthenticated && user) {
      // Logged in state
      const isCaregiver = user.role?.toLowerCase() === "caregiver";
      const dashboardPath = isCaregiver
        ? "/app/caregiver/dashboard"
        : "/app/client/dashboard";

      return (
        <>
          <Link to="/marketplace" onClick={closeMobileMenu}>
            Browse Services
          </Link>
          <Link to={dashboardPath} onClick={closeMobileMenu}>
            Dashboard
          </Link>
          {!isCaregiver && (
            <Link to="/become-caregiver" onClick={closeMobileMenu}>
              Become a Caregiver
            </Link>
          )}
          <button className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </>
      );
    } else {
      // Logged out state - promotional nav
      return (
        <>
          <Link to="/marketplace" onClick={closeMobileMenu}>
            Browse Services
          </Link>
          <Link to="/become-caregiver" onClick={closeMobileMenu}>
            Become a Caregiver
          </Link>
          <Link to="/login" onClick={closeMobileMenu}>
            Sign In
          </Link>
          <Link
            to="/register"
            className="nav-join-btn"
            onClick={closeMobileMenu}
          >
            Join
          </Link>
        </>
      );
    }
  };

  return (
    <header className={`marketing-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <img src={logo} alt="CarePro" />
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation Links */}
        <nav className={`navbar-links ${mobileMenuOpen ? "active" : ""}`}>
          {renderNavLinks()}
        </nav>
      </div>
    </header>
  );
};

export default MarketingNavBar;

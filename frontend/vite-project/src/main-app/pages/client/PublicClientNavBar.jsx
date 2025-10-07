import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaEnvelope, FaCog, FaSearch } from "react-icons/fa";
import logo from "../../../assets/careproLogo.svg";
import { useAuth } from "../../context/AuthContext";
import "./ClientNavBarCustom.css";

const PublicClientNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const debounceRef = useRef(null);
  const { user, isAuthenticated, handleLogout: authLogout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Handle logout
  const handleLogout = () => {
    const result = authLogout();
    if (result.shouldNavigate) {
      navigate(result.path);
    }
  };

  // Initialize search query from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('q');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
  }, [location.search]);

  // Listen for clear search events from dashboard
  useEffect(() => {
    const handleClearSearch = () => {
      setSearchQuery('');
      setIsTyping(false);
    };

    window.addEventListener('clearSearch', handleClearSearch);
    
    return () => {
      window.removeEventListener('clearSearch', handleClearSearch);
    };
  }, []);

  // Close mobile menu on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavClick = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsTyping(false); // Reset typing state on form submission
    if (searchQuery.trim()) {
      // Navigate to root with search query parameter
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      // Dispatch search event with completed search
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: searchQuery.trim(), isSearching: false } 
      }));
    } else {
      // If empty search, go to root without query
      navigate('/');
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: '', isSearching: false } 
      }));
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Set typing state to true when user starts typing
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      // Immediately notify that searching has started
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: value.trim(), isSearching: true } 
      }));
    }
    
    // If search is cleared, immediately notify and reset typing state
    if (!value.trim()) {
      setIsTyping(false);
      window.dispatchEvent(new CustomEvent('searchChanged', { 
        detail: { searchQuery: '', isSearching: false } 
      }));
      if (location.pathname === '/') {
        window.history.pushState({}, '', '/');
      }
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set up debounced navigation for real-time search
    debounceRef.current = setTimeout(() => {
      if (location.pathname === '/') {
        // Only update URL if we're on root
        if (value.trim()) {
          const newUrl = `/?q=${encodeURIComponent(value.trim())}`;
          window.history.pushState({}, '', newUrl);
          // Trigger a custom event to notify dashboard of URL change
          window.dispatchEvent(new CustomEvent('searchChanged', { 
            detail: { searchQuery: value.trim(), isSearching: false } 
          }));
        }
      }
      // Reset typing state after debounce period
      setIsTyping(false);
    }, 300); // 300ms debounce
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <nav className="client-navigation-bar">
      {/* Mobile Navigation */}
      <div className="client-mobile-nav">
        <div className="client-logo" onClick={() => navigate('/')}>
          <img src={logo} alt="CarePro Logo" />
        </div>
        <button 
          className="client-hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile: Search bar */}
      <div className="client-mobile-user-search">
        <div className="client-mobile-search-container">
          <form onSubmit={handleSearch} className={`client-mobile-search-form ${searchQuery ? 'has-value' : ''}`}>
            <input
              type="text"
              placeholder="What service are you looking for today?"
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="client-mobile-search-input"
            />
            <button type="submit" className="client-mobile-search-button" aria-label="Search">
              <FaSearch size={16} />
            </button>
          </form>
        </div>

        {/* Authentication buttons for mobile */}
        {!isAuthenticated && (
          <div className="mobile-auth-buttons">
            <button 
              className="mobile-signin-btn"
              onClick={() => handleMobileNavClick('/login')}
            >
              Sign In
            </button>
            <button 
              className="mobile-signup-btn"
              onClick={() => handleMobileNavClick('/register')}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="client-mobile-menu-overlay" onClick={closeMobileMenu}>
          <div className="client-mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            {isAuthenticated ? (
              <>
                {/* Role-based mobile navigation */}
                {user?.role === 'Client' && (
                  <>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/client/dashboard')}>
                      <FaHome className="mobile-menu-icon" />
                      <span>My Dashboard</span>
                    </div>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/client/message')}>
                      <FaEnvelope className="mobile-menu-icon" />
                      <span>Messages</span>
                    </div>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/client/settings')}>
                      <FaCog className="mobile-menu-icon" />
                      <span>Settings</span>
                    </div>
                  </>
                )}
                
                {user?.role === 'Caregiver' && (
                  <>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/caregiver/dashboard')}>
                      <FaHome className="mobile-menu-icon" />
                      <span>My Dashboard</span>
                    </div>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/caregiver/message')}>
                      <FaEnvelope className="mobile-menu-icon" />
                      <span>Messages</span>
                    </div>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/caregiver/settings')}>
                      <FaCog className="mobile-menu-icon" />
                      <span>Settings</span>
                    </div>
                  </>
                )}
                
                {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                  <>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/admin/dashboard')}>
                      <FaHome className="mobile-menu-icon" />
                      <span>Admin Dashboard</span>
                    </div>
                    <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/app/admin/settings')}>
                      <FaCog className="mobile-menu-icon" />
                      <span>Settings</span>
                    </div>
                  </>
                )}
                
                {/* Common logout option */}
                <div className="mobile-menu-item mobile-menu-logout" onClick={() => { handleLogout(); closeMobileMenu(); }}>
                  <span>Sign Out</span>
                </div>
              </>
            ) : (
              <>
                <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/login')}>
                  <span>Sign In</span>
                </div>
                <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/register')}>
                  <span>Sign Up</span>
                </div>
                <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/about-us')}>
                  <span>About Us</span>
                </div>
                <div className="mobile-menu-item" onClick={() => handleMobileNavClick('/become-caregiver')}>
                  <span>Become a Caregiver</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="client-desktop-nav">
        <div className="client-logo" onClick={() => navigate('/')}>
          <img src={logo} alt="CarePro Logo" />
        </div>

        {/* Search Bar */}
        <div className="client-search-container">
          <form onSubmit={handleSearch} className="client-search-form">
            <input
              type="text"
              placeholder="What service are you looking for today?"
              value={searchQuery}
              onChange={handleSearchInputChange}
              className={`client-search-input ${searchQuery ? 'has-value' : ''}`}
            />
            <button type="submit" className="client-search-button" aria-label="Search">
              <FaSearch size={20} />
            </button>
          </form>
        </div>

        {/* Right side navigation */}
        <div className="client-nav-right">
          {isAuthenticated ? (
            <>
              {/* Role-based authenticated user navigation */}
              {user?.role === 'Client' && (
                <>
                  <div className="client-nav-item" onClick={() => navigate('/app/client/dashboard')}>
                    <FaHome className="client-nav-icon" />
                    <span>Dashboard</span>
                  </div>
                  <div className="client-nav-item" onClick={() => navigate('/app/client/message')}>
                    <FaEnvelope className="client-nav-icon" />
                    <span>Messages</span>
                  </div>
                  <div className="client-nav-item" onClick={() => navigate('/app/client/settings')}>
                    <FaCog className="client-nav-icon" />
                    <span>Settings</span>
                  </div>
                </>
              )}
              
              {user?.role === 'Caregiver' && (
                <>
                  <div className="client-nav-item" onClick={() => navigate('/app/caregiver/dashboard')}>
                    <FaHome className="client-nav-icon" />
                    <span>Dashboard</span>
                  </div>
                  <div className="client-nav-item" onClick={() => navigate('/app/caregiver/message')}>
                    <FaEnvelope className="client-nav-icon" />
                    <span>Messages</span>
                  </div>
                  <div className="client-nav-item" onClick={() => navigate('/app/caregiver/settings')}>
                    <FaCog className="client-nav-icon" />
                    <span>Settings</span>
                  </div>
                </>
              )}
              
              {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                <>
                  <div className="client-nav-item" onClick={() => navigate('/app/admin/dashboard')}>
                    <FaHome className="client-nav-icon" />
                    <span>Admin Dashboard</span>
                  </div>
                  <div className="client-nav-item" onClick={() => navigate('/app/admin/settings')}>
                    <FaCog className="client-nav-icon" />
                    <span>Settings</span>
                  </div>
                </>
              )}
              
              {/* Common authenticated navigation - Logout */}
              <div className="auth-buttons">
                <button 
                  className="signout-btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Public navigation */}
              <div className="public-nav-links">
                <button 
                  className="nav-link-btn"
                  onClick={() => navigate('/about-us')}
                >
                  About
                </button>
                <button 
                  className="nav-link-btn"
                  onClick={() => navigate('/become-caregiver')}
                >
                  Become a Caregiver
                </button>
              </div>
              <div className="auth-buttons">
                <button 
                  className="signin-btn"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
                <button 
                  className="signup-btn"
                  onClick={() => navigate('/register')}
                >
                  Sign Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default PublicClientNavBar;

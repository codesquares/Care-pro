
import { useState } from 'react';
import "../styles/components/footer.css";
import logo from '../assets/careproLogoWhite.svg';
import { Link } from 'react-router-dom';

const footerSections = [
  {
    title: "Service Categories",
    links: [
      { to: "/services/home-care", label: "Home Care" },
      { to: "/services/adult-elderly-care", label: "Adult & Elderly Care" },
      { to: "/services/child-care", label: "Child Care" },
      { to: "/services/pet-care", label: "Pet Care" },
      { to: "/services/home-medical-support", label: "Home Medical Support" },
      { to: "/services/post-surgery-care", label: "Post Surgery Care" },
      { to: "/services/mobility-support", label: "Mobility Support" },
      { to: "/services/special-needs-care", label: "Special Needs Care" },
      { to: "/services/therapy-wellness", label: "Therapy & Wellness" },
      { to: "/services/palliative", label: "Palliative" },
    ],
  },
  {
    title: "For Clients",
    links: [
      { to: "/post-requests", label: "Post Requests" },
      { to: "/hire-care-professionals", label: "Hire Care Professionals" },
      { to: "/how-carepro-works", label: "How Carepro works" },
      { to: "/plans", label: "Pricing" },
      { to: "/carepro-guides", label: "Carepro Guides" },
    ],
  },
  {
    title: "For Care Professionals",
    links: [
      { to: "/become-care-professional", label: "Become a Care Professional" },
      { to: "/how-it-works", label: "How it Works" },
      { to: "/view-clients-requests", label: "View Clients' Requests" },
      { to: "/carepro-guides", label: "Carepro Guides" },
    ],
  },
  {
    title: "Product",
    links: [
      { to: "/about", label: "About Carepro" },
      { to: "/team", label: "Team" },
      { to: "/trust-safety", label: "Trust & Safety" },
      { to: "/partnerships", label: "Partnerships" },
      { to: "/invest", label: "Invest" },
      { to: "/press-news", label: "Press & News" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy-policy", label: "Privacy policy" },
      { to: "/terms-and-conditions", label: "Terms & Conditions" },
    ],
  },
];

const Footer = () => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <footer className="footer">
      {/* Top links section */}
      <div className="footer-links-section">
        {footerSections.map((section, index) => (
          <div
            className={`footer-column ${openSections[index] ? "open" : ""}`}
            key={index}
          >
            <h4
              className="footer-column-header"
              onClick={() => toggleSection(index)}
            >
              <span>{section.title}</span>
              <svg
                className="footer-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </h4>
            <ul className="footer-links-list">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-logo">
            <img src={logo} alt="Carepro Logo" />
          </div>

          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.28 8.28 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.19z" />
              </svg>
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          <div className="footer-language">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span>English</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

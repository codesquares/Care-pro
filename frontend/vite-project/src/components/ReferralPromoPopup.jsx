import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/components/referral-promo-popup.css";

const POPUP_DELAY_MS = 2 * 60 * 1000; // 2 minutes
const SESSION_KEY = "referralPromoShown";

const ReferralPromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return undefined;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || location.pathname === "/become-a-referrer") return null;

  const handleClose = () => setIsOpen(false);

  return (
    <div className="referral-promo-popup__overlay" onClick={handleClose}>
      <div className="referral-promo-popup" onClick={(e) => e.stopPropagation()}>
        <button
          className="referral-promo-popup__close"
          onClick={handleClose}
          aria-label="Close"
        >
          &times;
        </button>
        <span className="referral-promo-popup__badge">₦5,000</span>
        <h3 className="referral-promo-popup__title">Refer a friend, earn ₦5,000</h3>
        <p className="referral-promo-popup__description">
          Become a CarePro referrer and earn ₦5,000 for every unique client you
          bring who signs up for a recurring service.
        </p>
        <div className="referral-promo-popup__actions">
          <Link
            to="/become-a-referrer"
            className="referral-promo-popup__cta"
            onClick={handleClose}
          >
            Become a Referrer
          </Link>
          <button className="referral-promo-popup__dismiss" onClick={handleClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralPromoPopup;

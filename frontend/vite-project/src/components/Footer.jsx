
import "../styles/components/footer.scss";
import logo from '../assets/careproLogoWhite.svg';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>CAREPRO</h4>
          <ul>
            <li>
              <Link to="/care-facts">Healthcare facts</Link>
            </li>
            <li>
              <Link to="/our-process">Caregiver Process</Link>
            </li>
            <li>
              <Link to="/plans">Our Plans</Link>
            </li>
            <li>
              <Link to="/contentful-blog">Blogs</Link>
            </li>
            {/* <li>Contact us</li> */}
          </ul>
        </div>
        <div className="footer-column">
          <h4>LEGAL</h4>
          <ul>
            <li>
              <Link to="/privacy-policy">Privacy policy</Link>
            </li>
            <li>
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/refund-policy">Refund Policy</Link>
            </li>
          </ul>
        </div>
        <div className="footer-column">
          {/* <h4>CONTACT US</h4>
          <ul>
            <li>+234 813 195 2778</li>
          </ul>
          <h4>EMAIL</h4> */}
          {/* <ul>
            <li>careproorg@gmail.com</li>
            <li>codesquare.team@oncarepro.com</li>
          </ul> */}
        </div>
        <div className="footer-column">
          {/* <h4>ADDRESS</h4>
          <ul>
            <li>12 Bisiriyu Lawal Str, Akowonjo, Lagos State</li>
          </ul> */}
        </div>
        <div className="footer-logo">
          <img src={logo} alt="Carepro Logo" />
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 — Copyright</p>
      </div>
    </footer>
  );
};

export default Footer;

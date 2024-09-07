
import "../styles/components/footer.scss";
import logo from '../assets/careproLogoWhite.svg'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h4>CAREPRO</h4>
          <ul>
            <li>Healthcare facts</li>
            <li>Caregiver Process</li>
            <li>Our Plans</li>
            <li>Blogs</li>
            <li>Contact us</li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>LEGAL</h4>
          <ul>
            <li>Privacy policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>CONTACT US</h4>
          <ul>
            <li>+1 891 989-11-91</li>
          </ul>
          <h4>EMAIL</h4>
          <ul>
            <li>info@carepro.com</li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>ADDRESS</h4>
          <ul>
            <li>1801 Thornridge Cir. Shiloh, Hawaii 81063</li>
          </ul>
        </div>
        <div className="footer-logo">
          <img src={logo} alt="Carepro Logo" />
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 — Copyright</p>
      </div>
    </footer>
  );
};

export default Footer;

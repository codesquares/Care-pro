import "../styles/components/authCarousel.scss";
import authImage from "../assets/authImage.png";


const AuthCarousel = () => {
  return (
    <div className="auth-carousel">
      <img
        src={authImage} // Replace with your image or carousel logic
        alt="Mental health awareness"
      />
      {/* <p>
        “Mental health disorders are among the leading causes of disability
        worldwide”
      </p> */}
    </div>
  );
};

export default AuthCarousel;

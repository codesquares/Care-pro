import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurseAndWoman.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";
import { useAuth } from "../main-app/context/AuthContext";

const BookCaregiver = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect caregivers to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'caregiver') {
      navigate('/app/caregiver/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  // Handle TopBanner button click - smart navigation based on auth status
  const handleBookCaregiver = () => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'client') {
      // Authenticated clients go to dashboard to browse gigs
      navigate('/app/client/dashboard');
    } else {
      // Non-authenticated users go to register
      navigate('/register');
    }
  };
  
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Hire a Caregiver  today!"
        description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
        buttonText="Book a Caregiver"
        imageUrl={genralImg}
        onButtonClick={handleBookCaregiver}
        backgroundColor="#373732"
      />
      <WhyCarepro />
      <CaregiverProcess />
      <HealthcareFacts/>
      <FAQ/>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
       option="bookCaregiver" />
    </div>
  );
};

export default BookCaregiver;
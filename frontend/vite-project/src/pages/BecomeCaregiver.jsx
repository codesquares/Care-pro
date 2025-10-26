import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurse.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";
import QualityHealthCareCards from "../components/QualityHealthCareCards";
import OurBlogs from "../components/OurBlogs";
import { useAuth } from "../main-app/context/AuthContext";



const BecomeCaregiver = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    
    // Redirect caregivers to their dashboard
    useEffect(() => {
      if (isAuthenticated && user?.role?.toLowerCase() === 'caregiver') {
        navigate('/app/caregiver/dashboard', { replace: true });
      }
    }, [isAuthenticated, user, navigate]);
    
    // Handle TopBanner button click - redirect to register
    const handleBecomeCaregiver = () => {
      navigate('/register');
    };
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Become Caregiver"
        description="As a Carepro caregiver, you have the opportunity to support your patients while also building a rewarding career in healthcare. Take the first step today!."
        buttonText="Become a Caregiver"
        imageUrl={genralImg}
        onButtonClick={handleBecomeCaregiver}
        backgroundColor="#015476"
      />
      <WhyCarepro/>
      <QualityHealthCareCards/>
      <CaregiverProcess
        buttonText="Become a Caregiver "
        title="How Carepro Works"
        btnBgColor="#015476"
         />
      {/* <OurBlogs/> */}
      <HealthcareFacts/>
      <FAQ/>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} option="becomeCaregiver" />    
    </div>
  );    
};

export default BecomeCaregiver;
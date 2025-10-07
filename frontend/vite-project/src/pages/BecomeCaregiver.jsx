import { useState } from "react";
import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurse.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";
import QualityHealthCareCards from "../components/QualityHealthCareCards";
import OurBlogs from "../components/OurBlogs";



const BecomeCaregiver = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Become Caregiver"
        description="As a Carepro caregiver, you have the opportunity to support your patients while also building a rewarding career in healthcare. Take the first step today!."
        buttonText="Become a Caregiver"
        imageUrl={genralImg}
        onButtonClick={() => setIsModalOpen(true)}
        backgroundColor="#015476"
      />
      <WhyCarepro/>
      <QualityHealthCareCards/>
      <CaregiverProcess
        buttonText="Become a Caregiver "
        title="How Carepro Works"
        btnBgColor="#015476"
         />
      <OurBlogs/>
      <HealthcareFacts/>
      <FAQ/>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} option="becomeCaregiver" />    
    </div>
  );    
};

export default BecomeCaregiver;
import React, { useState } from "react";
import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurse.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";

const BecomeCaregiver = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Become Caregiver today!"
        description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
        buttonText="Become a Caregiver"
        imageUrl={genralImg}
        onButtonClick={() => setIsModalOpen(true)}
        backgroundColor="#015476"
      />
      <WhyCarepro/>
      <CaregiverProcess
        buttonText="Become a Caregiver"
        title="How it Works"
        btnBgColor="#015476"
         />
      <HealthcareFacts/>
      <FAQ/>
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} option="becomeCaregiver" />    
    </div>
  );    
};

export default BecomeCaregiver;
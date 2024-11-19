import { useState } from "react";
import TopBanner from "../components/TopBanner";
import genralImg from "../assets/nurseAndWoman.png";
import HealthcareFacts from "../components/LandingPage/HealthcareFacts";
import FAQ from "../components/LandingPage/FAQ";
import CaregiverProcess from "../components/LandingPage/CaregiverProcess";
import WhyCarepro from "../components/WhyCare-Pro";
import WaitlistModal from "../components/WaitListModal";

const BookCaregiver = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="book-caregiver">
      <TopBanner
        title="Hire a Caregiver  today!"
        description="As a Carepro caregiver, you have the opportunity to make an incredible difference the minute you walk through the door, helping your clients live a happier life in their own home."
        buttonText="Book a Caregiver"
        imageUrl={genralImg}
        onButtonClick={() => setIsModalOpen(true)}
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